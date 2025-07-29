"use client"

import type React from "react"

import { useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"

interface UploadAreaProps {
  onFileUpload: (files: File[]) => void
  setIsDragActive: (active: boolean) => void
}

export function UploadArea({ onFileUpload, setIsDragActive }: UploadAreaProps) {
  const handleFileSelect = useCallback(() => {
    const input = document.createElement("input")
    input.type = "file"
    input.multiple = true
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || [])
      if (files.length > 0) {
        onFileUpload(files)
      }
    }
    input.click()
  }, [onFileUpload])

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragActive(true)
    },
    [setIsDragActive],
  )

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragActive(false)
    },
    [setIsDragActive],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragActive(false)
      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        onFileUpload(files)
      }
    },
    [onFileUpload, setIsDragActive],
  )

  return (
    <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
      <Button onClick={handleFileSelect} className="bg-zinc-500 hover:bg-zinc-600">
        <Upload className="h-4 w-4 mr-2" />
        อัพโหลดไฟล์
      </Button>
    </div>
  )
}
