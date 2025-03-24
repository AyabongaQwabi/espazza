import { NextResponse } from "next/server"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export async function GET(request: Request) {
  try {
    const supabase = createClientComponentClient()

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

    // Get all coupons with usage data
    const { data: coupons, error: couponsError } = await supabase
      .from("coupons")
      .select(`
        *,
        coupon_usage:coupon_usage(
          id,
          user_id,
          release_id,
          used_at
        )
      `)
      .order("created_at", { ascending: false })

    if (couponsError) {
      return NextResponse.json({ error: "Failed to fetch coupons" }, { status: 500 })
    }

    return NextResponse.json({ coupons })
  } catch (error) {
    console.error("Error fetching coupons:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClientComponentClient()
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

    // Validate required fields
    if (!body.code || !body.discount_amount || !body.discount_type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if coupon code already exists
    const { data: existingCoupon, error: existingError } = await supabase
      .from("coupons")
      .select("id")
      .eq("code", body.code)
      .single()

    if (existingCoupon) {
      return NextResponse.json({ error: "Coupon code already exists" }, { status: 400 })
    }

    // Create the coupon
    const { data: coupon, error: couponError } = await supabase
      .from("coupons")
      .insert({
        code: body.code,
        discount_amount: body.discount_amount,
        discount_type: body.discount_type,
        description: body.description || null,
        expiry_date: body.expiry_date || null,
        usage_limit: body.usage_limit || null,
        one_time_per_user: body.one_time_per_user || false,
        is_active: body.is_active !== undefined ? body.is_active : true,
        created_by: user.id,
        usage_count: 0,
      })
      .select()
      .single()

    if (couponError) {
      return NextResponse.json({ error: "Failed to create coupon" }, { status: 500 })
    }

    return NextResponse.json({ coupon })
  } catch (error) {
    console.error("Error creating coupon:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

