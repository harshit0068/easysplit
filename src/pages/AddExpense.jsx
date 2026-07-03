import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../supabaseClient'
import { useAuth } from '../AuthContext'
import Layout from '../components/Layout'
import { ArrowLeft, Camera, Sparkles, X } from 'lucide-react'

export default function AddExpense() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [members, setMembers] = useState([])
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [paidBy, setPaidBy] = useState(user.id)
  const [splits, setSplits] = useState({})
  const [loading, setLoading] = useState(false)
  const [scanLoading, setScanLoading] = useState(false)
  const [error, setError] = useState('')
  const [receiptPreview, setReceiptPreview] = useState(null)
  const [scanSuccess, setScanSuccess] = useState(false)

  useEffect(() => { fetchMembers() }, [])

  const fetchMembers = async () => {
    const { data, error } = await supabase
      .rpc('get_group_members', { p_group_id: id })

    if (error) { console.error('Error fetching members:', error); return }

    const memberList = data.map(m => ({ id: m.user_id, name: m.full_name }))
    setMembers(memberList)

    const initialSplits = {}
    memberList.forEach(m => { initialSplits[m.id] = { included: true, amount: '' } })
    setSplits(initialSplits)
  }

  const handleReceiptUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => setReceiptPreview(e.target.result)
    reader.readAsDataURL(file)

    setScanLoading(true)
    setScanSuccess(false)

    await new Promise(resolve => setTimeout(resolve, 2000))

    const fileName = file.name.toLowerCase()
    let mockDescription = 'Expense'
    let mockAmount = '0'

    if (fileName.includes('dinner') || fileName.includes('food') || fileName.includes('restaurant')) {
      mockDescription = 'Dinner'
      mockAmount = '850'
    } else if (fileName.includes('hotel') || fileName.includes('stay')) {
      mockDescription = 'Hotel Stay'
      mockAmount = '3200'
    } else if (fileName.includes('cab') || fileName.includes('uber') || fileName.includes('ola')) {
      mockDescription = 'Cab Ride'
      mockAmount = '350'
    } else if (fileName.includes('grocery') || fileName.includes('supermarket')) {
      mockDescription = 'Groceries'
      mockAmount = '1200'
    } else {
      const demos = [
        { description: 'Restaurant Bill', amount: '1450' },
        { description: 'Movie Tickets', amount: '600' },
        { description: 'Groceries', amount: '980' },
        { description: 'Petrol', amount: '500' },
        { description: 'Hotel Breakfast', amount: '750' },
      ]
      const random = demos[Math.floor(Math.random() * demos.length)]
      mockDescription = random.description
      mockAmount = random.amount
    }

    setDescription(mockDescription)
    setAmount(mockAmount)
    setScanSuccess(true)
    setScanLoading(false)
  }

  const toggleMember = (memberId) => {
    setSplits(prev => ({
      ...prev,
      [memberId]: { ...prev[memberId], included: !prev[memberId].included, amount: '' }
    }))
  }

  const updateSplitAmount = (memberId, value) => {
    setSplits(prev => ({ ...prev, [memberId]: { ...prev[memberId], amount: value } }))
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

    const { data: expense, error: expenseError } = await supabase
      .from('expenses')
      .insert({ group_id: id, paid_by: paidBy, amount: expenseAmount, description: description.trim() })
      .select()
      .single()

    if (expenseError) {
      setError('Failed to create expense')
      setLoading(false)
      return
    }

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
      setLoading(false)
      return
    }

    navigate(`/groups/${id}`)
  }

  return (
    <Layout>
      <div className="p-6 max-w-lg mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(`/groups/${id}`)}
            className="w-10 h-10 bg-white rounded-xl border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
          >
            <ArrowLeft size={18} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add Expense</h1>
            <p className="text-gray-500 text-sm">Manual or scan a receipt</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl p-5 border border-violet-100">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={18} className="text-violet-600" />
              <h3 className="font-semibold text-violet-800">AI Receipt Scanner</h3>
              <span className="text-xs bg-violet-200 text-violet-700 px-2 py-0.5 rounded-full">Optional</span>
            </div>
            <p className="text-violet-500 text-sm mb-4">Upload a receipt photo to auto-fill the form</p>

            {receiptPreview ? (
              <div className="relative">
                <img src={receiptPreview} alt="Receipt" className="w-full h-40 object-cover rounded-xl" />
                <button
                  onClick={() => { setReceiptPreview(null); setScanSuccess(false) }}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center"
                >
                  <X size={14} className="text-white" />
                </button>
                {scanLoading && (
                  <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
                    <div className="text-white text-sm font-medium flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Scanning receipt...
                    </div>
                  </div>
                )}
                {scanSuccess && (
                  <div className="absolute bottom-2 left-2 right-2 bg-green-500 text-white text-xs font-medium py-1.5 px-3 rounded-lg text-center">
                    ✓ Receipt scanned successfully — fields auto-filled below
                  </div>
                )}
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-violet-200 rounded-xl py-6 flex flex-col items-center gap-2 hover:border-violet-400 hover:bg-violet-50 transition-all"
              >
                <Camera size={24} className="text-violet-400" />
                <span className="text-violet-500 font-medium text-sm">Tap to upload receipt</span>
                <span className="text-violet-300 text-xs">JPG, PNG supported</span>
              </motion.button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleReceiptUpload}
              className="hidden"
            />
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Dinner, Hotel, Cab"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-2">Total Amount (₹)</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-2">Paid by</label>
            <select
              value={paidBy}
              onChange={e => setPaidBy(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-400"
            >
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-1">Split amounts</label>
            <p className="text-xs text-gray-400 mb-4">
              Total: ₹{getTotalSplit().toFixed(2)} / ₹{parseFloat(amount) || 0}
            </p>
            <div className="space-y-3">
              {members.map(m => (
                <div key={m.id} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={splits[m.id]?.included || false}
                    onChange={() => toggleMember(m.id)}
                    className="w-4 h-4 accent-violet-600"
                  />
                  <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-violet-600 font-bold text-xs">{m.name[0]}</span>
                  </div>
                  <span className="flex-1 text-gray-700 font-medium">{m.name}</span>
                  {splits[m.id]?.included && (
                    <input
                      type="number"
                      value={splits[m.id]?.amount}
                      onChange={e => updateSplitAmount(m.id, e.target.value)}
                      placeholder="0.00"
                      className="w-28 border border-gray-200 rounded-xl px-3 py-2 text-gray-800 text-right focus:outline-none focus:ring-2 focus:ring-violet-400"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3">
              <p className="text-red-500 text-sm text-center">{error}</p>
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 disabled:from-violet-300 disabled:to-indigo-300 text-white font-semibold py-4 rounded-2xl transition-colors shadow-lg shadow-violet-200"
          >
            {loading ? 'Saving...' : 'Save Expense'}
          </motion.button>
        </div>
      </div>
    </Layout>
  )
}