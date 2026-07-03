import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../supabaseClient'
import { useAuth } from '../AuthContext'
import { Plus, TrendingUp, TrendingDown, ChevronRight, Users } from 'lucide-react'
import Layout from '../components/Layout'
import logo from '../assets/logo.png'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalOwed, setTotalOwed] = useState(0)
  const [totalOwe, setTotalOwe] = useState(0)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    // Fetch groups
    const { data: groupData, error } = await supabase
      .from('group_members')
      .select('group_id, groups(id, name, created_at)')
      .eq('user_id', user.id)
      .order('joined_at', { ascending: false })

    if (error) console.error('Error fetching groups:', error)
    else setGroups(groupData?.map(item => item.groups) || [])

    // Fetch all expenses across all groups
    const { data: expenseData } = await supabase
      .from('expenses')
      .select(`
        id, amount, paid_by, group_id,
        expense_splits(user_id, share_amount)
      `)
      .in('group_id', groupData?.map(g => g.group_id) || [])

    if (expenseData) {
      let owed = 0
      let owe = 0

      expenseData.forEach(expense => {
        // Amount you paid
        if (expense.paid_by === user.id) {
          owed += expense.amount
        }

        // Amount you owe from splits
        const mySplit = expense.expense_splits?.find(s => s.user_id === user.id)
        if (mySplit) {
          owe += mySplit.share_amount
        }
      })

      // Net calculation
      const net = owed - owe
      if (net > 0) {
        setTotalOwed(net)
        setTotalOwe(0)
      } else {
        setTotalOwed(0)
        setTotalOwe(Math.abs(net))
      }
    }

    setLoading(false)
  }

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between mb-6">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <img src={logo} alt="EasySplit" className="w-9 h-9 rounded-xl" />
            <span className="text-xl font-bold text-gray-800">EasySplit</span>
          </div>
        </div>

        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Hi, {user?.user_metadata?.full_name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 mt-1">Here's what's happening with your expenses</p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-violet-600 to-violet-700 rounded-2xl p-5 text-white"
          >
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={18} className="text-violet-200" />
              <span className="text-violet-200 text-sm font-medium">You are owed</span>
            </div>
            <p className="text-2xl font-bold">₹{totalOwed.toFixed(2)}</p>
            <p className="text-violet-200 text-xs mt-1">Across all groups</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl p-5 text-white"
          >
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown size={18} className="text-teal-200" />
              <span className="text-teal-200 text-sm font-medium">You owe</span>
            </div>
            <p className="text-2xl font-bold">₹{totalOwe.toFixed(2)}</p>
            <p className="text-teal-200 text-xs mt-1">Across all groups</p>
          </motion.div>
        </div>

        {/* Groups section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-800">Your Groups</h2>
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
                <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center py-12">
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
                  className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-violet-200 hover:bg-violet-50 cursor-pointer transition-all group"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-violet-400 to-teal-400 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-white font-bold text-lg">
                      {group.name[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{group.name}</h3>
                    <p className="text-gray-400 text-sm">Tap to view expenses</p>
                  </div>
                  <ChevronRight size={18} className="text-gray-300 group-hover:text-violet-400 transition-colors" />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}