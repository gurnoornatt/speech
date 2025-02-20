'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function WaitlistPage() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { error } = await supabase
        .from('waitlist')
        .insert([{ email, signed_up_at: new Date() }])

      if (error) throw error
      setSuccess(true)
      setEmail('')
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl bg-black p-8 relative"
      >
        {/* Close button */}
        <button 
          className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-300 transition-colors"
          onClick={() => window.close()}
        >
          <X className="h-6 w-6" />
        </button>

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 relative">
            <Image
              src="/vocal-logo.png"
              alt="Vocal Logo"
              width={80}
              height={80}
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-semibold text-white mb-3">Unlock Your Voice with <span className="text-blue-600">Vocal</span>: AI-Powered Speech Therapy, Anytime, Anywhere</h2>
          <p className="text-blue-400 text-sm font-semibold mt-4">
            Refer friends to move up the waitlist - Top 100 get free premium! 🚀
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Processing...' : 'Get Early Access'}
            </button>
          </div>
          
          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          {success && (
            <p className="text-green-500 text-sm text-center">Thanks for subscribing!</p>
          )}
        </form>

        {/* Terms */}
        <p className="text-zinc-500 text-xs text-center mt-8">
          By subscribing, you agree to our{' '}
          <Link href="/terms" className="text-zinc-400 hover:text-white underline">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-zinc-400 hover:text-white underline">
            Privacy Policy
          </Link>
        </p>
      </motion.div>
    </div>
  )
} 