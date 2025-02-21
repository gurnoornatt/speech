'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
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
    setSuccess(false)

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      setIsSubmitting(false)
      return
    }

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to subscribe');
        if (data.details) {
          console.error('Subscription error details:', data.details);
        }
        return;
      }

      setSuccess(true)
      setEmail('')
    } catch (err) {
      console.error('Subscription error:', err);
      setError('Unable to connect to the server. Please try again later.')
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
            <p className="text-green-500 text-sm text-center">
              Thanks for subscribing! Check your email for confirmation.
            </p>
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