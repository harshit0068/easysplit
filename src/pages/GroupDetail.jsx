import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../supabaseClient'
import { useAuth } from '../AuthContext'
import Layout from '../components/Layout'
import { Plus, ArrowLeft, Sparkles, TrendingUp, TrendingDown } from 'lucide-react'

export default function GroupDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [group, setGroup] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [balances, setBalances] = useState([])
  const [loading, setLoading] = useState(true)
  const [insights, setInsights] = useState('')
  const [insightsLoading, setInsightsLoading] = useState(false)

  useEffect(() => { fetchGroupData() }, [id])

  const fetchGroupData = async () => {
    const { data: groupData } = await supabase
      .from('groups')
      .select('*')
      .eq('id', id)
      .single()
    setGroup(groupData)

    const { data: expensesData, error } = await supabase
      .from('expenses')
      .select(`
        id, description, amount, category, created_at, paid_by,
        profiles(full_name),
        expense_splits(user_id, share_amount, profiles(full_name))
      `)
      .eq('group_id', id)
      .order('created_at', { ascending: false })

    if (error) console.error('Error fetching expenses:', error)
    else {
      setExpenses(expensesData || [])
      calculateBalances(expensesData || [])
    }
    setLoading(false)
  }

  const calculateBalances = (expensesData) => {
    const balanceMap = {}
    expensesData.forEach(expense => {
      const payerId = expense.paid_by
      const payerName = expense.profiles?.full_name || 'Unknown'
      if (!balanceMap[payerId]) balanceMap[payerId] = { name: payerName, balance: 0 }
      balanceMap[payerId].balance += expense.amount
      expense.expense_splits?.forEach(split => {
        const splitUserId = split.user_id
        const splitName = split.profiles?.full_name || 'Unknown'
        if (!balanceMap[splitUserId]) balanceMap[splitUserId] = { name: splitName, balance: 0 }
        balanceMap[splitUserId].balance -= split.share_amount
      })
    })
    setBalances(Object.entries(balanceMap).map(([userId, data]) => ({
      userId, name: data.name, balance: data.balance
    })))
  }

  const getAIInsights = async () => {
    if (expenses.length === 0) return
    setInsightsLoading(true)
    setInsights('')

    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0)
    const topPayer = balances.reduce((a, b) => a.balance > b.balance ? a : b, balances[0])
    const topOwer = balances.reduce((a, b) => a.balance < b.balance ? a : b, balances[0])

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500))

    const insight = `Your group "${group?.name}" has spent ₹${totalSpent.toFixed(2)} in total across ${expenses.length} expense${expenses.length > 1 ? 's' : ''}. ${topPayer?.name} has paid the most and is owed ₹${Math.abs(topPayer?.balance || 0).toFixed(2)} overall. ${topOwer && topOwer.balance < 0 ? `${topOwer.name} owes the most at ₹${Math.abs(topOwer.balance).toFixed(2)}.` : 'Everyone is settled up!'} Consider settling up soon to keep things fair among the group.`

    setInsights(insight)
    setInsightsLoading(false)
  }

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </Layout>
  )

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 bg-white rounded-xl border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
          >
            <ArrowLeft size={18} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{group?.name}</h1>
            <p className="text-gray-500 text-sm">{expenses.length} expenses</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="md:col-span-2 space-y-6">
            {/* Add expense button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/groups/${id}/add-expense`)}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-violet-200"
            >
              <Plus size={20} />
              Add Expense
            </motion.button>

            {/* AI Insights */}
            <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl p-5 border border-violet-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-violet-600" />
                  <h3 className="font-semibold text-violet-800">AI Spending Insights</h3>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={getAIInsights}
                  disabled={insightsLoading || expenses.length === 0}
                  className="text-sm bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white px-4 py-2 rounded-xl font-medium transition-colors"
                >
                  {insightsLoading ? 'Analyzing...' : 'Get Insights'}
                </motion.button>
              </div>
              {insights ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-violet-700 text-sm leading-relaxed"
                >
                  {insights}
                </motion.p>
              ) : (
                <p className="text-violet-400 text-sm">
                  {expenses.length === 0
                    ? 'Add some expenses first to get AI insights'
                    : 'Click "Get Insights" to analyze your group spending'}
                </p>
              )}
            </div>

            {/* Expenses list */}
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-4">Expenses</h2>
              {expenses.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
                  <p className="text-gray-400 font-medium">No expenses yet</p>
                  <p className="text-gray-300 text-sm mt-1">Add the first expense for this group</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {expenses.map((expense, i) => (
                    <motion.div
                      key={expense.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-violet-400 to-teal-400 rounded-xl flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {expense.description[0]?.toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800">{expense.description}</h3>
                            <p className="text-gray-400 text-sm">
                              Paid by {expense.profiles?.full_name || 'Unknown'}
                            </p>
                          </div>
                        </div>
                        <span className="font-bold text-gray-800 text-lg">₹{expense.amount}</span>
                      </div>
                      {expense.expense_splits?.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-50">
                          <p className="text-xs text-gray-400 mb-2">Split between:</p>
                          <div className="flex flex-wrap gap-2">
                            {expense.expense_splits.map((split, j) => (
                              <span key={j} className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded-lg">
                                {split.profiles?.full_name}: ₹{split.share_amount}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column - Balances */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-800">Balances</h2>
            {balances.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center border border-gray-100">
                <p className="text-gray-400 text-sm">No balances yet</p>
              </div>
            ) : (
              balances.map(b => (
                <motion.div
                  key={b.userId}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center">
                      <span className="text-violet-600 font-bold text-xs">
                        {b.name[0]?.toUpperCase()}
                      </span>
                    </div>
                    <span className="font-medium text-gray-700 text-sm">{b.name}</span>
                  </div>
                  <div className={`flex items-center gap-1 ${b.balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {b.balance >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    <span className="font-bold">
                      {b.balance >= 0 ? '+' : ''}₹{Math.abs(b.balance).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {b.balance >= 0 ? 'is owed' : 'owes'}
                  </p>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}