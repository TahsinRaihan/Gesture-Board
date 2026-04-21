import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from './Layout'
import { FileText, Clock, Users, Plus } from 'lucide-react'
import { useProjects, Project } from '../hooks/useProjects'

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const { projects, loading, error: hookError, createProject } = useProjects()
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
          <p className="text-gray-400">Create and collaborate on gesture-controlled boards</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
          </div>
        ) : hookError || error ? (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">
            {error || hookError}
          </div>
        ) : projects.length === 0 ? (
          <EmptyState onCreateClick={() => setShowCreateModal(true)} />
        ) : (
          <ProjectGrid projects={projects} onCreateClick={() => setShowCreateModal(true)} navigate={navigate} />
        )}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 bg-opacity-90 backdrop-blur-md border border-white border-opacity-10 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-white mb-4">Create New Board</h2>
            <input
              type="text"
              placeholder="Enter board name..."
              value={newProjectTitle}
              onChange={(e) => setNewProjectTitle(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-white border-opacity-10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent mb-4"
              onKeyPress={(e) => e.key === 'Enter' && handleCreateProject()}
            />
            {error && (
              <div className="text-red-400 text-sm mb-4">
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
    <div className="text-center py-16">
      <div className="w-24 h-24 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
        <FileText className="w-12 h-12 text-gray-400" />
      </div>
      <h2 className="text-2xl font-semibold text-white mb-2">No projects yet</h2>
      <p className="text-gray-400 mb-8 max-w-md mx-auto">
        Get started by creating your first gesture-controlled whiteboard. Use hand tracking to draw, design, and collaborate in real-time.
      </p>
      <button onClick={onCreateClick} className="btn-primary text-lg px-8 py-3">
        Create your first board
      </button>
    </div>
  )
}

const ProjectGrid: React.FC<{ projects: Project[]; onCreateClick: () => void; navigate: (path: string) => void }> = ({ projects, onCreateClick, navigate }) => {
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
          <ProjectCard key={project.id} project={project} navigate={navigate} />
        ))}
      </div>
    </div>
  )
}

const ProjectCard: React.FC<{ project: Project; navigate: (path: string) => void }> = ({ project, navigate }) => {
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
      className="bg-gray-800 bg-opacity-80 backdrop-blur-md border border-white border-opacity-10 rounded-lg p-6 transition-all duration-200 ease-in-out hover:bg-gray-800 hover:bg-opacity-90 hover:shadow-lg transform hover:scale-105 cursor-pointer group"
    >
      {/* Thumbnail placeholder */}
      <div className="aspect-video bg-gray-700/50 rounded-lg mb-4 flex items-center justify-center">
        <FileText className="w-8 h-8 text-gray-400" />
      </div>

      {/* Project info */}
      <div className="space-y-2">
        <h3 className="font-medium text-white group-hover:text-accent transition-colors duration-200 truncate">
          {project.title}
        </h3>
        <div className="flex items-center justify-between text-sm text-gray-400">
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