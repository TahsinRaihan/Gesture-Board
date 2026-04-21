import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock3, RotateCcw, Trash2, FileText } from 'lucide-react'
import Layout from './Layout'
import { useProjects, Project } from '../hooks/useProjects'

const Trash: React.FC = () => {
  const navigate = useNavigate()
  const { trashedProjects, loading, error, restoreProject, permanentlyDeleteProject } = useProjects()

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Unknown date'

    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const handlePermanentDelete = async (projectId: string) => {
    const confirmed = window.confirm('Permanently delete this board? This cannot be undone.')
    if (!confirmed) return

    await permanentlyDeleteProject(projectId)
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/95 via-slate-900/85 to-slate-800/70 p-8 shadow-2xl shadow-black/20">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-slate-300">
                <Trash2 className="h-3.5 w-3.5" />
                Trash
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-white">Deleted boards</h1>
              <p className="mt-3 max-w-2xl text-slate-300">
                Restore boards you deleted by mistake, or remove them forever to keep your workspace clean.
              </p>
            </div>

            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 transition-all hover:-translate-y-0.5 hover:bg-white/10 hover:shadow-lg"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300 shadow-lg shadow-black/10">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center rounded-3xl border border-white/10 bg-slate-900/80 py-20 shadow-2xl shadow-black/20">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-sky-500" />
          </div>
        ) : trashedProjects.length === 0 ? (
          <EmptyTrashState onBack={() => navigate('/dashboard')} />
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {trashedProjects.map((project) => (
              <TrashCard
                key={project.id}
                project={project}
                onRestore={restoreProject}
                onDeleteForever={handlePermanentDelete}
                formatDate={formatDate}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}

const TrashCard: React.FC<{
  project: Project
  onRestore: (projectId: string) => Promise<Project | null>
  onDeleteForever: (projectId: string) => Promise<void>
  formatDate: (dateString?: string | null) => string
}> = ({ project, onRestore, onDeleteForever, formatDate }) => {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/85 p-6 shadow-2xl shadow-black/20 transition-all duration-200 hover:-translate-y-1 hover:border-white/20 hover:bg-slate-900">
      <div className="mb-4 flex aspect-video items-center justify-center rounded-2xl border border-white/5 bg-slate-800/70">
        <FileText className="h-8 w-8 text-slate-400" />
      </div>

      <div className="space-y-2">
        <h2 className="truncate text-xl font-semibold text-white">{project.title}</h2>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Clock3 className="h-4 w-4" />
          Deleted {formatDate(project.deleted_at || project.updated_at)}
        </div>
      </div>

      <div className="mt-5 flex gap-3">
        <button
          onClick={async () => {
            await onRestore(project.id)
          }}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-sky-600/15 px-4 py-2.5 text-sm font-medium text-sky-200 transition-all hover:bg-sky-600/25 hover:shadow-lg hover:shadow-sky-500/10"
        >
          <RotateCcw className="h-4 w-4" />
          Restore
        </button>
        <button
          onClick={() => onDeleteForever(project.id)}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500/15 px-4 py-2.5 text-sm font-medium text-red-200 transition-all hover:bg-red-500/25 hover:shadow-lg hover:shadow-red-500/10"
        >
          <Trash2 className="h-4 w-4" />
          Delete Forever
        </button>
      </div>
    </div>
  )
}

const EmptyTrashState: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <div className="rounded-3xl border border-dashed border-white/10 bg-slate-900/80 px-6 py-20 text-center shadow-2xl shadow-black/20">
    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-slate-300 shadow-lg">
      <Trash2 className="h-8 w-8" />
    </div>
    <h2 className="text-2xl font-semibold text-white">Trash is empty</h2>
    <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
      Deleted boards will show up here until you restore them or remove them permanently.
    </p>
    <button onClick={onBack} className="btn-primary mt-6">
      Back to Dashboard
    </button>
  </div>
)

export default Trash