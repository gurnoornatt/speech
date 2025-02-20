'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

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
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#1A1A1A] rounded-3xl p-8 relative">
        <button 
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-300"
          onClick={() => window.close()}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <div className="flex flex-col items-center space-y-6">
          <div className="w-16 h-16 bg-[#2A2A2A] rounded-2xl flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 4C9.37 4 4 9.37 4 16C4 22.63 9.37 28 16 28C22.63 28 28 22.63 28 16C28 9.37 22.63 4 16 4ZM20.5 17.5L14.5 21.5C14.3 21.65 14.15 21.7 14 21.7C13.85 21.7 13.7 21.65 13.5 21.5C13.2 21.3 13 21 13 20.6V12.4C13 12 13.2 11.7 13.5 11.5C13.8 11.3 14.2 11.3 14.5 11.5L20.5 15.5C20.8 15.7 21 16 21 16.5C21 17 20.8 17.3 20.5 17.5Z" fill="white"/>
            </svg>
          </div>

          <h1 className="text-white text-3xl font-semibold text-center">Vocal</h1>
          
          <p className="text-gray-400 text-lg text-center">
            Unlock your superpower—your portable AI vocal coach.
          </p>

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full px-4 py-3 bg-[#2A2A2A] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              {isSubmitting ? 'Subscribing...' : 'Subscribe'}
            </button>
          </form>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          {success && (
            <p className="text-green-500 text-sm">Thanks for subscribing!</p>
          )}

          <p className="text-gray-500 text-sm text-center">
            By subscribing, you agree to our{' '}
            <a href="/terms" className="text-gray-400 hover:text-gray-300 underline">Terms of Service</a>
            {' '}and{' '}
            <a href="/privacy" className="text-gray-400 hover:text-gray-300 underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  )
} 