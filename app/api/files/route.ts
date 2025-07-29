import { type NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import { v4 as uuidv4 } from "uuid"

const UPLOAD_DIR = path.join(process.cwd(), "upload")
const METADATA_FILE = path.join(process.cwd(), "upload", "metadata.json")

// Ensure upload directory exists
async function ensureUploadDir() {
  try {
    await fs.access(UPLOAD_DIR)
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true })
  }
}

// Load metadata from JSON file
async function loadMetadata() {
  try {
    await ensureUploadDir()
    const data = await fs.readFile(METADATA_FILE, "utf-8")
    return JSON.parse(data)
  } catch {
    return []
  }
}

// Save metadata to JSON file
async function saveMetadata(metadata: any[]) {
  await ensureUploadDir()
  await fs.writeFile(METADATA_FILE, JSON.stringify(metadata, null, 2))
}

// Get file path for a given item
function getFilePath(itemPath: string) {
  return path.join(UPLOAD_DIR, itemPath.replace(/^\//, ""))
}

// Get directory path for a given item
function getDirPath(itemPath: string) {
  return path.join(UPLOAD_DIR, itemPath.replace(/^\//, "").replace(/\/$/, ""))
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const requestedPath = searchParams.get("path") || "/"

    console.log("Fetching files for path:", requestedPath)

    const metadata = await loadMetadata()
    
    // Filter files for current path
    const filteredFiles = metadata.filter((file: any) => {
      if (requestedPath === "/") {
        // Root directory: show files directly in root and folders one level deep
        if (file.type === "file") {
          return file.path === "/" + file.name
        } else {
          return file.path === "/" + file.name + "/"
        }
      } else {
        // Subdirectory: show files and folders that are direct children
        if (file.type === "file") {
          return file.path === requestedPath + file.name
        } else {
          return file.path === requestedPath + file.name + "/"
        }
      }
    })

    console.log("Filtered files:", filteredFiles)
    return NextResponse.json(filteredFiles)
  } catch (error) {
    console.error("Error fetching files:", error)
    return NextResponse.json({ error: "Failed to fetch files", details: (error as Error).message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, type, size, path: itemPath, mimeType, content } = body

    console.log("Creating file:", { name, type, itemPath })

    // Validate required fields
    if (!name || !type || !itemPath) {
      return NextResponse.json({ error: "Missing required fields: name, type, path" }, { status: 400 })
    }

    await ensureUploadDir()

    const newItem = {
      id: uuidv4(),
      name,
      type,
      size: size || null,
      path: itemPath,
      mime_type: mimeType || null,
      content: content || null,
      last_modified: new Date().toISOString()
    }

    if (type === "folder") {
      // Create directory
      const dirPath = getDirPath(itemPath)
      await fs.mkdir(dirPath, { recursive: true })
    } else {
      // Create file
      const filePath = getFilePath(itemPath)
      const dirPath = path.dirname(filePath)
      
      // Ensure directory exists
      await fs.mkdir(dirPath, { recursive: true })
      
      // Write file content
      if (content) {
        if (typeof content === "string" && content.startsWith("data:")) {
          // Handle data URLs (for images)
          const base64Data = content.split(",")[1]
          const buffer = Buffer.from(base64Data, "base64")
          await fs.writeFile(filePath, buffer)
        } else {
          // Handle text content
          await fs.writeFile(filePath, content)
        }
      } else {
        // Create empty file
        await fs.writeFile(filePath, "")
      }
    }

    // Update metadata
    const metadata = await loadMetadata()
    metadata.push(newItem)
    await saveMetadata(metadata)

    console.log("Created file:", newItem)
    return NextResponse.json(newItem)
  } catch (error) {
    console.error("Error creating file:", error)
    return NextResponse.json({ error: "Failed to create file", details: (error as Error).message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "File ID is required" }, { status: 400 })
    }

    const metadata = await loadMetadata()
    const itemIndex = metadata.findIndex((item: any) => item.id === id)
    
    if (itemIndex === -1) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    const item = metadata[itemIndex]

    // Delete from file system
    if (item.type === "file") {
      const filePath = getFilePath(item.path)
      try {
        await fs.unlink(filePath)
      } catch (error) {
        console.warn("File not found on disk:", filePath)
      }
    } else {
      // For folders, we'll just remove from metadata for now
      // In a real implementation, you might want to recursively delete contents
    }

    // Remove from metadata
    metadata.splice(itemIndex, 1)
    await saveMetadata(metadata)

    return NextResponse.json({ success: true, deleted: item })
  } catch (error) {
    console.error("Error deleting file:", error)
    return NextResponse.json({ error: "Failed to delete file", details: (error as Error).message }, { status: 500 })
  }
}
