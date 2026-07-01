import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../supabaseClient'
import { useAuth } from '../AuthContext'
import Layout from '../components/Layout'
import { Users } from 'lucide-react'

export default function CreateGroup() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const suggestions = ['Goa Trip 🏖️', 'Flatmates 🏠', 'Office Lunch 🍱', 'Road Trip 🚗', 'Movie Night 🎬']

  const handleCreate = async () => {
    if (!name.trim()) { setError('Please enter a group name'); return }
    setLoading(true)
    setError('')

    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert({ name: name.trim(), created_by: user.id })
      .select()
      .single()

    if (groupError) {
      setError('Failed to create group. Please try again.')
      setLoading(false)
      return
    }

    const { error: memberError } = await supabase
      .from('group_members')
      .insert({ group_id: group.id, user_id: user.id })

    if (memberError) {
      setError('Failed to add you as a member.')
      setLoading(false)
      return
    }

    navigate(`/groups/${group.id}`)
  }

  return (
    <Layout>
      <div className="p-6 max-w-lg mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Create New Group</h1>
          <p className="text-gray-500 mt-1">Start splitting expenses with your friends</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-violet-400 to-teal-400 rounded-2xl flex items-center justify-center shadow-lg">
              <Users size={36} className="text-white" />
            </div>
          </div>

          {/* Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Group Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="e.g. Goa Trip, Flatmates"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
            />
          </div>

          {/* Suggestions */}
          <div>
            <p className="text-xs text-gray-400 mb-2">Quick suggestions:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map(s => (
                <button
                  key={s}
                  onClick={() => setName(s)}
                  className="text-xs bg-gray-50 hover:bg-violet-50 hover:text-violet-600 text-gray-500 px-3 py-1.5 rounded-lg border border-gray-100 hover:border-violet-200 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => navigate('/')}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCreate}
              disabled={loading}
              className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {loading ? 'Creating...' : 'Create Group'}
            </motion.button>
          </div>
        </div>
      </div>
    </Layout>
  )
}