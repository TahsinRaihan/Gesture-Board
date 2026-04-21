-- Fix project_collaborators table - add missing accepted_at column
ALTER TABLE project_collaborators
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITH TIME ZONE;

-- Update existing policies (drop and recreate if they exist)
DROP POLICY IF EXISTS "Project owners can view collaborators" ON project_collaborators;
DROP POLICY IF EXISTS "Collaborators can view project collaborators" ON project_collaborators;
DROP POLICY IF EXISTS "Project owners and admins can invite" ON project_collaborators;
DROP POLICY IF EXISTS "Users can accept invites" ON project_collaborators;
DROP POLICY IF EXISTS "Project owners and admins can remove collaborators" ON project_collaborators;

-- Recreate RLS policies
CREATE POLICY "Project owners can view collaborators" ON project_collaborators
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_collaborators.project_id
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "Collaborators can view project collaborators" ON project_collaborators
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM project_collaborators pc2
      WHERE pc2.project_id = project_collaborators.project_id
      AND pc2.user_id = auth.uid()
      AND pc2.accepted_at IS NOT NULL
    )
  );

CREATE POLICY "Project owners and admins can invite" ON project_collaborators
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_collaborators.project_id
      AND projects.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM project_collaborators pc2
      WHERE pc2.project_id = project_collaborators.project_id
      AND pc2.user_id = auth.uid()
      AND pc2.role = 'admin'
      AND pc2.accepted_at IS NOT NULL
    )
  );

CREATE POLICY "Users can accept invites" ON project_collaborators
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Project owners and admins can remove collaborators" ON project_collaborators
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_collaborators.project_id
      AND projects.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM project_collaborators pc2
      WHERE pc2.project_id = project_collaborators.project_id
      AND pc2.user_id = auth.uid()
      AND pc2.role = 'admin'
      AND pc2.accepted_at IS NOT NULL
    )
  );