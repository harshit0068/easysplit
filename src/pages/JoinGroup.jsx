import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../supabaseClient'
import { useAuth } from '../AuthContext'
import { Users, CheckCircle } from 'lucide-react'
import logo from '../assets/logo.png'

export default function JoinGroup() {
  const { token } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [group, setGroup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [joined, setJoined] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { fetchInvite() }, [token])

  const fetchInvite = async () => {
    const { data, error } = await supabase
      .from('invites')
      .select('group_id, groups(id, name)')
      .eq('token', token)
      .single()

    if (error || !data) {
      setError('Invalid or expired invite link.')
    } else {
      setGroup(data.groups)
    }
    setLoading(false)
  }

  const handleJoin = async () => {
    if (!user) {
      // Save token and redirect to login
      localStorage.setItem('pendingInviteToken', token)
      navigate('/login')
      return
    }

    setJoining(true)

    // Check if already a member
    const { data: existing } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', group.id)
      .eq('user_id', user.id)
      .single()

    if (existing) {
      navigate(`/groups/${group.id}`)
      return
    }

    // Add as member
    const { error } = await supabase
      .from('group_members')
      .insert({ group_id: group.id, user_id: user.id })

    if (error) {
      setError('Failed to join group. Please try again.')
      setJoining(false)
      return
    }

    setJoined(true)
    setTimeout(() => navigate(`/groups/${group.id}`), 2000)
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md text-center"
      >
        <img src={logo} alt="EasySplit" className="w-16 h-16 rounded-2xl mx-auto mb-4" />

        {error ? (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invite</h1>
            <p className="text-gray-500 mb-6">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-violet-600 text-white font-semibold py-3 rounded-xl"
            >
              Go Home
            </button>
          </>
        ) : joined ? (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">You're in!</h1>
            <p className="text-gray-500">Successfully joined {group?.name}. Redirecting...</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users size={32} className="text-violet-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">You're invited!</h1>
            <p className="text-gray-500 mb-2">You've been invited to join</p>
            <p className="text-xl font-bold text-violet-600 mb-6">{group?.name}</p>

            {!user && (
              <p className="text-sm text-gray-400 mb-4">
                You'll need to sign in with Google to join this group
              </p>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleJoin}
              disabled={joining}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold py-4 rounded-2xl shadow-lg shadow-violet-200"
            >
              {joining ? 'Joining...' : user ? `Join ${group?.name}` : 'Sign in to Join'}
            </motion.button>
          </>
        )}
      </motion.div>
    </div>
  )
}