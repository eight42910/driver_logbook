import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../styles/globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { PerformanceProvider } from '@/contexts/PerformanceContext';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Driver Logbook v3',
  description: '運転手のための日報管理システム',
  keywords: ['運転手', '日報', '管理', '運送業'],
  authors: [{ name: 'Driver Logbook Team' }],
  openGraph: {
    title: 'Driver Logbook v3',
    description: '運転手のための日報管理システム',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={inter.variable}>
      <head>
        {/* DNS prefetch で外部リソースを先読み */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />

        {/* フォントの最適化読み込み */}
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap"
          rel="stylesheet"
        />

        {/* Viewport設定（モバイル最適化） */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes"
        />

        {/* テーマカラー設定 */}
        <meta name="theme-color" content="#2563eb" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <PerformanceProvider enableInProduction={false}>
          <AuthProvider>{children}</AuthProvider>
        </PerformanceProvider>
      </body>
    </html>
  );
}
