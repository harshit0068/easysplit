import { motion } from 'framer-motion'
import { supabase } from './supabaseClient'
import { Users, Zap, Shield } from 'lucide-react'
import logo from './assets/logo.png'

export default function Login() {
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
    if (error) console.error('Login error:', error)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-3xl shadow-2xl p-8"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
  <img src={logo} alt="EasySplit" className="w-16 h-16 rounded-2xl shadow-lg" />
</div>
            <h1 className="text-3xl font-bold text-gray-900">EasySplit</h1>
            <p className="text-gray-500 mt-2">Split expenses effortlessly with friends</p>
          </div>

          {/* Features */}
          <div className="space-y-3 mb-8">
            {[
              { icon: Users, text: 'Create groups and track shared expenses' },
              { icon: Zap, text: 'AI-powered receipt scanning' },
              { icon: Shield, text: 'Secure and private with Google login' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-gray-600">
                <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon size={16} className="text-violet-600" />
                </div>
                <span className="text-sm">{text}</span>
              </div>
            ))}
          </div>

          {/* Sign in button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 text-gray-700 font-semibold py-4 px-6 rounded-2xl hover:border-violet-300 hover:bg-violet-50 transition-all shadow-sm"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            Continue with Google
          </motion.button>

          <p className="text-center text-gray-400 text-xs mt-6">
            By signing in, you agree to our terms of service
          </p>
        </motion.div>
      </div>
    </div>
  )
}