import { NextResponse } from 'next/server';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export async function POST(request: Request) {
  try {
    const supabase = createClientComponentClient();
    const body = await request.json();
    const { couponId, releaseId } = body;

    if (!couponId || !releaseId) {
      return NextResponse.json(
        { error: 'Coupon ID and Release ID are required' },
        { status: 400 }
      );
    }

    // Check if the user is authenticated
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', body.profileId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Please login or create a new account' },
        { status: 401 }
      );
    }

    // Begin a transaction
    const { data: coupon, error: couponError } = await supabase
      .from('coupons')
      .select('*')
      .eq('id', couponId)
      .single();

    if (couponError || !coupon) {
      return NextResponse.json({ error: 'Invalid coupon' }, { status: 400 });
    }

    // Record coupon usage
    const { error: usageError } = await supabase.from('coupon_usage').insert({
      coupon_id: couponId,
      user_id: body.profileId,
      release_id: releaseId,
      used_at: new Date().toISOString(),
    });

    if (usageError) {
      return NextResponse.json(
        { error: 'Failed to record coupon usage' },
        { status: 500 }
      );
    }

    // Increment the usage count for the coupon
    const { error: updateError } = await supabase
      .from('coupons')
      .update({ usage_count: (coupon.usage_count || 0) + 1 })
      .eq('id', couponId);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update coupon usage count' },
        { status: 500 }
      );
    }

    // Mark the release as paid
    const { error: releaseError } = await supabase
      .from('releases')
      .update({
        is_paid: true,
        payment_method: 'coupon',
        payment_date: new Date().toISOString(),
        coupon_id: couponId,
      })
      .eq('id', releaseId);

    if (releaseError) {
      return NextResponse.json(
        { error: 'Failed to update release payment status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Coupon redeemed successfully',
    });
  } catch (error) {
    console.error('Error redeeming coupon:', error);
    return NextResponse.json(
      { error: 'Failed to redeem coupon' },
      { status: 500 }
    );
  }
}
