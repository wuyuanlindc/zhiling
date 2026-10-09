/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    '*.run.app',
    '*.usercontent.goog',
    '*.googleusercontent.com',
    '*.vusercontent.net',
    'localhost',
  ],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
