import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { Resend } from "resend"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const resendApiKey = process.env.RESEND_API_KEY

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
const resend = new Resend(resendApiKey)

export async function POST(request: Request) {
  const { bookingId } = await request.json()

  // Fetch booking details
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("*, events(*), profiles!artist_id(*)")
    .eq("id", bookingId)
    .single()

  if (bookingError) {
    return NextResponse.json({ error: "Failed to fetch booking details" }, { status: 500 })
  }

  // Send email notification
  try {
    await resend.emails.send({
      from: "noreply@xhap.co.za",
      to: booking.profiles.email,
      subject: "New Booking Request",
      html: `
        <h1>New Booking Request</h1>
        <p>You have a new booking request for the event "${booking.events.name}".</p>
        <p>Date: ${new Date(booking.events.date).toLocaleDateString()}</p>
        <p>Venue: ${booking.events.venue}</p>
        <p>Fee: $${booking.fee}</p>
        <p>Payment Terms: ${booking.payment_terms}</p>
        <a href="https://xhap.co.za/dashboard/bookings">View Booking</a>
      `,
    })

    return NextResponse.json({ message: "Notification sent successfully" })
  } catch (error) {
    console.error("Failed to send email notification:", error)
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 })
  }
}

