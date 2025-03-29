-- Create submissions table if it doesn't exist
CREATE TABLE IF NOT EXISTS submissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID REFERENCES clients(client_id),
    client_name TEXT NOT NULL,
    login_key TEXT NOT NULL,
    responses JSONB,
    files JSONB DEFAULT '[]'::jsonb,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add OneDrive-related fields to clients table
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS client_id UUID,
ADD COLUMN IF NOT EXISTS one_drive_folder_id TEXT;

-- Add files field to submissions table
ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS files JSONB DEFAULT '[]'::jsonb;

-- Create a unique index on client_id
CREATE UNIQUE INDEX IF NOT EXISTS clients_client_id_idx ON clients(client_id);

-- Create an index on one_drive_folder_id
CREATE INDEX IF NOT EXISTS clients_one_drive_folder_id_idx ON clients(one_drive_folder_id); 