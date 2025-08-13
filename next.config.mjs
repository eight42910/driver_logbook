/** @type {import('next').NextConfig} */
const nextConfig = {
  // 開発環境でのStrictModeを無効化（認証の無限ループ対策）
  // 本番環境では有効化を推奨
  reactStrictMode: process.env.NODE_ENV !== 'development',

  // 本番最適化設定
  swcMinify: true,
  compress: true,
  poweredByHeader: false,

  // セキュリティヘッダー
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
