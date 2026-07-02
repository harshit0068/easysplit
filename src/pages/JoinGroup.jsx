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

  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

  const ensureProfile = async (retries = 5) => {
    for (let i = 0; i < retries; i++) {
      await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: user.user_metadata?.full_name || user.email,
          avatar_url: user.user_metadata?.avatar_url || null
        }, { onConflict: 'id' })

      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (data) return true
      await wait(1000)
    }
    return false
  }

  const handleJoin = async () => {
    if (!user) {
      localStorage.setItem('pendingInviteToken', token)
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.href }
      })
      return
    }

    setJoining(true)

    const profileReady = await ensureProfile()

    if (!profileReady) {
      setError('Failed to set up your profile. Please try again.')
      setJoining(false)
      return
    }

    // Check if already a member
    const { data: existing } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', group.id)
      .eq('user_id', user.id)
      .single()

    if (existing) {
      window.location.href = `${window.location.origin}/groups/${group.id}`
      return
    }

    // Add as member
    const { error: joinError } = await supabase
      .from('group_members')
      .insert({ group_id: group.id, user_id: user.id })

    if (joinError) {
      console.error('Join error:', joinError)
      setError(`Failed to join: ${joinError.message}`)
      setJoining(false)
      return
    }

    setJoined(true)
    setTimeout(() => {
      window.location.href = `${window.location.origin}/groups/${group.id}`
    }, 2000)
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-gray-500 mb-6">{error}</p>
            <button
              onClick={() => { setError(''); setJoining(false); handleJoin() }}
              className="w-full bg-violet-600 text-white font-semibold py-3 rounded-xl mb-3"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full border border-gray-200 text-gray-500 font-semibold py-3 rounded-xl"
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
              {joining ? 'Setting up your account...' : user ? `Join ${group?.name}` : 'Sign in to Join'}
            </motion.button>
          </>
        )}
      </motion.div>
    </div>
  )
}