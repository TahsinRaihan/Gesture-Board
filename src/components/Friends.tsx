import React from 'react'
import Layout from './Layout'
import FriendsSidebar from './FriendsSidebar'

const Friends: React.FC = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Friends & Network</h1>
          <p className="text-gray-400">Connect with other designers and collaborate on projects</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content area */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 bg-opacity-80 backdrop-blur-md border border-white border-opacity-10 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Friend Activity</h2>
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center">
                    <span className="text-accent text-2xl">👥</span>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Coming Soon</h3>
                <p className="text-gray-400 max-w-md mx-auto">
                  Friend activity feed, collaborative sessions, and real-time collaboration features are coming in the next update.
                </p>
              </div>
            </div>
          </div>

          {/* Friends sidebar (embedded) */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 bg-opacity-80 backdrop-blur-md border border-white border-opacity-10 rounded-lg p-6">
              <FriendsSidebar isSidebar={false} />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Friends