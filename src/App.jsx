import { useAuth } from './AuthContext'
import Login from './Login'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold text-gray-800">
        Welcome, {user.user_metadata?.full_name || user.email}!
      </h1>
      <p className="text-gray-500 mt-2">You are logged in.</p>
    </div>
  )
}

export default App