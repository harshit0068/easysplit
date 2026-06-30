import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../AuthContext'

export default function CreateGroup() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Please enter a group name')
      return
    }

    setLoading(true)
    setError('')

    // Create the group
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert({ name: name.trim(), created_by: user.id })
      .select()
      .single()

    if (groupError) {
      setError('Failed to create group. Please try again.')
      console.error(groupError)
      setLoading(false)
      return
    }

    // Add creator as a member
    const { error: memberError } = await supabase
      .from('group_members')
      .insert({ group_id: group.id, user_id: user.id })

    if (memberError) {
      setError('Failed to add you as a member.')
      console.error(memberError)
      setLoading(false)
      return
    }

    // Success - go to the group page
    navigate(`/groups/${group.id}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate('/')}
          className="text-gray-400 hover:text-gray-600 text-xl"
        >
          ←
        </button>
        <h1 className="text-xl font-bold text-gray-800">New Group</h1>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Group Name
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            placeholder="e.g. Goa Trip, Flatmates, Office Lunch"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
          />

          {error && (
            <p className="text-red-500 text-sm mt-2">{error}</p>
          )}

          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full mt-4 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? 'Creating...' : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  )
}