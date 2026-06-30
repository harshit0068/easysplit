import { supabase } from './supabaseClient'
import { useEffect } from 'react'

function App() {
  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) console.error('Supabase error:', error)
      else console.log('Supabase connected!', data)
    })
  }, [])

  return <div className="text-2xl font-bold p-8">EasySplit - Supabase Connected!</div>
}

export default App