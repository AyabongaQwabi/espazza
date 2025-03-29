import { NextResponse } from 'next/server';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export async function POST(request: Request) {
  try {
    const supabase = createClientComponentClient();
    const body = await request.json();
    const { couponCode } = body;

    if (!couponCode) {
      return NextResponse.json(
        { error: 'Coupon code is required' },
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
    // Query the coupons table to validate the coupon
    const { data: coupon, error: couponError } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', couponCode)
      .single();

    if (couponError || !coupon) {
      return NextResponse.json(
        { valid: false, message: 'Invalid coupon code' },
        { status: 200 }
      );
    }

    // Check if coupon is expired
    if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
      return NextResponse.json(
        { valid: false, message: 'Coupon has expired' },
        { status: 200 }
      );
    }

    // Check if coupon has reached its usage limit
    if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
      return NextResponse.json(
        { valid: false, message: 'Coupon usage limit reached' },
        { status: 200 }
      );
    }

    // Check if user has already used this coupon (if it's a one-time-per-user coupon)
    if (coupon.one_time_per_user) {
      const { data: usageData, error: usageError } = await supabase
        .from('coupon_usage')
        .select('*')
        .eq('coupon_id', coupon.id)
        .eq('user_id', user.id)
        .single();

      if (usageData) {
        return NextResponse.json(
          { valid: false, message: 'You have already used this coupon' },
          { status: 200 }
        );
      }
    }

    // Coupon is valid
    return NextResponse.json({
      valid: true,
      discount: coupon.discount_amount,
      discountType: coupon.discount_type, // 'percentage' or 'fixed'
      message: 'Coupon applied successfully',
      couponId: coupon.id,
    });
  } catch (error) {
    console.error('Error validating coupon:', error);
    return NextResponse.json(
      { error: 'Failed to validate coupon' },
      { status: 500 }
    );
  }
}
