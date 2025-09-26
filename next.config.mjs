/** @type {import('next').NextConfig} */
const nextConfig = {
  // ワークスペースルートを明示的に指定して警告を解決
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
