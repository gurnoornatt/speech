'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

interface FailedEmail {
  email: string;
  error: string;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [adminKey, setAdminKey] = useState('')
  const [subject, setSubject] = useState('')
  const [emailContent, setEmailContent] = useState('')
  const [status, setStatus] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState({
    current: 0,
    total: 0,
    failedEmails: [] as FailedEmail[]
  })

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setIsAuthenticated(adminKey === process.env.NEXT_PUBLIC_ADMIN_KEY)
  }

  const handleSendEmails = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setStatus('')
    setProgress({ current: 0, total: 0, failedEmails: [] })

    try {
      const response = await fetch('/api/admin/send-mass-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject,
          html: emailContent,
          apiKey: adminKey,
        }),
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      setProgress({
        current: data.emailsSent,
        total: data.totalSubscribers,
        failedEmails: data.failedEmails || []
      })

      setStatus(`Success! Sent ${data.emailsSent} out of ${data.totalSubscribers} emails.`)
      
      if (data.failedEmails?.length > 0) {
        setStatus(prev => `${prev} Failed to send to ${data.failedEmails.length} emails.`)
      }
    } catch (error) {
      setStatus(`Error: ${error instanceof Error ? error.message : 'Failed to send emails'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRetryFailed = async () => {
    if (!progress.failedEmails.length) return;
    
    setIsLoading(true)
    setStatus('Retrying failed emails...')

    try {
      const response = await fetch('/api/admin/retry-failed-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject,
          html: emailContent,
          apiKey: adminKey,
          emails: progress.failedEmails.map(f => f.email)
        }),
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      setProgress(prev => ({
        ...prev,
        failedEmails: data.remainingFailures || []
      }))

      setStatus(`Retry complete! Successfully sent to ${data.successfulRetries} previously failed emails.`)
    } catch (error) {
      setStatus(`Retry error: ${error instanceof Error ? error.message : 'Failed to retry emails'}`)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-zinc-900 p-8 rounded-lg"
        >
          <h1 className="text-2xl font-bold text-white mb-6">Admin Access</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="Enter admin key"
              className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-500"
            />
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg"
            >
              Login
            </button>
          </form>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <h1 className="text-3xl font-bold text-white mb-8">Email Blast</h1>
        
        <form onSubmit={handleSendEmails} className="space-y-6">
          <div>
            <label className="block text-zinc-400 mb-2">Subject Line</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject"
              required
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-500"
            />
          </div>

          <div>
            <label className="block text-zinc-400 mb-2">Email Content (HTML)</label>
            <textarea
              value={emailContent}
              onChange={(e) => setEmailContent(e.target.value)}
              placeholder="Enter email content (HTML supported)"
              required
              rows={10}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-500 font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg disabled:opacity-50"
          >
            {isLoading ? 'Sending...' : 'Send to All Subscribers'}
          </button>

          {/* Progress Bar */}
          {progress.total > 0 && (
            <div className="mt-4">
              <div className="w-full bg-zinc-800 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                ></div>
              </div>
              <p className="text-zinc-400 text-sm mt-2">
                Sent {progress.current} out of {progress.total} emails
              </p>
            </div>
          )}

          {/* Failed Emails Section */}
          {progress.failedEmails.length > 0 && (
            <div className="mt-6 p-4 bg-zinc-900 rounded-lg">
              <h3 className="text-white font-semibold mb-3">
                Failed Emails ({progress.failedEmails.length})
              </h3>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {progress.failedEmails.map((fail, i) => (
                  <div key={i} className="text-sm text-red-400">
                    {fail.email} - {fail.error}
                  </div>
                ))}
              </div>
              <button
                onClick={handleRetryFailed}
                disabled={isLoading}
                className="mt-4 bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg text-sm disabled:opacity-50"
              >
                Retry Failed Emails
              </button>
            </div>
          )}

          {status && (
            <p className={`text-sm ${status.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
              {status}
            </p>
          )}
        </form>

        <div className="mt-8 bg-zinc-900 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Quick Templates</h2>
          <button
            onClick={() => {
              setSubject('Important Update from Vocal! 🎉')
              setEmailContent(`
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h1 style="color: #3b82f6;">Hello from Vocal! 🎤</h1>
                  
                  <p>We hope you're excited about joining us on this journey to transform speech therapy with AI.</p>
                  
                  <p>We wanted to share some exciting updates about our progress:</p>
                  
                  <ul>
                    <li>Feature 1</li>
                    <li>Feature 2</li>
                    <li>Feature 3</li>
                  </ul>
                  
                  <p>Stay tuned for more updates!</p>
                  
                  <p style="color: #64748b; font-size: 14px;">
                    You're receiving this because you're on the Vocal waitlist.
                    <br>
                    To unsubscribe, reply to this email.
                  </p>
                </div>
              `)
            }}
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            Load Update Template
          </button>
        </div>
      </motion.div>
    </div>
  )
} 