/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Optimize image domains
  images: {
    domains: ['hebbkx1anhila5yf.public.blob.vercel-storage.com'],
  },
  // Ensure proper routing
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/waitlist',
      },
    ]
  },
  // Output as standalone
  output: 'standalone',
}

module.exports = nextConfig 