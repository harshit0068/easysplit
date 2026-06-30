import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../AuthContext'

export default function AddExpense() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [members, setMembers] = useState([])
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [paidBy, setPaidBy] = useState(user.id)
  const [splits, setSplits] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    const { data, error } = await supabase
      .from('group_members')
      .select('user_id, profiles(id, full_name)')
      .eq('group_id', id)

    if (error) {
      console.error('Error fetching members:', error)
      return
    }

    const memberList = data.map(m => ({
      id: m.profiles.id,
      name: m.profiles.full_name
    }))

    setMembers(memberList)

    // Initialize equal splits
    const equalShare = memberList.length > 0
      ? (100 / memberList.length).toFixed(2)
      : 0

    const initialSplits = {}
    memberList.forEach(m => {
      initialSplits[m.id] = { included: true, amount: '' }
    })
    setSplits(initialSplits)
  }

  const toggleMember = (memberId) => {
    setSplits(prev => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        included: !prev[memberId].included,
        amount: ''
      }
    }))
  }

  const updateSplitAmount = (memberId, value) => {
    setSplits(prev => ({
      ...prev,
      [memberId]: { ...prev[memberId], amount: value }
    }))
  }

  const getTotalSplit = () => {
    return Object.values(splits)
      .filter(s => s.included)
      .reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0)
  }

  const handleSubmit = async () => {
    if (!description.trim()) { setError('Please enter a description'); return }
    if (!amount || parseFloat(amount) <= 0) { setError('Please enter a valid amount'); return }

    const totalSplit = getTotalSplit()
    const expenseAmount = parseFloat(amount)

    if (Math.abs(totalSplit - expenseAmount) > 1) {
  setError(`Split amounts must add up to ₹${expenseAmount}. Current total: ₹${totalSplit.toFixed(2)}`)
  return
}

    setLoading(true)
    setError('')

    // Create expense
    const { data: expense, error: expenseError } = await supabase
      .from('expenses')
      .insert({
        group_id: id,
        paid_by: paidBy,
        amount: expenseAmount,
        description: description.trim()
      })
      .select()
      .single()

    if (expenseError) {
      setError('Failed to create expense')
      console.error(expenseError)
      setLoading(false)
      return
    }

    // Create splits
    const splitRows = Object.entries(splits)
      .filter(([_, s]) => s.included && parseFloat(s.amount) > 0)
      .map(([userId, s]) => ({
        expense_id: expense.id,
        user_id: userId,
        share_amount: parseFloat(s.amount)
      }))

    const { error: splitError } = await supabase
      .from('expense_splits')
      .insert(splitRows)

    if (splitError) {
      setError('Failed to save splits')
      console.error(splitError)
      setLoading(false)
      return
    }

    navigate(`/groups/${id}`)
  }

  const includedMembers = members.filter(m => splits[m.id]?.included)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate(`/groups/${id}`)} className="text-gray-400 hover:text-gray-600 text-xl">←</button>
        <h1 className="text-xl font-bold text-gray-800">Add Expense</h1>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-5">
        {/* Description */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="e.g. Dinner, Hotel, Cab"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>

        {/* Amount */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">Total Amount (₹)</label>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>

        {/* Paid by */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">Paid by</label>
          <select
            value={paidBy}
            onChange={e => setPaidBy(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        {/* Custom splits */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Split amounts
            <span className="text-gray-400 font-normal ml-2">
              (Total: ₹{getTotalSplit().toFixed(2)} / ₹{parseFloat(amount) || 0})
            </span>
          </label>
          <div className="space-y-3">
            {members.map(m => (
              <div key={m.id} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={splits[m.id]?.included || false}
                  onChange={() => toggleMember(m.id)}
                  className="w-4 h-4 accent-green-500"
                />
                <span className="flex-1 text-gray-700">{m.name}</span>
                {splits[m.id]?.included && (
                  <input
                    type="number"
                    value={splits[m.id]?.amount}
                    onChange={e => updateSplitAmount(m.id, e.target.value)}
                    placeholder="0.00"
                    className="w-28 border border-gray-200 rounded-xl px-3 py-2 text-gray-800 text-right focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          {loading ? 'Saving...' : 'Save Expense'}
        </button>
      </div>
    </div>
  )
}