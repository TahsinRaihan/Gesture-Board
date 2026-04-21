import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Check if email is verified
  if (!user.email_confirmed_at) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Email not verified
          </h2>
          <p className="text-gray-600">
            Please check your email and click the verification link to access your account.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 font-medium text-indigo-600 hover:text-indigo-500"
          >
            I've verified my email
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export default ProtectedRoute