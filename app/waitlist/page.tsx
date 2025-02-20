'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import Image from 'next/image'

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
        className="w-full max-w-xl bg-black rounded-3xl border border-zinc-800 p-8 relative"
      >
        {/* Close button */}
        <button 
          className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-300 transition-colors"
          onClick={() => window.close()}
        >
          <X className="h-6 w-6" />
        </button>

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 4C9.37 4 4 9.37 4 16C4 22.63 9.37 28 16 28C22.63 28 28 22.63 28 16C28 9.37 22.63 4 16 4ZM20.5 17.5L14.5 21.5C14.3 21.65 14.15 21.7 14 21.7C13.85 21.7 13.7 21.65 13.5 21.5C13.2 21.3 13 21 13 20.6V12.4C13 12 13.2 11.7 13.5 11.5C13.8 11.3 14.2 11.3 14.5 11.5L20.5 15.5C20.8 15.7 21 16 21 16.5C21 17 20.8 17.3 20.5 17.5Z" fill="white"/>
            </svg>
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-white mb-3">Vocal</h2>
          <p className="text-zinc-400 text-sm leading-relaxed max-w-lg mx-auto mb-2">
            Struggling with speech clarity, stutters, or confidence in public speaking? Imagine having a personal speech therapist available 24/7, powered by AI to tailor every session just for you. That's Vocal—our groundbreaking AI speech coach designed to help kids with delays, adults refining their voice, and anyone in between. It's affordable, private, and adapts to your progress in real-time.
          </p>
          <p className="text-blue-400 text-sm font-semibold">
            Refer friends to move up the waitlist! 🚀
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
              {isSubmitting ? 'Subscribing...' : 'Subscribe'}
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
          <a href="/terms" className="text-zinc-400 hover:text-white underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" className="text-zinc-400 hover:text-white underline">
            Privacy Policy
          </a>
        </p>
      </motion.div>
    </div>
  )
} 