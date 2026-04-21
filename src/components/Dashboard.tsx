import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from './Layout'
import { FileText, Clock, Users, Plus, Trash2 } from 'lucide-react'
import { useProjects, Project } from '../hooks/useProjects'

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const { projects, loading, error: hookError, createProject, deleteProject } = useProjects()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newProjectTitle, setNewProjectTitle] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const handleCreateProject = async () => {
    if (!newProjectTitle.trim()) return

    setCreating(true)
    setError(null)
    const project = await createProject(newProjectTitle.trim())
    setCreating(false)

    if (project) {
      setShowCreateModal(false)
      setNewProjectTitle('')
      // Stay on dashboard - the projects list will update automatically
    } else {
      setError('Failed to create project. Please try again.')
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome back!</h1>
          <p className="text-slate-400">Create and collaborate on gesture-controlled boards</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-sky-500"></div>
          </div>
        ) : hookError || error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-red-300 shadow-lg shadow-black/10">
            {error || hookError}
          </div>
        ) : projects.length === 0 ? (
          <EmptyState onCreateClick={() => setShowCreateModal(true)} />
        ) : (
          <ProjectGrid
            projects={projects}
            onCreateClick={() => setShowCreateModal(true)}
            navigate={navigate}
            onDeleteProject={async (projectId) => {
              const confirmed = window.confirm('Move this board to Trash?')
              if (!confirmed) return

              await deleteProject(projectId)
            }}
          />
        )}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/95 p-6 shadow-2xl shadow-black/30">
            <h2 className="text-xl font-semibold text-white mb-4">Create New Board</h2>
            <input
              type="text"
              placeholder="Enter board name..."
              value={newProjectTitle}
              onChange={(e) => setNewProjectTitle(e.target.value)}
              className="form-input mb-4"
              onKeyPress={(e) => e.key === 'Enter' && handleCreateProject()}
            />
            {error && (
              <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                disabled={creating || !newProjectTitle.trim()}
                className="flex-1 btn-primary disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

const EmptyState: React.FC<{ onCreateClick: () => void }> = ({ onCreateClick }) => {
  return (
    <div className="rounded-3xl border border-dashed border-white/10 bg-slate-900/70 px-6 py-16 text-center shadow-2xl shadow-black/20">
      <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-white/5 shadow-xl shadow-black/20">
        <FileText className="h-12 w-12 text-slate-400" />
      </div>
      <h2 className="mb-2 text-2xl font-semibold text-white">No projects yet</h2>
      <p className="mx-auto mb-8 max-w-md text-slate-400">
        Get started by creating your first gesture-controlled whiteboard. Use hand tracking to draw, design, and collaborate in real-time.
      </p>
      <button onClick={onCreateClick} className="btn-primary text-lg px-8 py-3">
        Create your first board
      </button>
    </div>
  )
}

const ProjectGrid: React.FC<{
  projects: Project[];
  onCreateClick: () => void;
  navigate: (path: string) => void;
  onDeleteProject: (projectId: string) => Promise<void>;
}> = ({ projects, onCreateClick, navigate, onDeleteProject }) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">Recent Projects</h2>
        <button onClick={onCreateClick} className="btn-primary flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          New Board
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} navigate={navigate} onDeleteProject={onDeleteProject} />
        ))}
      </div>
    </div>
  )
}

const ProjectCard: React.FC<{
  project: Project;
  navigate: (path: string) => void;
  onDeleteProject: (projectId: string) => Promise<void>;
}> = ({ project, navigate, onDeleteProject }) => {
  const handleClick = () => {
    navigate(`/board/${project.id}`)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div
      onClick={handleClick}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/85 p-6 shadow-xl shadow-black/20 transition-all duration-200 ease-out hover:-translate-y-1 hover:border-white/20 hover:bg-slate-900 hover:shadow-2xl"
    >
      <button
        type="button"
        onClick={async (event) => {
          event.stopPropagation()
          await onDeleteProject(project.id)
        }}
        className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 opacity-0 transition-all hover:bg-red-500/10 hover:text-red-300 group-hover:opacity-100"
        title="Move to Trash"
        aria-label={`Move ${project.title} to Trash`}
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {/* Thumbnail placeholder */}
      <div className="mb-4 flex aspect-video items-center justify-center rounded-xl border border-white/5 bg-slate-800/70">
        <FileText className="h-8 w-8 text-slate-400" />
      </div>

      {/* Project info */}
      <div className="space-y-2">
        <h3 className="truncate font-medium text-white transition-colors duration-200 group-hover:text-sky-300">
          {project.title}
        </h3>
        <div className="flex items-center justify-between text-sm text-slate-400">
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            {formatDate(project.updated_at)}
          </div>
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-1" />
            0 {/* Placeholder for collaborators count */}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard