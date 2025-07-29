"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { formatDate } from "@/lib/utils"

interface AuditEntry {
  id: string
  timestamp: string // Changed from Date to string
  ip: string
  mac: string
  action: string
  details: string
}

interface AuditLogProps {
  entries: AuditEntry[]
}

const getActionColor = (action: string) => {
  switch (action) {
    case "UPLOAD":
      return "bg-green-500/10 text-green-500 border-green-500/20"
    case "DELETE":
      return "bg-red-500/10 text-red-500 border-red-500/20"
    case "CREATE_FOLDER":
      return "bg-blue-500/10 text-blue-500 border-blue-500/20"
    case "NAVIGATE":
      return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
    case "SYSTEM":
      return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    default:
      return "bg-muted text-muted-foreground"
  }
}

export function AuditLog({ entries }: AuditLogProps) {
  return (
    <ScrollArea className="h-[calc(100vh-120px)] mt-4">
      <div className="space-y-3">
        {entries.map((entry) => (
          <Card key={entry.id} className="border-l-4 border-l-rose-500">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <Badge className={getActionColor(entry.action)}>{entry.action}</Badge>
                <span className="text-xs text-muted-foreground">{formatDate(new Date(entry.timestamp))}</span>
              </div>

              <p className="text-sm font-medium mb-2">{entry.details}</p>

              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <span>IP: {entry.ip}</span>
                <span>MAC: {entry.mac}</span>
              </div>
            </CardContent>
          </Card>
        ))}

        {entries.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>ยังไม่มีบันทึกการใช้งาน</p>
          </div>
        )}
      </div>
    </ScrollArea>
  )
}
