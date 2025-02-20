'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-black text-zinc-300 py-12 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto"
      >
        <Link 
          href="/waitlist"
          className="text-blue-400 hover:text-blue-300 mb-8 inline-block"
        >
          ← Back to Waitlist
        </Link>
        
        <h1 className="text-3xl font-bold text-white mb-8">Privacy Policy</h1>
        
        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Data We Collect</h2>
            <p className="mb-3">
              We collect and process the following types of data:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Voice recordings during speech therapy sessions</li>
              <li>Speech analysis data and progress metrics</li>
              <li>Account information (email, profile details)</li>
              <li>Usage data and interaction with our service</li>
              <li>Technical data (device info, IP address)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. How We Use Your Data</h2>
            <p className="mb-3">
              Your data is used to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide personalized speech therapy services</li>
              <li>Analyze and improve speech patterns</li>
              <li>Track progress and generate insights</li>
              <li>Improve our AI models and service quality</li>
              <li>Ensure service security and prevent abuse</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Data Protection</h2>
            <p className="mb-3">
              We implement industry-standard security measures to protect your data. Voice 
              recordings and personal information are encrypted both in transit and at rest. 
              Access to user data is strictly controlled and monitored.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Data Sharing</h2>
            <p className="mb-3">
              We do not sell your personal data. We may share data with:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Service providers who assist in operating our platform</li>
              <li>AI processing partners for speech analysis</li>
              <li>Legal authorities when required by law</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Your Rights</h2>
            <p className="mb-3">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access your personal data</li>
              <li>Request data correction or deletion</li>
              <li>Export your data</li>
              <li>Opt-out of certain data processing</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Data Retention</h2>
            <p className="mb-3">
              We retain your data for as long as necessary to provide our services and comply 
              with legal obligations. You can request deletion of your data at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Children's Privacy</h2>
            <p className="mb-3">
              For users under 13, we require parental consent and implement additional 
              safeguards to protect children's privacy. Parents can review and manage their 
              child's data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Updates to Policy</h2>
            <p className="mb-3">
              We may update this policy periodically. Users will be notified of significant 
              changes. Continued use of the service constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Contact Us</h2>
            <p className="mb-3">
              For privacy-related inquiries or to exercise your data rights, contact us at 
              privacy@vocal.ai
            </p>
          </section>

          <p className="text-sm text-zinc-400 mt-8">
            Last updated: February 2024
          </p>
        </div>
      </motion.div>
    </div>
  )
} 