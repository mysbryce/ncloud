"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { X, Upload, CheckCircle, XCircle } from "lucide-react"
import { formatBytes } from "@/lib/utils"

export interface UploadItem {
  id: string
  file: File
  progress: number
  status: "uploading" | "completed" | "error" | "cancelled"
  abortController?: AbortController
}

interface UploadProgressProps {
  uploads: UploadItem[]
  onCancel: (id: string) => void
  onClear: (id: string) => void
}

export function UploadProgress({ uploads, onCancel, onClear }: UploadProgressProps) {
  const [isMinimized, setIsMinimized] = useState(false)

  const activeUploads = uploads.filter(
    (upload) => upload.status === "uploading" || upload.status === "completed" || upload.status === "error",
  )

  if (activeUploads.length === 0) return null

  const completedCount = activeUploads.filter((u) => u.status === "completed").length
  const totalCount = activeUploads.length
  const hasActiveUploads = activeUploads.some((u) => u.status === "uploading")

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80">
      <Card className="shadow-lg border-2">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Upload className="h-4 w-4 text-zinc-500" />
              <span className="text-sm font-medium">
                {hasActiveUploads ? "กำลังอัพโหลด" : "อัพโหลดเสร็จสิ้น"} ({completedCount}/{totalCount})
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIsMinimized(!isMinimized)} className="h-6 w-6 p-0">
              {isMinimized ? "↑" : "↓"}
            </Button>
          </div>

          {/* Upload List */}
          {!isMinimized && (
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {activeUploads.map((upload) => (
                <div key={upload.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" title={upload.file.name}>
                        {upload.file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatBytes(upload.file.size)}</p>
                    </div>

                    <div className="flex items-center space-x-2 ml-2">
                      {upload.status === "uploading" && (
                        <Button variant="ghost" size="sm" onClick={() => onCancel(upload.id)} className="h-6 w-6 p-0">
                          <X className="h-3 w-3" />
                        </Button>
                      )}

                      {upload.status === "completed" && (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <Button variant="ghost" size="sm" onClick={() => onClear(upload.id)} className="h-6 w-6 p-0">
                            <X className="h-3 w-3" />
                          </Button>
                        </>
                      )}

                      {upload.status === "error" && (
                        <>
                          <XCircle className="h-4 w-4 text-red-500" />
                          <Button variant="ghost" size="sm" onClick={() => onClear(upload.id)} className="h-6 w-6 p-0">
                            <X className="h-3 w-3" />
                          </Button>
                        </>
                      )}

                      {upload.status === "cancelled" && (
                        <>
                          <XCircle className="h-4 w-4 text-yellow-500" />
                          <Button variant="ghost" size="sm" onClick={() => onClear(upload.id)} className="h-6 w-6 p-0">
                            <X className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {upload.status === "uploading" && (
                    <div className="space-y-1">
                      <Progress value={upload.progress} className="h-2" />
                      <p className="text-xs text-muted-foreground text-right">{Math.round(upload.progress)}%</p>
                    </div>
                  )}

                  {upload.status === "error" && <p className="text-xs text-red-500">อัพโหลดไม่สำเร็จ</p>}

                  {upload.status === "cancelled" && <p className="text-xs text-yellow-600">ยกเลิกการอัพโหลด</p>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
