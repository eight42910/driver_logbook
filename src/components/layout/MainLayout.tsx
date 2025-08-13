'use client';

import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { LayoutProvider, useLayout } from '@/contexts/LayoutContext';
import { MobileLayoutTransition } from '@/components/mobile/MobileLayoutTransition';
import {
  useSmartPreload,
  usePageLeaveTracking,
  useNetworkAwarePreload,
} from '@/hooks/useSmartPreload';
import { useMobileGestures, useViewportFix } from '@/hooks/useMobileGestures';
import { useNetworkOptimization } from '@/hooks/useNetworkOptimization';

interface MainLayoutProps {
  children: React.ReactNode;
}

/**
 * 内部レイアウトコンポーネント
 * LayoutContextを使用するため、プロバイダー内で定義
 */
function MainLayoutInner({ children }: MainLayoutProps) {
  const { sidebarOpen, isDesktop, isMobile } = useLayout();

  // スマートプリロード機能の初期化
  const { preloadRoute } = useSmartPreload();
  const { preloadCriticalResources } = useNetworkAwarePreload();

  // ページ離脱追跡
  usePageLeaveTracking();

  // モバイルジェスチャー機能の初期化
  const { onSwipe, setSwipeEnabled } = useMobileGestures({
    enableSwipeNavigation: isMobile,
    enablePinchPrevention: true,
    enablePullToRefresh: false,
  });

  // ビューポート修正（100vh問題解決）
  useViewportFix();

  // ネットワーク最適化機能の初期化
  const { networkStatus, isLightModeActive } = useNetworkOptimization();

  // 重要なリソースのプリロード実行
  React.useEffect(() => {
    preloadCriticalResources();
  }, [preloadCriticalResources]);

  // モバイル専用のスワイプナビゲーション設定
  React.useEffect(() => {
    if (isMobile) {
      // カスタムスワイプハンドラーの設定
      onSwipe('right', () => {
        console.log('Right swipe detected - going back');
        // 戻るナビゲーションは自動的に処理される
      });

      onSwipe('left', () => {
        console.log('Left swipe detected');
        // 左スワイプで次のページ（必要に応じて実装）
      });
    }
  }, [isMobile, onSwipe]);

  // デスクトップは従来のレイアウト、モバイルは新しいレイアウト移行システム
  if (isMobile) {
    return (
      <MobileLayoutTransition enableBottomNav={true}>
        <div className="min-h-screen bg-gray-50">
          {/* ヘッダー（モバイル用） */}
          <Header />

          {/* メインコンテンツ */}
          <main className="min-h-[calc(100vh-4rem)]">
            <div className="p-4">
              <div className="max-w-full mx-auto">{children}</div>
            </div>

            {/* フッター */}
            <Footer />
          </main>
        </div>
      </MobileLayoutTransition>
    );
  }

  // デスクトップ・タブレット用従来レイアウト
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー（全画面固定） */}
      <Header />

      {/* メインコンテンツエリア */}
      <div className="flex min-h-[calc(100vh-4rem)]">
        {/* サイドバー */}
        <Sidebar />
        {/* メインコンテンツ */}
        <main
          className={`
            flex-1 flex flex-col
            transition-all duration-300 ease-in-out
            ${isDesktop && sidebarOpen ? 'lg:ml-64' : 'ml-0'}
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