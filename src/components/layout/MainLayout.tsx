'use client';

import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';

interface MainLayoutProps {
  children: React.ReactNode;
}

/**
 * メインレイアウトコンポーネント
 * 認証後のページで使用される統合レイアウト
 */
export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="flex-1 flex">
        <Sidebar />

        <main className="flex-1 p-6 bg-gray-50 lg:ml-64">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>

      <Footer />
    </div>
  );
}

/**
 * 認証前ページ用のシンプルレイアウト
 */
export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* シンプルヘッダー */}
      <header className="border-b bg-background">
        <div className="container flex h-16 items-center">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-blue-600 rounded"></div>
            <span className="font-bold text-xl">Driver Logbook</span>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 flex items-center justify-center p-6">
        {children}
      </main>

      {/* シンプルフッター */}
      <footer className="border-t py-4">
        <div className="container text-center text-sm text-muted-foreground">
          © 2024 Driver Logbook v3. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
