"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Folder,
  FileText,
  ImageIcon,
  FileVideo,
  FileAudio,
  Archive,
  Code,
  FileSpreadsheet,
  FileImage,
  MoreVertical,
  Download,
  Trash2,
  Eye,
} from "lucide-react"
import { formatBytes, formatDate } from "@/lib/utils"
import { FilePreviewModal } from "./file-preview-modal"

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

interface FileItemProps {
  item: FileSystemItem
  viewMode: "grid" | "list"
  onNavigate: (path: string) => void
  onDelete: (id: string) => void
}

const getFileIcon = (mimeType?: string, fileName?: string) => {
  if (!mimeType && !fileName) return FileText

  const extension = fileName?.split(".").pop()?.toLowerCase()

  if (mimeType?.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(extension || "")) {
    return ImageIcon
  }
  if (mimeType?.startsWith("video/") || ["mp4", "avi", "mov", "wmv", "flv"].includes(extension || "")) {
    return FileVideo
  }
  if (mimeType?.startsWith("audio/") || ["mp3", "wav", "flac", "aac"].includes(extension || "")) {
    return FileAudio
  }
  if (["zip", "rar", "7z", "tar", "gz"].includes(extension || "")) {
    return Archive
  }
  if (["js", "ts", "jsx", "tsx", "html", "css", "py", "java", "cpp", "c"].includes(extension || "")) {
    return Code
  }
  if (["xlsx", "xls", "csv"].includes(extension || "")) {
    return FileSpreadsheet
  }
  if (["pdf"].includes(extension || "")) {
    return FileImage
  }

  return FileText
}

// Check if file is an image and has content for thumbnail
const isImageWithContent = (item: FileSystemItem) => {
  return (
    item.type === "file" &&
    item.mime_type?.startsWith("image/") &&
    item.content &&
    typeof item.content === "string" &&
    item.content.startsWith("data:image/")
  )
}

// Custom Dropdown Component
function CustomDropdown({
  trigger,
  children,
  align = "end",
}: {
  trigger: React.ReactNode
  children: React.ReactNode
  align?: "start" | "end"
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
      >
        {trigger}
      </div>

      {isOpen && (
        <div
          className={`absolute top-full mt-1 ${align === "end" ? "right-0" : "left-0"} z-[9999] min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95`}
        >
          <div onClick={() => setIsOpen(false)}>{children}</div>
        </div>
      )}
    </div>
  )
}

function DropdownMenuItem({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode
  onClick?: (e: React.MouseEvent) => void
  className?: string
}) {
  return (
    <div
      className={`relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

export function FileItem({ item, viewMode, onNavigate, onDelete }: FileItemProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const handleClick = () => {
    if (item.type === "folder") {
      onNavigate(item.path)
    }
  }

  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsPreviewOpen(true)
  }

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!item.content) return

    let blob: Blob

    // Check if content is a data URL (for images)
    if (typeof item.content === "string" && item.content.startsWith("data:")) {
      // Convert data URL to blob
      const byteCharacters = atob(item.content.split(",")[1])
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      blob = new Blob([byteArray], { type: item.mime_type || "application/octet-stream" })
    } else {
      // For text files and other content
      blob = new Blob([item.content], { type: item.mime_type || "application/octet-stream" })
    }

    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = item.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm(`คุณแน่ใจหรือไม่ที่จะลบ "${item.name}"?`)) {
      onDelete(item.id)
    }
  }

  const IconComponent = item.type === "folder" ? Folder : getFileIcon(item.mime_type, item.name)
  const showThumbnail = isImageWithContent(item)

  if (viewMode === "list") {
    return (
      <>
        <Card className="hover:bg-muted/50 transition-colors">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1 cursor-pointer" onClick={handleClick}>
                {showThumbnail ? (
                  <div className="w-5 h-5 rounded overflow-hidden flex-shrink-0">
                    <img
                      src={(item.content as string) || "/placeholder.svg"}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                    />
                  </div>
                ) : (
                  <IconComponent
                    className={`h-5 w-5 flex-shrink-0 ${item.type === "folder" ? "text-rose-500" : "text-muted-foreground"}`}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(new Date(item.last_modified))} • {item.size ? formatBytes(item.size) : "—"}
                  </p>
                </div>
              </div>

              <CustomDropdown
                trigger={
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                }
              >
                <DropdownMenuItem onClick={handlePreview}>
                  <Eye className="h-4 w-4 mr-2" />
                  ดูตัวอย่าง
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  ดาวน์โหลด
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  ลบ
                </DropdownMenuItem>
              </CustomDropdown>
            </div>
          </CardContent>
        </Card>
        <FilePreviewModal file={item} isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} />
      </>
    )
  }

  return (
    <>
      <Card
        className="hover:bg-muted/50 transition-all duration-200 cursor-pointer group relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
      >
        <CardContent className="p-4">
          <div className="flex flex-col items-center space-y-2">
            <div className="relative">
              {showThumbnail ? (
                <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-muted">
                  <img
                    src={(item.content as string) || "/placeholder.svg"}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                  />
                </div>
              ) : (
                <IconComponent
                  className={`h-12 w-12 ${item.type === "folder" ? "text-rose-500" : "text-muted-foreground"}`}
                />
              )}
              {isHovered && (
                <div className="absolute -top-2 -right-2">
                  <CustomDropdown
                    trigger={
                      <Button variant="secondary" size="sm" className="h-6 w-6 p-0">
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    }
                  >
                    <DropdownMenuItem onClick={handlePreview}>
                      <Eye className="h-4 w-4 mr-2" />
                      ดูตัวอย่าง
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDownload}>
                      <Download className="h-4 w-4 mr-2" />
                      ดาวน์โหลด
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      ลบ
                    </DropdownMenuItem>
                  </CustomDropdown>
                </div>
              )}
            </div>

            <div className="text-center w-full">
              <p className="font-medium text-sm truncate" title={item.name}>
                {item.name}
              </p>
              {item.size && (
                <Badge variant="secondary" className="text-xs mt-1">
                  {formatBytes(item.size)}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      <FilePreviewModal file={item} isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} />
    </>
  )
}
