/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'marjoballabani.me',
        pathname: '/**',
      },
    ],
  },
}

module.exports = nextConfig
