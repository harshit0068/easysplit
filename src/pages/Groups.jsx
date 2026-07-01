import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../supabaseClient'
import { useAuth } from '../AuthContext'
import Layout from '../components/Layout'
import { Plus, ChevronRight, Users } from 'lucide-react'

export default function Groups() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchGroups() }, [])

  const fetchGroups = async () => {
    const { data, error } = await supabase
      .from('group_members')
      .select('group_id, groups(id, name, created_at)')
      .eq('user_id', user.id)
      .order('joined_at', { ascending: false })

    if (error) console.error('Error fetching groups:', error)
    else setGroups(data?.map(item => item.groups) || [])
    setLoading(false)
  }

  return (
    <Layout>
      <div className="p-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">All Groups</h1>
            <p className="text-gray-500 mt-1">{groups.length} groups total</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/groups/new')}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold px-4 py-2 rounded-xl transition-colors text-sm"
          >
            <Plus size={16} />
            New Group
          </motion.button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <div className="w-16 h-16 bg-violet-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users size={28} className="text-violet-400" />
            </div>
            <p className="text-gray-500 font-medium">No groups yet</p>
            <p className="text-gray-400 text-sm mt-1">Create a group to start splitting expenses</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/groups/new')}
              className="mt-4 bg-violet-600 text-white px-6 py-2 rounded-xl text-sm font-medium"
            >
              Create your first group
            </motion.button>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((group, i) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => navigate(`/groups/${group.id}`)}
                className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-gray-100 hover:border-violet-200 hover:bg-violet-50 cursor-pointer transition-all group shadow-sm"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-violet-400 to-teal-400 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span className="text-white font-bold text-lg">
                    {group.name[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{group.name}</h3>
                  <p className="text-gray-400 text-sm">
                    {new Date(group.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </p>
                </div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-violet-400 transition-colors" />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}