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

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to send emails')
      }

      setProgress({
        current: data.emailsSent,
        total: data.totalSubscribers,
        failedEmails: data.failedEmails || []
      })

      const successRate = ((data.emailsSent / data.totalSubscribers) * 100).toFixed(1)
      setStatus(
        `Success! Sent ${data.emailsSent} out of ${data.totalSubscribers} emails (${successRate}% success rate).`
      )
      
      if (data.failedEmails?.length > 0) {
        setStatus(prev => 
          `${prev} Failed to send to ${data.failedEmails.length} emails. Click "Retry Failed Emails" to try again.`
        )
      }
    } catch (error) {
      setStatus(`Error: ${error instanceof Error ? error.message : 'Failed to send emails'}`)
      setProgress(prev => ({
        ...prev,
        failedEmails: []
      }))
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

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to retry emails')
      }

      setProgress(prev => ({
        ...prev,
        current: prev.current + data.successfulRetries,
        failedEmails: data.remainingFailures || []
      }))

      const successRate = ((data.successfulRetries / data.totalAttempted) * 100).toFixed(1)
      setStatus(
        `Retry complete! Successfully sent ${data.successfulRetries} out of ${data.totalAttempted} failed emails (${successRate}% success rate).`
      )

      if (data.remainingFailures?.length > 0) {
        setStatus(prev => 
          `${prev} ${data.remainingFailures.length} emails still failed.`
        )
      }
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
              <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${(progress.current / progress.total) * 100}%`,
                    transition: 'width 0.5s ease-in-out'
                  }}
                ></div>
              </div>
              <div className="flex justify-between text-zinc-400 text-sm mt-2">
                <span>
                  Sent {progress.current} out of {progress.total} emails
                </span>
                <span>
                  {((progress.current / progress.total) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          )}

          {/* Failed Emails Section */}
          {progress.failedEmails.length > 0 && (
            <div className="mt-6 p-4 bg-zinc-900 rounded-lg border border-red-900/50">
              <h3 className="text-white font-semibold mb-3">
                Failed Emails ({progress.failedEmails.length})
              </h3>
              <div className="max-h-40 overflow-y-auto space-y-2 mb-4">
                {progress.failedEmails.map((fail, i) => (
                  <div key={i} className="text-sm text-red-400 p-2 bg-red-900/20 rounded">
                    <span className="font-medium">{fail.email}</span>
                    <br />
                    <span className="text-xs opacity-75">{fail.error}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={handleRetryFailed}
                disabled={isLoading}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg text-sm disabled:opacity-50"
              >
                {isLoading ? 'Retrying...' : 'Retry Failed Emails'}
              </button>
            </div>
          )}

          {status && (
            <div 
              className={`mt-4 p-4 rounded-lg ${
                status.includes('Error') 
                  ? 'bg-red-900/20 text-red-400' 
                  : 'bg-green-900/20 text-green-400'
              }`}
            >
              {status}
            </div>
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