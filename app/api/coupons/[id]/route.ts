import { NextResponse } from "next/server"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClientComponentClient()
    const id = params.id

    // Check if the user is authenticated and is an admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single()

    if (profileError || !profile || !profile.is_admin) {
      return NextResponse.json({ error: "Admin privileges required" }, { status: 403 })
    }

    // Get coupon with usage data
    const { data: coupon, error: couponError } = await supabase
      .from("coupons")
      .select(`
        *,
        coupon_usage:coupon_usage(
          id,
          user_id,
          release_id,
          used_at,
          profiles:user_id(username, email)
        )
      `)
      .eq("id", id)
      .single()

    if (couponError) {
      return NextResponse.json({ error: "Failed to fetch coupon" }, { status: 500 })
    }

    return NextResponse.json({ coupon })
  } catch (error) {
    console.error("Error fetching coupon:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClientComponentClient()
    const id = params.id
    const body = await request.json()

    // Check if the user is authenticated and is an admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single()

    if (profileError || !profile || !profile.is_admin) {
      return NextResponse.json({ error: "Admin privileges required" }, { status: 403 })
    }

    // Check if coupon exists
    const { data: existingCoupon, error: existingError } = await supabase
      .from("coupons")
      .select("id, code")
      .eq("id", id)
      .single()

    if (existingError || !existingCoupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 })
    }

    // If code is being changed, check if the new code already exists
    if (body.code && body.code !== existingCoupon.code) {
      const { data: codeExists, error: codeError } = await supabase
        .from("coupons")
        .select("id")
        .eq("code", body.code)
        .single()

      if (codeExists) {
        return NextResponse.json({ error: "Coupon code already exists" }, { status: 400 })
      }
    }

    // Update the coupon
    const { data: coupon, error: couponError } = await supabase
      .from("coupons")
      .update({
        code: body.code,
        discount_amount: body.discount_amount,
        discount_type: body.discount_type,
        description: body.description,
        expiry_date: body.expiry_date,
        usage_limit: body.usage_limit,
        one_time_per_user: body.one_time_per_user,
        is_active: body.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (couponError) {
      return NextResponse.json({ error: "Failed to update coupon" }, { status: 500 })
    }

    return NextResponse.json({ coupon })
  } catch (error) {
    console.error("Error updating coupon:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClientComponentClient()
    const id = params.id

    // Check if the user is authenticated and is an admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single()

    if (profileError || !profile || !profile.is_admin) {
      return NextResponse.json({ error: "Admin privileges required" }, { status: 403 })
    }

    // Check if coupon has been used
    const { count, error: usageError } = await supabase
      .from("coupon_usage")
      .select("id", { count: "exact" })
      .eq("coupon_id", id)

    if (count && count > 0) {
      // If coupon has been used, just mark it as inactive instead of deleting
      const { error: updateError } = await supabase
        .from("coupons")
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)

      if (updateError) {
        return NextResponse.json({ error: "Failed to deactivate coupon" }, { status: 500 })
      }

      return NextResponse.json({
        message: "Coupon has been used and cannot be deleted. It has been deactivated instead.",
        deactivated: true,
      })
    }

    // Delete the coupon if it hasn't been used
    const { error: deleteError } = await supabase.from("coupons").delete().eq("id", id)

    if (deleteError) {
      return NextResponse.json({ error: "Failed to delete coupon" }, { status: 500 })
    }

    return NextResponse.json({
      message: "Coupon deleted successfully",
      deleted: true,
    })
  } catch (error) {
    console.error("Error deleting coupon:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

