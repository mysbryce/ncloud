interface FileSystemItem {
  id: string
  name: string
  type: "file" | "folder"
  size?: number
  last_modified: string
  path: string
  mime_type?: string
  content?: string | ArrayBuffer | null
}

interface AuditEntry {
  id: string
  timestamp: string
  ip: string
  mac: string
  action: string
  details: string
}

export const api = {
  // File operations
  async getFiles(path = "/"): Promise<FileSystemItem[]> {
    const response = await fetch(`/api/files?path=${encodeURIComponent(path)}`)
    if (!response.ok) throw new Error("Failed to fetch files")
    return response.json()
  },

  async createFile(file: Omit<FileSystemItem, "id" | "last_modified">): Promise<FileSystemItem> {
    const response = await fetch("/api/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: file.name,
        type: file.type,
        size: file.size,
        path: file.path,
        mimeType: file.mime_type,
        content: file.content,
      }),
    })
    if (!response.ok) throw new Error("Failed to create file")
    return response.json()
  },

  async deleteFile(id: string): Promise<void> {
    const response = await fetch(`/api/files?id=${id}`, {
      method: "DELETE",
    })
    if (!response.ok) throw new Error("Failed to delete file")
  },

  // Audit operations
  async getAuditLogs(): Promise<AuditEntry[]> {
    const response = await fetch("/api/audit")
    if (!response.ok) throw new Error("Failed to fetch audit logs")
    return response.json()
  },

  async createAuditLog(log: Omit<AuditEntry, "id" | "timestamp">): Promise<AuditEntry> {
    const response = await fetch("/api/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(log),
    })
    if (!response.ok) throw new Error("Failed to create audit log")
    return response.json()
  },
}
