import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const logs = await sql`
      SELECT id, timestamp, ip, mac, action, details
      FROM audit_logs 
      ORDER BY timestamp DESC
      LIMIT 100
    `

    return NextResponse.json(logs)
  } catch (error) {
    console.error("Error fetching audit logs:", error)
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ip, mac, action, details } = body

    const result = await sql`
      INSERT INTO audit_logs (ip, mac, action, details, timestamp)
      VALUES (${ip}, ${mac}, ${action}, ${details}, NOW())
      RETURNING id, timestamp, ip, mac, action, details
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error creating audit log:", error)
    return NextResponse.json({ error: "Failed to create audit log" }, { status: 500 })
  }
}
