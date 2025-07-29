import { type NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import { v4 as uuidv4 } from "uuid"

const AUDIT_LOG_FILE = path.join(process.cwd(), "upload", "audit-log.json")

// Ensure audit log file exists
async function ensureAuditLogFile() {
  try {
    await fs.access(AUDIT_LOG_FILE)
  } catch {
    await fs.mkdir(path.dirname(AUDIT_LOG_FILE), { recursive: true })
    await fs.writeFile(AUDIT_LOG_FILE, JSON.stringify([], null, 2))
  }
}

// Load audit logs from JSON file
async function loadAuditLogs() {
  try {
    await ensureAuditLogFile()
    const data = await fs.readFile(AUDIT_LOG_FILE, "utf-8")
    return JSON.parse(data)
  } catch {
    return []
  }
}

// Save audit logs to JSON file
async function saveAuditLogs(logs: any[]) {
  await ensureAuditLogFile()
  await fs.writeFile(AUDIT_LOG_FILE, JSON.stringify(logs, null, 2))
}

export async function GET() {
  try {
    const logs = await loadAuditLogs()
    
    // Return last 100 entries, sorted by timestamp descending
    const sortedLogs = logs
      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 100)

    return NextResponse.json(sortedLogs)
  } catch (error) {
    console.error("Error fetching audit logs:", error)
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ip, mac, action, details } = body

    const newLog = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      ip,
      mac,
      action,
      details
    }

    const logs = await loadAuditLogs()
    logs.unshift(newLog) // Add to beginning of array
    
    // Keep only last 1000 entries to prevent file from growing too large
    if (logs.length > 1000) {
      logs.splice(1000)
    }
    
    await saveAuditLogs(logs)

    return NextResponse.json(newLog)
  } catch (error) {
    console.error("Error creating audit log:", error)
    return NextResponse.json({ error: "Failed to create audit log" }, { status: 500 })
  }
}
