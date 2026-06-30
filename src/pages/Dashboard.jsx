import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../AuthContext'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    const { data, error } = await supabase
      .from('group_members')
      .select(`
        group_id,
        groups(id, name, created_at)
      `)
      .eq('user_id', user.id)
      .order('joined_at', { ascending: false })

    if (error) {
      console.error('Error fetching groups:', error)
    } else {
      const formattedGroups = data?.map(item => item.groups) || []
      setGroups(formattedGroups)
    }
    setLoading(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">EasySplit</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-500 text-sm">
            {user?.user_metadata?.full_name || user?.email}
          </span>
          <button
            onClick={handleSignOut}
            className="text-sm text-red-500 hover:text-red-600 font-medium"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-700">Your Groups</h2>
          <button
            onClick={() => navigate('/groups/new')}
            className="bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            + New Group
          </button>
        </div>

        {loading ? (
          <p className="text-gray-400 text-center py-12">Loading groups...</p>
        ) : groups.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg mb-2">No groups yet</p>
            <p className="text-gray-300 text-sm">Create a group to start splitting expenses</p>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map(group => (
              <div
                key={group.id}
                onClick={() => navigate(`/groups/${group.id}`)}
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800 text-lg">{group.name}</h3>
                    <p className="text-gray-400 text-sm mt-1">Tap to view expenses</p>
                  </div>
                  <span className="text-gray-300 text-xl">→</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}