# NCloud - Local File Storage System

A modern file management system built with Next.js, featuring local file storage and drag-and-drop functionality.

![NCloud Preview](https://i.ibb.co/C50rFcJg/ncloud-preview.png)

## Features

- **Local File Storage**: Files are stored in the `/upload/` directory instead of a database
- **Drag and Drop**: Move files and folders by dragging them to other folders
- **Audit Logging**: All actions are logged to JSON files in the upload directory
- **File Preview**: Preview images, text files, and other supported formats
- **Upload Progress**: Real-time upload progress with cancellation support
- **Search and Sort**: Find files quickly with search and multiple sort options
- **Responsive Design**: Works on desktop and mobile devices

## File Storage Structure

```
upload/
├── metadata.json          # File metadata and structure
├── audit-log.json         # Audit logs
├── files/                 # Actual uploaded files
└── folders/              # Created folders
```

## Audit Logging

All user actions are automatically logged to `upload/audit-log.json` with:
- Timestamp
- IP address (mocked)
- MAC address (mocked)
- Action type
- Details

## Drag and Drop

- **Drag files/folders**: Click and drag any file or folder
- **Drop on folders**: Drop items onto folder icons to move them
- **Visual feedback**: Folders highlight when you drag over them
- **Validation**: Prevents invalid moves (e.g., dropping a folder into itself)

## API Endpoints

- `GET /api/files?path=/` - List files in a directory
- `POST /api/files` - Create new file or folder
- `DELETE /api/files?id=...` - Delete file or folder
- `POST /api/files/move` - Move file/folder to new location
- `GET /api/audit` - Get audit logs
- `POST /api/audit` - Create audit log entry

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build
```

## Environment Variables

No external database required - all data is stored locally in the upload directory.

## File Types Supported

- Images (JPG, PNG, GIF, SVG, WebP)
- Videos (MP4, AVI, MOV, WMV, FLV)
- Audio (MP3, WAV, FLAC, AAC)
- Documents (PDF, XLSX, XLS, CSV)
- Code files (JS, TS, JSX, TSX, HTML, CSS, PY, Java, C++, C)
- Archives (ZIP, RAR, 7Z, TAR, GZ)
- Text files (TXT, MD, JSON)

## Security Notes

- Files are stored locally in the upload directory
- No external database dependencies
- Audit logs are stored as JSON files
- File paths are validated to prevent directory traversal