import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Login from './components/Login'
import Signup from './components/Signup'
import Dashboard from './components/Dashboard'
import BoardWorkspace from './components/BoardWorkspace'
import Friends from './components/Friends'
import ProtectedRoute from './components/ProtectedRoute'

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center px-4">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
          </div>

          {/* Content */}
          <div className="relative z-10 text-center max-w-3xl">
            {/* Logo/Icon */}
            <div className="mb-8 flex justify-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl">
                <div className="text-3xl font-bold text-white">GB</div>
              </div>
            </div>

            {/* Heading */}
            <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Gesture Board
            </h1>

            {/* Subheading */}
            <p className="text-xl md:text-2xl text-slate-300 mb-12 leading-relaxed">
              The future of collaborative design. Control your workspace with intuitive hand gestures. Real-time synchronization for seamless teamwork.
            </p>

            {/* Feature highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="glass p-6 rounded-xl border border-white/10">
                <div className="text-4xl mb-3">🖐️</div>
                <h3 className="text-lg font-semibold text-white mb-2">Hand Gesture Control</h3>
                <p className="text-slate-400 text-sm">Control with natural hand movements</p>
              </div>
              <div className="glass p-6 rounded-xl border border-white/10">
                <div className="text-4xl mb-3">⚡</div>
                <h3 className="text-lg font-semibold text-white mb-2">Real-time Collaboration</h3>
                <p className="text-slate-400 text-sm">Work together seamlessly with your team</p>
              </div>
              <div className="glass p-6 rounded-xl border border-white/10">
                <div className="text-4xl mb-3">🎨</div>
                <h3 className="text-lg font-semibold text-white mb-2">Professional Tools</h3>
                <p className="text-slate-400 text-sm">Powerful features for creative work</p>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <a 
                href="/signup" 
                className="btn-primary py-4 px-8 text-lg font-semibold inline-flex items-center justify-center gap-2 group"
              >
                Get Started
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
              <a 
                href="/login" 
                className="btn-secondary py-4 px-8 text-lg font-semibold inline-flex items-center justify-center"
              >
                Sign In
              </a>
            </div>

            {/* Footer text */}
            <p className="mt-12 text-slate-500 text-sm">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>
        </div>
      } />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/friends"
        element={
          <ProtectedRoute>
            <Friends />
          </ProtectedRoute>
        }
      />
      {/* Board Workspace */}
      <Route
        path="/board/:projectId"
        element={
          <ProtectedRoute>
            <BoardWorkspace />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App