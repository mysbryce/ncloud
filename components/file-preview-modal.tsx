"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Download, X, FileText, AlertCircle } from "lucide-react"
import { formatBytes } from "@/lib/utils"

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

interface FilePreviewModalProps {
  file: FileSystemItem | null
  isOpen: boolean
  onClose: () => void
}

export function FilePreviewModal({ file, isOpen, onClose }: FilePreviewModalProps) {
  const [previewContent, setPreviewContent] = useState<string | null>(null)
  const [previewType, setPreviewType] = useState<"image" | "text" | "pdf" | "unsupported">("unsupported")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!file || !isOpen) {
      setPreviewContent(null)
      setPreviewType("unsupported")
      return
    }

    setIsLoading(true)

    // Determine preview type based on mime type
    if (file.mime_type?.startsWith("image/")) {
      setPreviewType("image")
      if (file.content) {
        setPreviewContent(file.content as string)
      }
    } else if (
      file.mime_type?.startsWith("text/") ||
      file.mime_type === "application/json" ||
      file.mime_type === "application/javascript" ||
      file.name.endsWith(".md") ||
      file.name.endsWith(".txt") ||
      file.name.endsWith(".js") ||
      file.name.endsWith(".ts") ||
      file.name.endsWith(".jsx") ||
      file.name.endsWith(".tsx") ||
      file.name.endsWith(".css") ||
      file.name.endsWith(".html") ||
      file.name.endsWith(".json")
    ) {
      setPreviewType("text")
      if (file.content) {
        setPreviewContent(file.content as string)
      }
    } else if (file.mime_type === "application/pdf") {
      setPreviewType("pdf")
      if (file.content) {
        setPreviewContent(file.content as string)
      }
    } else {
      setPreviewType("unsupported")
    }

    setIsLoading(false)
  }, [file, isOpen])

  const downloadFile = () => {
    if (!file || !file.content) return

    let blob: Blob

    // Check if content is a data URL (for images)
    if (typeof file.content === "string" && file.content.startsWith("data:")) {
      // Convert data URL to blob
      const byteCharacters = atob(file.content.split(",")[1])
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      blob = new Blob([byteArray], { type: file.mime_type || "application/octet-stream" })
    } else {
      // For text files and other content
      blob = new Blob([file.content], { type: file.mime_type || "application/octet-stream" })
    }

    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = file.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!file) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <DialogTitle className="truncate">{file.name}</DialogTitle>
              <Badge variant="secondary">{file.size ? formatBytes(file.size) : "—"}</Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={downloadFile}>
                <Download className="h-4 w-4 mr-2" />
                ดาวน์โหลด
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-500"></div>
            </div>
          ) : (
            <>
              {previewType === "image" && previewContent && (
                <div className="flex items-center justify-center h-full bg-muted/30 rounded-lg">
                  <img
                    src={previewContent || "/placeholder.svg"}
                    alt={file.name}
                    className="max-w-full max-h-full object-contain"
                    crossOrigin="anonymous"
                  />
                </div>
              )}

              {previewType === "text" && previewContent && (
                <ScrollArea className="h-full border rounded-lg">
                  <pre className="p-4 text-sm font-mono whitespace-pre-wrap">{previewContent}</pre>
                </ScrollArea>
              )}

              {previewType === "pdf" && previewContent && (
                <div className="h-full border rounded-lg">
                  <iframe src={previewContent} className="w-full h-full rounded-lg" title={`ตัวอย่างของ ${file.name}`} />
                </div>
              )}

              {previewType === "unsupported" && (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mb-4" />
                  <h3 className="text-lg font-medium mb-2">ไม่สามารถแสดงตัวอย่างไฟล์นี้ได้</h3>
                  <p className="text-sm text-center mb-4">
                    ไฟล์ประเภท {file.mime_type || "ไม่ทราบ"} ไม่รองรับการแสดงตัวอย่าง
                  </p>
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm">คุณสามารถดาวน์โหลดไฟล์เพื่อเปิดด้วยโปรแกรมที่เหมาะสม</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
