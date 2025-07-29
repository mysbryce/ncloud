"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Cloud,
  FolderPlus,
  Search,
  History,
  Home,
  ChevronRight,
  Grid3X3,
  List,
  SortAsc,
  Loader2,
  Check,
} from "lucide-react"
import { FileItem } from "./file-item"
import { UploadArea } from "./upload-area"
import { AuditLog } from "./audit-log"
import { useToast } from "@/hooks/use-toast"
import { UploadProgress, type UploadItem } from "./upload-progress"

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

type SortOption = "name" | "date" | "size" | "type"
type SortOrder = "asc" | "desc"

// Sort Dropdown Component
function SortDropdown({
  sortBy,
  sortOrder,
  onSortChange,
}: {
  sortBy: SortOption
  sortOrder: SortOrder
  onSortChange: (sortBy: SortOption, sortOrder: SortOrder) => void
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

  const sortOptions = [
    { value: "name", label: "ชื่อ" },
    { value: "date", label: "วันที่แก้ไข" },
    { value: "size", label: "ขนาด" },
    { value: "type", label: "ประเภท" },
  ] as const

  const handleSortSelect = (newSortBy: SortOption) => {
    const newSortOrder = sortBy === newSortBy && sortOrder === "asc" ? "desc" : "asc"
    onSortChange(newSortBy, newSortOrder)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button variant="outline" size="sm" onClick={() => setIsOpen(!isOpen)}>
        <SortAsc className="h-4 w-4 mr-2" />
        เรียงตาม {sortBy} ({sortOrder})
      </Button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 z-[9999] min-w-[12rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95">
          {sortOptions.map((option) => (
            <div
              key={option.value}
              className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
              onClick={() => handleSortSelect(option.value)}
            >
              <div className="flex items-center justify-between w-full">
                <span>{option.label}</span>
                {sortBy === option.value && <Check className="h-4 w-4 text-rose-500" />}
              </div>
            </div>
          ))}
          <div className="border-t my-1" />
          <div
            className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
            onClick={() => onSortChange(sortBy, sortOrder === "asc" ? "desc" : "asc")}
          >
            <span>{sortOrder === "asc" ? "จากน้อยไปมาก" : "จากมากไปน้อย"}</span>
            {sortOrder === "desc" && <Check className="h-4 w-4 text-rose-500 ml-auto" />}
          </div>
        </div>
      )}
    </div>
  )
}

// API functions
  const api = {
    async getFiles(path = "/"): Promise<FileSystemItem[]> {
      const response = await fetch(`/api/files?path=${encodeURIComponent(path)}`)
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || "Failed to fetch files")
      }
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
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || "Failed to create file")
      }
      return response.json()
    },

    async deleteFile(id: string): Promise<void> {
      const response = await fetch(`/api/files?id=${id}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || "Failed to delete file")
      }
    },

    async moveFile(itemId: string, targetPath: string): Promise<void> {
      const response = await fetch("/api/files/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId,
          targetPath,
        }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || "Failed to move file")
      }
    },

    async getAuditLogs(): Promise<AuditEntry[]> {
      try {
        const response = await fetch("/api/audit")
        if (!response.ok) return []
        return response.json()
      } catch {
        return []
      }
    },

    async createAuditLog(log: Omit<AuditEntry, "id" | "timestamp">): Promise<AuditEntry | null> {
      try {
        const response = await fetch("/api/audit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(log),
        })
        if (!response.ok) return null
        return response.json()
      } catch {
        return null
      }
    },
  }

export function FileExplorer() {
  const { toast } = useToast()
  const [currentPath, setCurrentPath] = useState("/")
  const [items, setItems] = useState<FileSystemItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([])
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [isDragActive, setIsDragActive] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [sortBy, setSortBy] = useState<SortOption>("name")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")
  const [uploads, setUploads] = useState<UploadItem[]>([])

  // Mock IP and MAC address
  const mockIP = "192.168.1.100"
  const mockMAC = "00:1B:44:11:3A:B7"

  const addAuditEntry = async (action: string, details: string) => {
    try {
      const entry = await api.createAuditLog({
        ip: mockIP,
        mac: mockMAC,
        action,
        details,
      })
      if (entry) {
        setAuditLog((prev) => [entry, ...prev])
      }
    } catch (error) {
      console.error("Failed to create audit log:", error)
    }
  }

  const loadFiles = async (path: string = currentPath) => {
    try {
      setIsLoading(true)
      console.log("Loading files for path:", path)
      const files = await api.getFiles(path)
      console.log("Loaded files:", files)
      setItems(files || [])
    } catch (error) {
      console.error("Failed to load files:", error)
      setItems([])
      if (toast) {
        toast({
          title: "ข้อผิดพลาด",
          description: "โหลดไฟล์ไม่สำเร็จ",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const loadAuditLogs = async () => {
    try {
      const logs = await api.getAuditLogs()
      setAuditLog(logs || [])
    } catch (error) {
      console.error("Failed to load audit logs:", error)
      setAuditLog([])
    }
  }

  const pathSegments = currentPath.split("/").filter(Boolean)

  const navigateToPath = async (path: string) => {
    console.log("Navigating to path:", path)
    setCurrentPath(path)
    await loadFiles(path)
    await addAuditEntry("NAVIGATE", `Navigated to ${path}`)
  }

  const createFolder = async () => {
    if (!newFolderName.trim()) return

    try {
      const folderPath = `${currentPath}${newFolderName}/`
      console.log("Creating folder with path:", folderPath)

      const newFolder = await api.createFile({
        name: newFolderName,
        type: "folder",
        path: folderPath,
      })

      console.log("Created folder:", newFolder)
      setItems((prev) => [...prev, newFolder])
      await addAuditEntry("CREATE_FOLDER", `Created folder: ${newFolderName}`)
      setNewFolderName("")
      setIsCreateFolderOpen(false)

      if (toast) {
        toast({
          title: "สำเร็จ",
          description: `สร้างโฟลเดอร์ "${newFolderName}" สำเร็จ`,
        })
      }
    } catch (error) {
      console.error("Failed to create folder:", error)
      if (toast) {
        toast({
          title: "ข้อผิดพลาด",
          description: "สร้างโฟลเดอร์ไม่สำเร็จ",
          variant: "destructive",
        })
      }
    }
  }

  const handleFileUpload = async (files: File[]) => {
    const newUploads: UploadItem[] = files.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      progress: 0,
      status: "uploading" as const,
      abortController: new AbortController(),
    }))

    setUploads((prev) => [...prev, ...newUploads])

    // Process each file upload
    for (const uploadItem of newUploads) {
      try {
        let content: string | null = null

        // Simulate progress for file reading
        setUploads((prev) => prev.map((u) => (u.id === uploadItem.id ? { ...u, progress: 25 } : u)))

        try {
          // Read file content based on type
          if (uploadItem.file.type.startsWith("image/")) {
            content = await readFileAsDataURL(uploadItem.file)
          } else if (
            uploadItem.file.type.startsWith("text/") ||
            uploadItem.file.type === "application/json" ||
            uploadItem.file.name.endsWith(".txt") ||
            uploadItem.file.name.endsWith(".md") ||
            uploadItem.file.name.endsWith(".js") ||
            uploadItem.file.name.endsWith(".css") ||
            uploadItem.file.name.endsWith(".html")
          ) {
            content = await readFileAsText(uploadItem.file)
          } else if (uploadItem.file.type === "application/pdf") {
            content = await readFileAsDataURL(uploadItem.file)
          } else {
            content = await readFileAsDataURL(uploadItem.file)
          }
        } catch (error) {
          console.error(`Error reading file ${uploadItem.file.name}:`, error)
          content = null
        }

        // Update progress after reading
        setUploads((prev) => prev.map((u) => (u.id === uploadItem.id ? { ...u, progress: 50 } : u)))

        const filePath = currentPath + uploadItem.file.name

        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploads((prev) =>
            prev.map((u) => {
              if (u.id === uploadItem.id && u.progress < 90) {
                return { ...u, progress: u.progress + 10 }
              }
              return u
            }),
          )
        }, 200)

        // Create file via API
        const newFile = await api.createFile({
          name: uploadItem.file.name,
          type: "file",
          size: uploadItem.file.size,
          path: filePath,
          mime_type: uploadItem.file.type,
          content: content,
        })

        clearInterval(progressInterval)

        // Check if upload was cancelled
        if (uploadItem.abortController?.signal.aborted) {
          setUploads((prev) =>
            prev.map((u) => (u.id === uploadItem.id ? { ...u, status: "cancelled", progress: 0 } : u)),
          )
          continue
        }

        // Complete upload
        setUploads((prev) =>
          prev.map((u) => (u.id === uploadItem.id ? { ...u, progress: 100, status: "completed" } : u)),
        )

        setItems((prev) => [...prev, newFile])
      } catch (error) {
        console.error("Failed to upload file:", error)
        setUploads((prev) => prev.map((u) => (u.id === uploadItem.id ? { ...u, status: "error" } : u)))
      }
    }

    await addAuditEntry("UPLOAD", `Uploaded ${files.length} file(s)`)

    if (toast) {
      toast({
        title: "สำเร็จ",
        description: `อัพโหลด ${files.length} ไฟล์สำเร็จ`,
      })
    }
  }

  const handleCancelUpload = (uploadId: string) => {
    setUploads((prev) =>
      prev.map((upload) => {
        if (upload.id === uploadId && upload.status === "uploading") {
          upload.abortController?.abort()
          return { ...upload, status: "cancelled" }
        }
        return upload
      }),
    )
  }

  const handleClearUpload = (uploadId: string) => {
    setUploads((prev) => prev.filter((upload) => upload.id !== uploadId))
  }

  // Helper functions for reading files
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsText(file)
    })
  }

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const deleteItem = async (id: string) => {
    try {
      const item = items.find((i) => i.id === id)
      if (!item) return

      await api.deleteFile(id)
      setItems((prev) => prev.filter((i) => i.id !== id))
      await addAuditEntry("DELETE", `Deleted ${item.type}: ${item.name}`)

      if (toast) {
        toast({
          title: "สำเร็จ",
          description: `ลบ${item.type === "folder" ? "โฟลเดอร์" : "ไฟล์"} "${item.name}" สำเร็จ`,
        })
      }
    } catch (error) {
      console.error("Failed to delete item:", error)
      if (toast) {
        toast({
          title: "ข้อผิดพลาด",
          description: "ลบรายการไม่สำเร็จ",
          variant: "destructive",
        })
      }
    }
  }

  const moveItem = async (itemId: string, targetPath: string) => {
    try {
      const item = items.find((i) => i.id === itemId)
      if (!item) return

      await api.moveFile(itemId, targetPath)
      
      // Remove item from current view since it's been moved
      setItems((prev) => prev.filter((i) => i.id !== itemId))
      
      await addAuditEntry("MOVE", `Moved ${item.type}: ${item.name} to ${targetPath}`)

      if (toast) {
        toast({
          title: "สำเร็จ",
          description: `ย้าย${item.type === "folder" ? "โฟลเดอร์" : "ไฟล์"} "${item.name}" สำเร็จ`,
        })
      }
    } catch (error) {
      console.error("Failed to move item:", error)
      if (toast) {
        toast({
          title: "ข้อผิดพลาด",
          description: "ย้ายรายการไม่สำเร็จ",
          variant: "destructive",
        })
      }
    }
  }

  // Sort function
  const sortItems = (items: FileSystemItem[]) => {
    return [...items].sort((a, b) => {
      // Always put folders first
      if (a.type !== b.type) {
        return a.type === "folder" ? -1 : 1
      }

      let comparison = 0
      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name)
          break
        case "date":
          comparison = new Date(a.last_modified).getTime() - new Date(b.last_modified).getTime()
          break
        case "size":
          comparison = (a.size || 0) - (b.size || 0)
          break
        case "type":
          comparison = (a.mime_type || "").localeCompare(b.mime_type || "")
          break
      }

      return sortOrder === "asc" ? comparison : -comparison
    })
  }

  const handleSortChange = (newSortBy: SortOption, newSortOrder: SortOrder) => {
    setSortBy(newSortBy)
    setSortOrder(newSortOrder)
  }

  const filteredItems = sortItems(items.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase())))

  useEffect(() => {
    loadFiles()
    loadAuditLogs()
    addAuditEntry("SYSTEM", "File explorer initialized")
  }, [])

  return (
    <div className="flex h-screen bg-background">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Cloud className="h-8 w-8 text-zinc-500" />
              <h1 className="text-2xl font-bold text-zinc-500">NCloud</h1>
            </div>

            {/* Breadcrumb */}
            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
              <Button variant="ghost" size="sm" onClick={() => navigateToPath("/")} className="h-8 px-2">
                <Home className="h-4 w-4" />
              </Button>
              {pathSegments.map((segment, index) => (
                <div key={index} className="flex items-center">
                  <ChevronRight className="h-4 w-4 mx-1" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateToPath("/" + pathSegments.slice(0, index + 1).join("/") + "/")}
                    className="h-8 px-2"
                  >
                    {segment}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหาไฟล์..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="rounded-r-none"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            {/* Audit Log */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <History className="h-4 w-4 mr-2" />
                  บันทึกการใช้งาน
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[400px] sm:w-[540px]">
                <SheetHeader>
                  <SheetTitle>Audit Log</SheetTitle>
                </SheetHeader>
                <AuditLog entries={auditLog} />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 pt-20">
        <div className="p-6">
          {/* Action Bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <UploadArea onFileUpload={handleFileUpload} setIsDragActive={setIsDragActive} />

              <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <FolderPlus className="h-4 w-4 mr-2" />
                    สร้างโฟลเดอร์ใหม่
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>สร้างโฟลเดอร์ใหม่</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="folder-name">ชื่อโฟลเดอร์</Label>
                      <Input
                        id="folder-name"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="กรอกชื่อโฟลเดอร์"
                        onKeyDown={(e) => e.key === "Enter" && createFolder()}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsCreateFolderOpen(false)}>
                        ยกเลิก
                      </Button>
                      <Button onClick={createFolder}>สร้าง</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="flex items-center space-x-2">
              <Badge variant="secondary">{filteredItems.length} รายการ</Badge>
              <SortDropdown sortBy={sortBy} sortOrder={sortOrder} onSortChange={handleSortChange} />
            </div>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
              <span className="ml-2 text-muted-foreground">กำลังโหลดไฟล์...</span>
            </div>
          ) : (
            <>
              {/* File Grid/List */}
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4"
                    : "space-y-2"
                }
              >
                {filteredItems.map((item) => (
                  <FileItem
                    key={item.id}
                    item={item}
                    viewMode={viewMode}
                    onNavigate={navigateToPath}
                    onDelete={deleteItem}
                    onMove={moveItem}
                    currentPath={currentPath}
                  />
                ))}
              </div>

              {filteredItems.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Cloud className="h-12 w-12 mb-4" />
                  <p className="text-lg font-medium">ไม่พบไฟล์</p>
                  <p className="text-sm">อัพโหลดไฟล์หรือสร้างโฟลเดอร์เพื่อเริ่มต้น</p>
                </div>
              )}
            </>
          )}
        </div>
        <UploadProgress uploads={uploads} onCancel={handleCancelUpload} onClear={handleClearUpload} />
      </div>

      {isDragActive && (
        <div className="fixed inset-0 bg-zinc-500/20 border-2 border-dashed border-zinc-500 z-50 flex items-center justify-center">
          <div className="bg-background p-8 rounded-lg shadow-lg">
            <Cloud className="h-12 w-12 text-zinc-500 mx-auto mb-4" />
            <p className="text-lg font-medium text-center">วางไฟล์ที่นี่เพื่ออัพโหลด</p>
          </div>
        </div>
      )}
    </div>
  )
}
