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
}

const PROJECTS_STORAGE_KEY = 'gesture-board-projects'

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const fetchProjects = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      // Get all projects from localStorage
      const stored = localStorage.getItem(PROJECTS_STORAGE_KEY)
      const allProjects = stored ? JSON.parse(stored) : []
      
      // Filter projects owned by current user
      const userProjects = allProjects
        .filter((p: Project) => p.owner_id === user.id)
        .sort((a: Project, b: Project) => 
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        )
      
      setProjects(userProjects)
      setError(null)
    } catch (err) {
      setError('Failed to fetch projects')
      setProjects([])
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

      // Get existing projects
      const stored = localStorage.getItem(PROJECTS_STORAGE_KEY)
      const allProjects = stored ? JSON.parse(stored) : []
      
      // Add new project
      allProjects.push(newProject)
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(allProjects))

      // Update local state
      setProjects(prev => [newProject, ...prev])
      setError(null)
      
      return newProject
    } catch (err) {
      setError('Failed to create project')
      return null
    }
  }

  const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
      const stored = localStorage.getItem(PROJECTS_STORAGE_KEY)
      const allProjects = stored ? JSON.parse(stored) : []
      
      const updatedProjects = allProjects.map((p: Project) => 
        p.id === id 
          ? { ...p, ...updates, updated_at: new Date().toISOString() }
          : p
      )
      
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(updatedProjects))
      
      setProjects(prev => prev.map(p => 
        p.id === id 
          ? { ...p, ...updates, updated_at: new Date().toISOString() }
          : p
      ))
      
      return updatedProjects.find((p: Project) => p.id === id)
    } catch (err) {
      setError('Failed to update project')
      return null
    }
  }

  const deleteProject = async (id: string) => {
    try {
      const stored = localStorage.getItem(PROJECTS_STORAGE_KEY)
      const allProjects = stored ? JSON.parse(stored) : []
      
      const filtered = allProjects.filter((p: Project) => p.id !== id)
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(filtered))
      
      setProjects(prev => prev.filter(p => p.id !== id))
      setError(null)
    } catch (err) {
      setError('Failed to delete project')
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [user])

  return {
    projects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    refetch: fetchProjects,
  }
}