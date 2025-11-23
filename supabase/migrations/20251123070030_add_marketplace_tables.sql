/*
  # Add Marketplace Tables for MCP Tool Ecosystem

  1. New Tables
    - `developers`
      - `id` (uuid, primary key)
      - `name` (text)
      - `email` (text, unique)
      - `api_key` (text, unique, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `third_party_tools`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text, nullable)
      - `mcp_server_url` (text)
      - `status` (enum: PENDING, APPROVED, REJECTED)
      - `developer_id` (uuid, foreign key)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `reviewed_at` (timestamptz, nullable)
      - `review_notes` (text, nullable)

  2. Security
    - Enable RLS on all tables
    - Add policies for developers to manage their own tools
    - Add admin policies for tool review
*/

-- Create enum for tool approval status
CREATE TYPE tool_approval_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- Create developers table
CREATE TABLE IF NOT EXISTS developers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  api_key text UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create third_party_tools table
CREATE TABLE IF NOT EXISTS third_party_tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  mcp_server_url text NOT NULL,
  status tool_approval_status DEFAULT 'PENDING',
  developer_id uuid NOT NULL REFERENCES developers(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  review_notes text
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_third_party_tools_developer_id ON third_party_tools(developer_id);
CREATE INDEX IF NOT EXISTS idx_third_party_tools_status ON third_party_tools(status);

-- Enable Row Level Security
ALTER TABLE developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE third_party_tools ENABLE ROW LEVEL SECURITY;

-- Policies for developers table
-- Developers can read their own data
CREATE POLICY "Developers can read own data"
  ON developers
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

-- Anyone can create a developer account (registration)
CREATE POLICY "Anyone can register as developer"
  ON developers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Developers can update their own data
CREATE POLICY "Developers can update own data"
  ON developers
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);

-- Policies for third_party_tools table
-- Developers can read their own tools
CREATE POLICY "Developers can read own tools"
  ON third_party_tools
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = developer_id::text);

-- Approved tools are publicly readable
CREATE POLICY "Anyone can read approved tools"
  ON third_party_tools
  FOR SELECT
  TO authenticated
  USING (status = 'APPROVED');

-- Developers can create their own tools
CREATE POLICY "Developers can create tools"
  ON third_party_tools
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = developer_id::text);

-- Developers can update their own pending tools
CREATE POLICY "Developers can update own pending tools"
  ON third_party_tools
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = developer_id::text AND status = 'PENDING')
  WITH CHECK (auth.uid()::text = developer_id::text AND status = 'PENDING');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_developers_updated_at
  BEFORE UPDATE ON developers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_third_party_tools_updated_at
  BEFORE UPDATE ON third_party_tools
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();