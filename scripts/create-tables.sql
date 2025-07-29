-- Create files table to store file metadata and content
CREATE TABLE IF NOT EXISTS files (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('file', 'folder')),
    size BIGINT,
    last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    path TEXT NOT NULL,
    mime_type VARCHAR(255),
    content TEXT, -- Store file content as base64 or text
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create audit_logs table to store all user actions
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip VARCHAR(45) NOT NULL,
    mac VARCHAR(17) NOT NULL,
    action VARCHAR(50) NOT NULL,
    details TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_files_path ON files(path);
CREATE INDEX IF NOT EXISTS idx_files_type ON files(type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Insert some sample data
INSERT INTO files (name, type, path, mime_type, size, content) VALUES
('Documents', 'folder', '/Documents/', NULL, NULL, NULL),
('Images', 'folder', '/Images/', NULL, NULL, NULL),
('sample.txt', 'file', '/sample.txt', 'text/plain', 1024, 'This is a sample text file content for testing purposes.')
ON CONFLICT DO NOTHING;

-- Insert initial audit log
INSERT INTO audit_logs (ip, mac, action, details) VALUES
('192.168.1.100', '00:1B:44:11:3A:B7', 'SYSTEM', 'Database initialized with sample data')
ON CONFLICT DO NOTHING;
