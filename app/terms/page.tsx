'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function TermsOfService() {
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
        
        <h1 className="text-3xl font-bold text-white mb-8">Terms of Service</h1>
        
        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Service Description</h2>
            <p className="mb-3">
              Vocal is an AI-powered speech therapy application that provides speech analysis, 
              feedback, and coaching. The service is provided "as is" and may be updated or 
              modified over time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. User Responsibilities</h2>
            <p className="mb-3">
              Users must be at least 13 years old to use the service. Users under 18 must have 
              parental consent. You are responsible for maintaining the confidentiality of your 
              account information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Data Collection and Usage</h2>
            <p className="mb-3">
              By using Vocal, you consent to the collection and processing of your voice data 
              for the purpose of providing speech therapy services. Your data will be handled 
              in accordance with our Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. AI Technology</h2>
            <p className="mb-3">
              Our service utilizes artificial intelligence to analyze speech patterns and provide 
              feedback. While we strive for accuracy, the AI's suggestions should not be considered 
              a replacement for professional medical advice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Subscription and Payments</h2>
            <p className="mb-3">
              Vocal may offer various subscription plans. Pricing and features will be clearly 
              communicated before purchase. Refunds are handled on a case-by-case basis.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Content Ownership</h2>
            <p className="mb-3">
              You retain ownership of your voice recordings and speech data. You grant Vocal 
              a license to use this data to provide and improve our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Service Availability</h2>
            <p className="mb-3">
              While we strive for 24/7 availability, we do not guarantee uninterrupted access 
              to the service. Maintenance and updates may occasionally affect availability.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Termination</h2>
            <p className="mb-3">
              We reserve the right to terminate or suspend access to our service for violations 
              of these terms or for any other reason at our discretion.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Changes to Terms</h2>
            <p className="mb-3">
              We may modify these terms at any time. Continued use of the service after changes 
              constitutes acceptance of the new terms.
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