/*
  # Initialize AI Co-Pilot Database Schema

  1. New Tables
    - `projects`
      - `id` (uuid, primary key) - Unique identifier for the project
      - `name` (text, unique) - Project name, must be unique
      - `createdAt` (timestamp) - When the project was created
      - `updatedAt` (timestamp) - Last update timestamp
    
    - `workflows`
      - `id` (uuid, primary key) - Unique identifier for the workflow
      - `projectId` (uuid, foreign key) - Reference to the parent project
      - `status` (enum) - Current workflow status (PENDING, RUNNING, COMPLETED, FAILED)
      - `createdAt` (timestamp) - When the workflow was created
      - `updatedAt` (timestamp) - Last update timestamp
    
    - `jobs`
      - `id` (uuid, primary key) - Unique identifier for the job
      - `workflowId` (uuid, foreign key) - Reference to the parent workflow
      - `toolName` (text) - Name of the tool being invoked (e.g., 'lovable-ai/design-ui')
      - `status` (enum) - Current job status (PENDING, RUNNING, COMPLETED, FAILED)
      - `input` (jsonb) - Input parameters passed to the tool
      - `output` (jsonb) - Output returned by the tool
      - `error` (text) - Error message if job failed
      - `startedAt` (timestamp) - When job execution started
      - `completedAt` (timestamp) - When job execution completed
      - `createdAt` (timestamp) - When the job was created

  2. Enums
    - `WorkflowStatus` - PENDING, RUNNING, COMPLETED, FAILED
    - `JobStatus` - PENDING, RUNNING, COMPLETED, FAILED

  3. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data

  4. Indexes
    - Index on `jobs.workflowId` for faster job lookups by workflow
    - Index on `jobs.status` for filtering jobs by status
*/

-- Create enums
CREATE TYPE "WorkflowStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create workflows table
CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "projectId" UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  status "WorkflowStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "workflowId" UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  "toolName" TEXT NOT NULL,
  status "JobStatus" NOT NULL DEFAULT 'PENDING',
  input JSONB,
  output JSONB,
  error TEXT,
  "startedAt" TIMESTAMPTZ,
  "completedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_jobs_workflow_id ON jobs("workflowId");
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for demo purposes)
-- In production, you would want to restrict this to authenticated users
CREATE POLICY "Allow all access to projects"
  ON projects FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all access to workflows"
  ON workflows FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all access to jobs"
  ON jobs FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to update updatedAt
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON workflows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
