import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  LayoutDashboard,
  Users,
  Trash2,
  Search,
  Bell,
  LogOut,
} from 'lucide-react'
import FriendsSidebar from './FriendsSidebar'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, signOut } = useAuth()
  const location = useLocation()

  const navigation = [
    { name: 'Projects', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Friends', href: '/friends', icon: Users },
    { name: 'Trash', href: '/trash', icon: Trash2 },
  ]

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-slate-900/80 backdrop-blur-xl border-r border-white/10 m-4 rounded-2xl overflow-hidden">
        <div className="flex flex-col h-full p-6">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
              GB
            </div>
            <h1 className="text-2xl font-bold text-white">Gesture Board</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-white/10 pt-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center flex-1 min-w-0">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {(user?.email?.[0] || 'U').toUpperCase()}
                </div>
                <div className="ml-3 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user?.user_metadata?.display_name || user?.email?.split('@')[0]}
                  </p>
                  <p className="text-xs text-slate-400">Free Plan</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-all duration-200"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="ml-72 mr-80 mt-4 mb-4">
        {/* Top bar */}
        <div className="glass rounded-2xl p-4 mb-6 border border-white/10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  className="form-input pl-12 bg-slate-900/50"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-all duration-200">
                <Bell className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="glass rounded-2xl p-6 border border-white/10">
          {children}
        </div>
      </div>

      {/* Friends sidebar */}
      <FriendsSidebar />
    </div>
  )
}

export default Layout