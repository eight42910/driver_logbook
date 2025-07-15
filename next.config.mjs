/** @type {import('next').NextConfig} */
const nextConfig = {
  // 開発環境でのStrictModeを無効化（認証の無限ループ対策）
  reactStrictMode: false,
};

export default nextConfig;
