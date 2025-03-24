import { NextResponse } from "next/server"
import axios from "axios"

const API_ENDPOINT = "https://online.yoco.com/v1/charges"
const SECRET_KEY = process.env.YOCO_SECRET_KEY?.trim()

export async function POST(request: Request) {
  try {
    if (!SECRET_KEY) {
      throw new Error("Missing Yoco API credentials")
    }
    console.log("Yoco API credentials available")

    const body = await request.json()
    console.log("Payment API request body:", body)

    // Validate required fields
    if (!body.token || !body.amountInCents || !body.currency) {
      throw new Error("Missing required fields: token, amountInCents, or currency")
    }

    const payload = {
      token: body.token,
      amountInCents: body.amountInCents,
      currency: body.currency,
      metadata: {
        releaseId: body.releaseId || "",
        userId: body.userId || "",
        transactionId: body.transactionId || "",
        description: body.description || "Release listing payment",
      },
    }

    // Create authorization header with secret key
    const authHeader = Buffer.from(`${SECRET_KEY}:`).toString("base64")

    const response = await axios.post(API_ENDPOINT, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${authHeader}`,
      },
    })

    console.log("Yoco Payment API response:", response.data)
    return NextResponse.json(response.data)
  } catch (error) {
    console.error("Payment API error:", error)

    if (axios.isAxiosError(error)) {
      if (error.response) {
        console.error("Error data:", error.response.data)
        console.error("Error status:", error.response.status)
        console.error("Error headers:", error.response.headers)

        return NextResponse.json(
          {
            error: "Payment API request failed",
            details: error.response.data,
            status: error.response.status,
          },
          { status: error.response.status },
        )
      } else if (error.request) {
        console.error("No response received:", error.request)
        return NextResponse.json({ error: "No response received from Payment API" }, { status: 503 })
      } else {
        console.error("Error message:", error.message)
        return NextResponse.json({ error: "Error setting up the request", message: error.message }, { status: 500 })
      }
    } else {
      console.error("Non-Axios error:", error)
      return NextResponse.json(
        {
          error: "An unexpected error occurred",
          message: (error as Error).message,
        },
        { status: 500 },
      )
    }
  }
}

