import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error?: string }>
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, displayName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    })

    // Store user info in localStorage for friends system
    if (!error) {
      const usersStored = localStorage.getItem('gesture-board-users')
      const allUsers = usersStored ? JSON.parse(usersStored) : []
      
      // Generate a unique ID for the new user
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const newUser = {
        id: userId,
        email,
        display_name: displayName || email.split('@')[0],
      }

      allUsers.push(newUser)
      localStorage.setItem('gesture-board-users', JSON.stringify(allUsers))
    }

    return { error: error?.message }
  }

  const signIn = async (email: string, password: string) => {
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    // Store current user in localStorage for friends system
    if (!error && data.user) {
      const usersStored = localStorage.getItem('gesture-board-users')
      const allUsers = usersStored ? JSON.parse(usersStored) : []
      
      // Check if user already exists in our system
      const existingUser = allUsers.find((u: any) => u.email === email)
      if (!existingUser) {
        const newUser = {
          id: data.user.id,
          email,
          display_name: data.user.user_metadata?.display_name || email.split('@')[0],
        }
        allUsers.push(newUser)
        localStorage.setItem('gesture-board-users', JSON.stringify(allUsers))
      }
    }

    return { error: error?.message }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}