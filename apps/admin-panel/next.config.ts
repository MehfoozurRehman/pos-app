import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async headers() {
    const corsHeaders = [
      { key: 'Access-Control-Allow-Credentials', value: 'true' },
      { key: 'Access-Control-Allow-Origin', value: '*' },
      { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS' },
      {
        key: 'Access-Control-Allow-Headers',
        value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
      },
    ];

    return [
      {
        source: '/api/:path*',
        headers: corsHeaders,
      },
    ];
  },
};

export default nextConfig;
