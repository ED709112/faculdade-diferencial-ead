/** @type {import('next').NextConfig} */
const isProduction = process.env.NODE_ENV === 'production';

const nextConfig = {
  images: {
    remotePatterns: isProduction
      ? [
          { protocol: 'https', hostname: 'fadead.com.br', pathname: '/uploads/**' },
          { protocol: 'http', hostname: 'localhost', port: '3001', pathname: '/uploads/**' }
        ]
      : [
          { protocol: 'http', hostname: 'localhost', port: '3001', pathname: '/uploads/**' }
        ],
    unoptimized: true
  },
  async rewrites() {
    const backendUrl = isProduction ? 'http://127.0.0.1:3001' : 'http://localhost:3001';
    return [
      { source: '/uploads/:path*', destination: `${backendUrl}/uploads/:path*` }
    ];
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    NEXT_PUBLIC_WHATSAPP: process.env.NEXT_PUBLIC_WHATSAPP || '5586998296668'
  },
  reactStrictMode: true,
  swcMinify: true
};

module.exports = nextConfig;
