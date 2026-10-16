/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'clipboard-read=(self), clipboard-write=(self)'
          }
        ]
      }
    ]
  }
};

export default nextConfig;
