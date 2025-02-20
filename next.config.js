/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/',
        destination: '/waitlist',
        permanent: true,
      },
    ]
  },
  // Only include the waitlist page in the build
  pageExtensions: ['tsx', 'ts'],
  webpack: (config, { isServer }) => {
    // Custom webpack config to optimize build
    return config
  },
  // Optimize image domains
  images: {
    domains: ['hebbkx1anhila5yf.public.blob.vercel-storage.com'],
  },
} 