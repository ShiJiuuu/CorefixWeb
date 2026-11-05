import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  // The site has two root layouts (site + redirect), so the 404 lives in
  // app/global-not-found.tsx. Still experimental in Next 15.x.
  experimental: { globalNotFound: true },
}

export default nextConfig
