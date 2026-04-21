-- Create project_collaborators table for role-based access control
CREATE TABLE IF NOT EXISTS project_collaborators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('viewer', 'editor', 'admin')),
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,

  -- Ensure no duplicate collaborators per project
  UNIQUE(project_id, user_id),

  -- Prevent self-invitation
  CHECK (user_id != invited_by)
);

-- Add RLS policies
ALTER TABLE project_collaborators ENABLE ROW LEVEL SECURITY;

-- Project owners can view all collaborators on their projects
CREATE POLICY "Project owners can view collaborators" ON project_collaborators
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_collaborators.project_id
      AND projects.owner_id = auth.uid()
    )
  );

-- Collaborators can view other collaborators on projects they have access to
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

-- Project owners and admins can invite collaborators
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

-- Users can update their own collaborator status (accept invites)
CREATE POLICY "Users can accept invites" ON project_collaborators
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Project owners and admins can remove collaborators
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

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_project_collaborators_project_id ON project_collaborators(project_id);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_user_id ON project_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_role ON project_collaborators(role);

-- Add updated_at trigger (reuse the function from friends table)
CREATE TRIGGER update_project_collaborators_invited_at
  BEFORE UPDATE ON project_collaborators
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();