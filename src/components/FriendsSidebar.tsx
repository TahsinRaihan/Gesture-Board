import React, { useState } from 'react'
import { UserPlus, Check, X } from 'lucide-react'
import { useFriends } from '../hooks/useFriends'

interface FriendsSidebarProps {
  isSidebar?: boolean
}

const FriendsSidebar: React.FC<FriendsSidebarProps> = ({ isSidebar = true }) => {
  const { friends, pendingRequests, loading, sendFriendRequest, respondToFriendRequest } = useFriends()
  const [searchEmail, setSearchEmail] = useState('')
  const [searching, setSearching] = useState(false)
  const [message, setMessage] = useState('')

  const handleSendRequest = async () => {
    if (!searchEmail.trim()) return

    setSearching(true)
    const result = await sendFriendRequest(searchEmail.trim())
    setSearching(false)

    if (result.success) {
      setMessage('Request sent successfully!')
      setSearchEmail('')
      setTimeout(() => setMessage(''), 3000)
    } else {
      setMessage(result.error || 'Failed to send request')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const handleRespond = async (id: string, accept: boolean) => {
    const result = await respondToFriendRequest(id, accept)

    if (!result.success) {
      setMessage(result.error || 'Failed to respond')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  if (!isSidebar) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Invite Friends</h3>

          <div className="space-y-3 mb-6">
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="friend@example.com"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendRequest()}
                className="form-input flex-1"
              />
              <button
                onClick={handleSendRequest}
                disabled={searching || !searchEmail.trim()}
                className="btn-primary px-4 py-2"
              >
                {searching ? '...' : <UserPlus className="w-5 h-5" />}
              </button>
            </div>

            {message && (
              <div
                className={`text-sm px-3 py-2 rounded-lg ${
                  message.includes('success')
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                {message}
              </div>
            )}
          </div>

          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wide">
                Friend Requests ({pendingRequests.length})
              </h4>
              <div className="space-y-2">
                {pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between gap-2 p-3 bg-slate-800/50 rounded-lg border border-white/10"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {req.display_name}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{req.email}</p>
                    </div>
                    {!req.is_request && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRespond(req.id, true)}
                          className="p-1.5 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded transition-colors"
                          title="Accept"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRespond(req.id, false)}
                          className="p-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded transition-colors"
                          title="Decline"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Friends List */}
          {friends.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wide">
                Friends ({friends.length})
              </h4>
              <div className="space-y-2">
                {friends.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-white/10 hover:border-white/20 transition-colors"
                  >
                    <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 font-semibold text-sm flex-shrink-0">
                      {(friend.display_name || friend.email)[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {friend.display_name}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{friend.email}</p>
                    </div>
                    <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {friends.length === 0 && pendingRequests.length === 0 && !loading && (
            <div className="text-center py-8">
              <p className="text-slate-400 text-sm">
                No friends yet. Invite someone to get started!
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Sidebar view
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-white mb-3 uppercase tracking-wide">
          Add Friend
        </h3>
        <div className="flex gap-2">
          <input
            type="email"
            placeholder="email@example.com"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendRequest()}
            className="form-input flex-1 text-sm py-2"
          />
          <button
            onClick={handleSendRequest}
            disabled={searching || !searchEmail.trim()}
            className="btn-primary p-2"
            title="Send friend request"
          >
            {searching ? <span className="text-xs">...</span> : <UserPlus className="w-4 h-4" />}
          </button>
        </div>

        {message && (
          <div
            className={`text-xs px-2 py-1.5 rounded mt-2 ${
              message.includes('success')
                ? 'bg-green-500/20 text-green-400'
                : 'bg-red-500/20 text-red-400'
            }`}
          >
            {message}
          </div>
        )}
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">
            Requests ({pendingRequests.length})
          </h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between gap-2 p-2 bg-slate-800/50 rounded border border-white/10"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">
                    {req.display_name}
                  </p>
                </div>
                {!req.is_request && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleRespond(req.id, true)}
                      className="p-1 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded transition-colors"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleRespond(req.id, false)}
                      className="p-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends List */}
      {friends.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">
            Friends ({friends.length})
          </h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {friends.map((friend) => (
              <div
                key={friend.id}
                className="flex items-center gap-2 p-2 bg-slate-800/50 rounded border border-white/10 hover:border-white/20 transition-colors"
              >
                <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 font-semibold text-xs flex-shrink-0">
                  {(friend.display_name || friend.email)[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">
                    {friend.display_name}
                  </p>
                </div>
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0"></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {friends.length === 0 && pendingRequests.length === 0 && !loading && (
        <p className="text-xs text-slate-400 text-center py-4">
          Invite friends to collaborate
        </p>
      )}
    </div>
  )
}

export default FriendsSidebar