import React from 'react'
import { Check, Clock3, MessageSquare, ShieldCheck, Sparkles, Users, X } from 'lucide-react'
import Layout from './Layout'
import FriendsSidebar from './FriendsSidebar'
import { useFriends } from '../hooks/useFriends'

const Friends: React.FC = () => {
  const { friends, pendingRequests, loading, error, respondToFriendRequest } = useFriends()

  return (
    <Layout>
      <div className="space-y-6">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/95 via-slate-900/85 to-slate-800/70 p-8 shadow-2xl shadow-black/20">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-slate-300">
                <Sparkles className="h-3.5 w-3.5" />
                Friends & Network
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-white">Collaborate with people you already trust.</h1>
              <p className="mt-3 max-w-2xl text-slate-300">
                Keep track of active collaborators, respond to requests, and invite new people from the sidebar.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 rounded-2xl border border-white/10 bg-slate-950/50 p-3 backdrop-blur-md">
              <Metric label="Friends" value={friends.length} icon={Users} />
              <Metric label="Pending" value={pendingRequests.length} icon={Clock3} />
              <Metric label="Active" value={friends.length > 0 ? friends.length : 0} icon={ShieldCheck} />
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300 shadow-lg shadow-black/10">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <section className="rounded-3xl border border-white/10 bg-slate-900/85 p-6 shadow-2xl shadow-black/20">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold text-white">Your network</h2>
                  <p className="text-sm text-slate-400">People you can collaborate with right now.</p>
                </div>
                <div className="text-sm text-slate-400">{loading ? 'Loading...' : `${friends.length} connected`}</div>
              </div>

              {friends.length === 0 ? (
                <EmptyNetwork />
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {friends.map((friend) => (
                    <div
                      key={friend.id}
                      className="group rounded-2xl border border-white/10 bg-slate-950/60 p-4 shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-slate-950/80"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-sm font-bold text-white shadow-lg shadow-blue-500/20">
                            {(friend.display_name || friend.email)[0]?.toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-base font-semibold text-white">{friend.display_name}</p>
                            <p className="truncate text-sm text-slate-400">{friend.email}</p>
                          </div>
                        </div>
                        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
                          Online
                        </span>
                      </div>
                      <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                        <MessageSquare className="h-3.5 w-3.5" />
                        Ready for live boards and quick feedback.
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-white/10 bg-slate-900/85 p-6 shadow-2xl shadow-black/20">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold text-white">Pending requests</h2>
                  <p className="text-sm text-slate-400">Accept or decline incoming invites.</p>
                </div>
                <div className="text-sm text-slate-400">{pendingRequests.length} waiting</div>
              </div>

              {pendingRequests.length === 0 ? (
                <EmptyRequests />
              ) : (
                <div className="space-y-3">
                  {pendingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-950/60 p-4 shadow-lg transition-all hover:border-white/20 hover:bg-slate-950/80 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-800 text-white shadow-md">
                          {(request.display_name || request.email)[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-white">{request.display_name}</p>
                          <p className="truncate text-sm text-slate-400">{request.email}</p>
                        </div>
                      </div>

                      {!request.is_request ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => respondToFriendRequest(request.id, true)}
                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/15 px-4 py-2 text-sm font-medium text-emerald-300 transition-all hover:bg-emerald-500/25 hover:shadow-lg hover:shadow-emerald-500/10"
                          >
                            <Check className="h-4 w-4" />
                            Accept
                          </button>
                          <button
                            onClick={() => respondToFriendRequest(request.id, false)}
                            className="inline-flex items-center gap-2 rounded-xl bg-red-500/15 px-4 py-2 text-sm font-medium text-red-300 transition-all hover:bg-red-500/25 hover:shadow-lg hover:shadow-red-500/10"
                          >
                            <X className="h-4 w-4" />
                            Decline
                          </button>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
                          Waiting for reply
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-slate-900/85 p-6 shadow-2xl shadow-black/20">
              <h2 className="mb-3 text-xl font-semibold text-white">What you can do here</h2>
              <ul className="space-y-3 text-sm text-slate-300">
                <li className="flex gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-sky-400" /> Invite teammates from the right sidebar.</li>
                <li className="flex gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-sky-400" /> Accept requests to unlock shared workspaces.</li>
                <li className="flex gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-sky-400" /> Keep the list tidy by responding to stale requests.</li>
              </ul>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-900/85 p-6 shadow-2xl shadow-black/20">
              <h2 className="mb-4 text-xl font-semibold text-white">Invite panel</h2>
              <FriendsSidebar isSidebar={false} />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

const Metric: React.FC<{ label: string; value: number; icon: React.ComponentType<{ className?: string }> }> = ({ label, value, icon: Icon }) => (
  <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 shadow-inner shadow-black/10">
    <div className="flex items-center gap-2 text-slate-400">
      <Icon className="h-4 w-4" />
      <span className="text-xs font-semibold uppercase tracking-[0.2em]">{label}</span>
    </div>
    <div className="mt-2 text-2xl font-bold text-white">{value}</div>
  </div>
)

const EmptyNetwork: React.FC = () => (
  <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/50 p-10 text-center">
    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-slate-300 shadow-lg">
      <Users className="h-8 w-8" />
    </div>
    <h3 className="text-xl font-semibold text-white">No friends yet</h3>
    <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
      Use the invite panel on the right to add someone to your network, then come back here to manage requests and collaborators.
    </p>
  </div>
)

const EmptyRequests: React.FC = () => (
  <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/50 p-8 text-center text-sm text-slate-400">
    No pending requests right now.
  </div>
)

export default Friends