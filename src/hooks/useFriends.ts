import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

export interface Friend {
  id: string
  email: string
  display_name?: string
  status: 'pending' | 'accepted'
  is_request: boolean // true if this user sent the request
}

const FRIENDS_STORAGE_KEY = 'gesture-board-friends'
const USERS_STORAGE_KEY = 'gesture-board-users'

export const useFriends = () => {
  const [friends, setFriends] = useState<Friend[]>([])
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const fetchFriends = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // Get all friends data
      const stored = localStorage.getItem(FRIENDS_STORAGE_KEY)
      const allFriends = stored ? JSON.parse(stored) : []

      // Get accepted friends for current user
      const userFriends = allFriends.filter(
        (f: any) =>
          f.status === 'accepted' &&
          (f.user_id === user.id || f.friend_id === user.id)
      )

      // Get pending requests (sent or received)
      const pendingReqs = allFriends.filter(
        (f: any) =>
          f.status === 'pending' &&
          (f.user_id === user.id || f.friend_id === user.id)
      )

      // Get users to look up display names
      const usersStored = localStorage.getItem(USERS_STORAGE_KEY)
      const allUsers = usersStored ? JSON.parse(usersStored) : []

      // Process accepted friends
      const processedFriends: Friend[] = userFriends.map((f: any) => {
        const friendId = f.user_id === user.id ? f.friend_id : f.user_id
        const friendUser = allUsers.find((u: any) => u.id === friendId)

        return {
          id: friendId,
          email: friendUser?.email || 'unknown@example.com',
          display_name: friendUser?.display_name || friendUser?.email?.split('@')[0],
          status: 'accepted' as const,
          is_request: false,
        }
      })

      // Process pending requests
      const processedPending: Friend[] = pendingReqs.map((f: any) => {
        const otherUserId = f.user_id === user.id ? f.friend_id : f.user_id
        const otherUser = allUsers.find((u: any) => u.id === otherUserId)
        const isSent = f.user_id === user.id

        return {
          id: f.id,
          email: isSent ? `Sent to ${otherUser?.email || 'unknown'}` : (otherUser?.email || 'unknown@example.com'),
          display_name: otherUser?.display_name || otherUser?.email?.split('@')[0],
          status: 'pending' as const,
          is_request: isSent,
        }
      })

      setFriends(processedFriends)
      setPendingRequests(processedPending)
      setError(null)
    } catch (err) {
      setError('Failed to fetch friends')
      setFriends([])
      setPendingRequests([])
    } finally {
      setLoading(false)
    }
  }

  const sendFriendRequest = async (email: string) => {
    if (!user) return { error: 'Not authenticated' }

    try {
      // Find user by email
      const usersStored = localStorage.getItem(USERS_STORAGE_KEY)
      const allUsers = usersStored ? JSON.parse(usersStored) : []
      const targetUser = allUsers.find((u: any) => u.email === email)

      if (!targetUser) {
        return { error: 'User not found' }
      }

      if (targetUser.id === user.id) {
        return { error: 'Cannot send friend request to yourself' }
      }

      // Check if request already exists
      const stored = localStorage.getItem(FRIENDS_STORAGE_KEY)
      const allFriends = stored ? JSON.parse(stored) : []

      const existing = allFriends.find(
        (f: any) =>
          (f.user_id === user.id && f.friend_id === targetUser.id) ||
          (f.user_id === targetUser.id && f.friend_id === user.id)
      )

      if (existing) {
        return { error: 'Friend request already exists' }
      }

      // Send the request
      const newRequest = {
        id: `friend_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: user.id,
        friend_id: targetUser.id,
        status: 'pending',
        created_at: new Date().toISOString(),
      }

      allFriends.push(newRequest)
      localStorage.setItem(FRIENDS_STORAGE_KEY, JSON.stringify(allFriends))

      await fetchFriends()
      return { success: true }
    } catch (err) {
      return { error: 'Failed to send friend request' }
    }
  }

  const respondToFriendRequest = async (requestId: string, accept: boolean) => {
    try {
      const stored = localStorage.getItem(FRIENDS_STORAGE_KEY)
      const allFriends = stored ? JSON.parse(stored) : []

      const requestIndex = allFriends.findIndex((f: any) => f.id === requestId)

      if (requestIndex === -1) {
        return { error: 'Request not found' }
      }

      if (accept) {
        allFriends[requestIndex].status = 'accepted'
      } else {
        allFriends.splice(requestIndex, 1)
      }

      localStorage.setItem(FRIENDS_STORAGE_KEY, JSON.stringify(allFriends))
      await fetchFriends()
      return { success: true }
    } catch (err) {
      return { error: 'Failed to respond to friend request' }
    }
  }

  useEffect(() => {
    fetchFriends()
  }, [user])

  return {
    friends,
    pendingRequests,
    loading,
    error,
    sendFriendRequest,
    respondToFriendRequest,
    refetch: fetchFriends,
  }
}
