import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { createLayer } from '../utils/helpers'

export interface Project {
  id: string
  title: string
  canvas_data?: any
  thumbnail_url?: string
  updated_at: string
  owner_id: string
  created_at: string
  deleted_at?: string | null
}

const PROJECTS_STORAGE_KEY = 'gesture-board-projects'
const TRASH_STORAGE_KEY = 'gesture-board-trash-projects'

const readProjects = (storageKey: string): Project[] => {
  try {
    const stored = localStorage.getItem(storageKey)
    return stored ? (JSON.parse(stored) as Project[]) : []
  } catch {
    return []
  }
}

const writeProjects = (storageKey: string, projects: Project[]): void => {
  localStorage.setItem(storageKey, JSON.stringify(projects))
}

const sortProjects = (projects: Project[]): Project[] =>
  [...projects].sort((left, right) => new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime())

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([])
  const [trashedProjects, setTrashedProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const fetchProjects = async () => {
    if (!user) {
      setProjects([])
      setTrashedProjects([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const activeProjects = readProjects(PROJECTS_STORAGE_KEY)
        .filter((project) => project.owner_id === user.id && !project.deleted_at)

      const deletedProjects = readProjects(TRASH_STORAGE_KEY)
        .filter((project) => project.owner_id === user.id)

      setProjects(sortProjects(activeProjects))
      setTrashedProjects(sortProjects(deletedProjects))
      setError(null)
    } catch (err) {
      setError('Failed to fetch projects')
      setProjects([])
      setTrashedProjects([])
    } finally {
      setLoading(false)
    }
  }

  const createProject = async (title: string) => {
    if (!user) return null

    try {
      const now = new Date().toISOString()
      const newProject: Project = {
        id: `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title,
        owner_id: user.id,
        canvas_data: { layers: [createLayer('Layer 1')] },
        created_at: now,
        updated_at: now,
      }

      const existingProjects = readProjects(PROJECTS_STORAGE_KEY)
      writeProjects(PROJECTS_STORAGE_KEY, [newProject, ...existingProjects])

      setProjects((prev) => sortProjects([newProject, ...prev]))
      setError(null)
      
      return newProject
    } catch (err) {
      setError('Failed to create project')
      return null
    }
  }

  const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
      const stored = readProjects(PROJECTS_STORAGE_KEY)
      const updatedAt = new Date().toISOString()
      const updatedProjects = stored.map((project: Project) => 
        project.id === id 
          ? { ...project, ...updates, updated_at: updatedAt }
          : project
      )
      
      writeProjects(PROJECTS_STORAGE_KEY, updatedProjects)
      
      setProjects((prev) =>
        sortProjects(
          prev.map((project) =>
            project.id === id ? { ...project, ...updates, updated_at: updatedAt } : project
          )
        )
      )
      
      return updatedProjects.find((p: Project) => p.id === id)
    } catch (err) {
      setError('Failed to update project')
      return null
    }
  }

  const deleteProject = async (id: string) => {
    try {
      const now = new Date().toISOString()
      const activeProjects = readProjects(PROJECTS_STORAGE_KEY)
      const trashProjects = readProjects(TRASH_STORAGE_KEY)
      const projectToDelete = activeProjects.find((project) => project.id === id)

      if (!projectToDelete) {
        return null
      }

      const trashedProject = { ...projectToDelete, deleted_at: now, updated_at: now }

      writeProjects(
        PROJECTS_STORAGE_KEY,
        activeProjects.filter((project) => project.id !== id)
      )
      writeProjects(
        TRASH_STORAGE_KEY,
        [trashedProject, ...trashProjects.filter((project) => project.id !== id)]
      )

      setProjects((prev) => prev.filter((project) => project.id !== id))
      setTrashedProjects((prev) => sortProjects([trashedProject, ...prev.filter((project) => project.id !== id)]))
      setError(null)
      return trashedProject
    } catch (err) {
      setError('Failed to delete project')
      return null
    }
  }

  const restoreProject = async (id: string) => {
    try {
      const now = new Date().toISOString()
      const activeProjects = readProjects(PROJECTS_STORAGE_KEY)
      const trashProjects = readProjects(TRASH_STORAGE_KEY)
      const projectToRestore = trashProjects.find((project) => project.id === id)

      if (!projectToRestore) {
        return null
      }

      const restoredProject = {
        ...projectToRestore,
        deleted_at: null,
        updated_at: now,
      }

      writeProjects(
        TRASH_STORAGE_KEY,
        trashProjects.filter((project) => project.id !== id)
      )
      writeProjects(
        PROJECTS_STORAGE_KEY,
        [restoredProject, ...activeProjects.filter((project) => project.id !== id)]
      )

      setTrashedProjects((prev) => prev.filter((project) => project.id !== id))
      setProjects((prev) => sortProjects([restoredProject, ...prev.filter((project) => project.id !== id)]))
      setError(null)
      return restoredProject
    } catch (err) {
      setError('Failed to restore project')
      return null
    }
  }

  const permanentlyDeleteProject = async (id: string) => {
    try {
      const trashProjects = readProjects(TRASH_STORAGE_KEY)
      writeProjects(
        TRASH_STORAGE_KEY,
        trashProjects.filter((project) => project.id !== id)
      )

      setTrashedProjects((prev) => prev.filter((project) => project.id !== id))
      setError(null)
    } catch (err) {
      setError('Failed to permanently delete project')
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [user])

  return {
    projects,
    trashedProjects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    restoreProject,
    permanentlyDeleteProject,
    refetch: fetchProjects,
  }
}