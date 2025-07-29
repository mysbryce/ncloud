import { type NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { itemId, targetPath } = body

    if (!itemId || !targetPath) {
      return NextResponse.json({ error: "Missing required fields: itemId, targetPath" }, { status: 400 })
    }

    const metadata = await loadMetadata()
    const itemIndex = metadata.findIndex((item: any) => item.id === itemId)
    
    if (itemIndex === -1) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    const item = metadata[itemIndex]
    const oldPath = item.path
    const newPath = targetPath + item.name + (item.type === "folder" ? "/" : "")

    // Check if target path exists and is a folder
    if (item.type === "file") {
      const targetDirPath = getDirPath(targetPath)
      try {
        await fs.access(targetDirPath)
      } catch {
        // Create target directory if it doesn't exist
        await fs.mkdir(targetDirPath, { recursive: true })
      }
    }

    // Move file on disk
    if (item.type === "file") {
      const oldFilePath = getFilePath(oldPath)
      const newFilePath = getFilePath(newPath)
      
      try {
        await fs.rename(oldFilePath, newFilePath)
      } catch (error) {
        console.warn("Error moving file on disk:", error)
        // Continue with metadata update even if file move fails
      }
    } else {
      // For folders, we'll just update metadata for now
      // In a real implementation, you might want to recursively move contents
    }

    // Update metadata
    item.path = newPath
    item.last_modified = new Date().toISOString()
    await saveMetadata(metadata)

    return NextResponse.json({ success: true, moved: item })
  } catch (error) {
    console.error("Error moving file:", error)
    return NextResponse.json({ error: "Failed to move file", details: (error as Error).message }, { status: 500 })
  }
} 