import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const path = searchParams.get("path") || "/"

    console.log("Fetching files for path:", path)

    // Much simpler approach - get all files and filter in application
    const allFiles = await sql`
      SELECT id, name, type, size, last_modified, path, mime_type, content
      FROM files 
      ORDER BY type DESC, name ASC
    `

    console.log("All files from DB:", allFiles)

    // Filter files for current path
    const filteredFiles = allFiles.filter((file) => {
      if (path === "/") {
        // Root directory: show files directly in root and folders one level deep
        if (file.type === "file") {
          return file.path === "/" + file.name
        } else {
          return file.path === "/" + file.name + "/"
        }
      } else {
        // Subdirectory: show files and folders that are direct children
        if (file.type === "file") {
          return file.path === path + file.name
        } else {
          return file.path === path + file.name + "/"
        }
      }
    })

    console.log("Filtered files:", filteredFiles)

    return NextResponse.json(filteredFiles)
  } catch (error) {
    console.error("Error fetching files:", error)
    return NextResponse.json({ error: "Failed to fetch files", details: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, type, size, path, mimeType, content } = body

    console.log("Creating file:", { name, type, path })

    // Validate required fields
    if (!name || !type || !path) {
      return NextResponse.json({ error: "Missing required fields: name, type, path" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO files (name, type, size, path, mime_type, content, last_modified)
      VALUES (${name}, ${type}, ${size || null}, ${path}, ${mimeType || null}, ${content || null}, NOW())
      RETURNING id, name, type, size, last_modified, path, mime_type, content
    `

    console.log("Created file:", result[0])

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error creating file:", error)
    return NextResponse.json({ error: "Failed to create file", details: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "File ID is required" }, { status: 400 })
    }

    const result = await sql`
      DELETE FROM files WHERE id = ${Number.parseInt(id)}
      RETURNING name, type
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, deleted: result[0] })
  } catch (error) {
    console.error("Error deleting file:", error)
    return NextResponse.json({ error: "Failed to delete file", details: error.message }, { status: 500 })
  }
}
