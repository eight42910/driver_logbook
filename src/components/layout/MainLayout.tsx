'use client';

import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { LayoutProvider, useLayout } from '@/contexts/LayoutContext';

interface MainLayoutProps {
  children: React.ReactNode;
}

/**
 * 内部レイアウトコンポーネント
 * LayoutContextを使用するため、プロバイダー内で定義
 */
function MainLayoutInner({ children }: MainLayoutProps) {
  const { sidebarOpen, isDesktop, isMobile } = useLayout();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー（全画面固定） */}
      <Header />

      {/* メインコンテンツエリア */}
      <div className="flex min-h-[calc(100vh-4rem)]">
        {' '}
        {/* ヘッダー分を除く */}
        {/* サイドバー */}
        <Sidebar />
        {/* メインコンテンツ */}
        <main
          className={`
            flex-1 flex flex-col
            transition-all duration-300 ease-in-out
            ${isDesktop && sidebarOpen ? 'lg:ml-64' : 'ml-0'}
            ${isMobile ? 'w-full' : ''}
          `}
        >
          {/* コンテンツエリア */}
          <div className="flex-1 p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">{children}</div>
          </div>

          {/* フッター（メインコンテンツエリア内） */}
          <Footer />
        </main>
      </div>
    </div>
  );
}

/**
 * メインレイアウトコンポーネント
 * 認証後のページで使用される統合レイアウト
 */
export function MainLayout({ children }: MainLayoutProps) {
  return (
    <LayoutProvider>
      <MainLayoutInner>{children}</MainLayoutInner>
    </LayoutProvider>
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
