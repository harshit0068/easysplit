import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../AuthContext'

export default function GroupDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [group, setGroup] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [balances, setBalances] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGroupData()
  }, [id])

  const fetchGroupData = async () => {
    // Fetch group info
    const { data: groupData } = await supabase
      .from('groups')
      .select('*')
      .eq('id', id)
      .single()

    setGroup(groupData)

    // Fetch expenses with splits
    const { data: expensesData, error } = await supabase
      .from('expenses')
      .select(`
        id,
        description,
        amount,
        category,
        created_at,
        paid_by,
        profiles(full_name),
        expense_splits(user_id, share_amount, profiles(full_name))
      `)
      .eq('group_id', id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching expenses:', error)
    } else {
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
      userId,
      name: data.name,
      balance: data.balance
    })))
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Loading...</p></div>

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-gray-600 text-xl">←</button>
        <h1 className="text-xl font-bold text-gray-800">{group?.name}</h1>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Balances */}
        {balances.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-700 mb-4">Balances</h2>
            <div className="space-y-2">
              {balances.map(b => (
                <div key={b.userId} className="flex items-center justify-between">
                  <span className="text-gray-600">{b.name}</span>
                  <span className={`font-semibold ${b.balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {b.balance >= 0 ? '+' : ''}₹{Math.abs(b.balance).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add expense button */}
        <button
          onClick={() => navigate(`/groups/${id}/add-expense`)}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          + Add Expense
        </button>

        {/* Expenses list */}
        <div>
          <h2 className="font-semibold text-gray-700 mb-4">Expenses</h2>
          {expenses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">No expenses yet</p>
              <p className="text-gray-300 text-sm mt-1">Add the first expense for this group</p>
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.map(expense => (
                <div key={expense.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-800">{expense.description}</h3>
                      <p className="text-gray-400 text-sm mt-1">
                        Paid by {expense.profiles?.full_name || 'Unknown'}
                      </p>
                    </div>
                    <span className="font-bold text-gray-800 text-lg">₹{expense.amount}</span>
                  </div>
                  {expense.expense_splits?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-50">
                      <p className="text-xs text-gray-400 mb-2">Split between:</p>
                      <div className="space-y-1">
                        {expense.expense_splits.map((split, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-gray-500">{split.profiles?.full_name || 'Unknown'}</span>
                            <span className="text-gray-600">₹{split.share_amount}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}