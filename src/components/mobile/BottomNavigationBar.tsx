'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useResponsive } from '@/contexts/LayoutContext';
import { usePerformance } from '@/contexts/PerformanceContext';
import {
  LayoutDashboard,
  BarChart3,
  Calendar,
  Settings,
  Plus,
} from 'lucide-react';

/**
 * モバイル専用下部ナビゲーションバー
 * iOS/Androidアプリのような直感的なナビゲーション体験を提供
 */

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: number;
  isSpecial?: boolean; // FAB(Floating Action Button)として表示
}

const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'ホーム',
    icon: LayoutDashboard,
    href: '/dashboard',
  },
  {
    id: 'reports-list',
    label: '日報一覧',
    icon: Calendar,
    href: '/reports/list',
  },
  {
    id: 'create-report',
    label: '日報作成',
    icon: Plus,
    href: '/reports',
    isSpecial: true, // 中央のFABとして表示
  },
  {
    id: 'monthly',
    label: '月次レポート',
    icon: BarChart3,
    href: '/reports/monthly',
  },
  {
    id: 'settings',
    label: '設定',
    icon: Settings,
    href: '/settings',
  },
];

export function BottomNavigationBar() {
  const pathname = usePathname();
  const { isMobile } = useResponsive();
  const { trackUserAction } = usePerformance();

  // デスクトップでは表示しない
  if (!isMobile) {
    return null;
  }

  // 認証ページでは表示しない
  if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
    return null;
  }

  const isActiveRoute = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* コンテンツのパディング調整用スペーサー */}
      <div className="h-20 w-full" />

      {/* 下部ナビゲーションバー */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
        <div className="relative px-4 py-2">
          <div className="flex items-center justify-around">
            {navigationItems.map((item) => {
              const isActive = isActiveRoute(item.href);
              const Icon = item.icon;

              if (item.isSpecial) {
                // 中央のFAB (Floating Action Button)
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() =>
                      trackUserAction('bottom_nav_fab_click', {
                        itemId: item.id,
                        label: item.label,
                        href: item.href,
                      })
                    }
                    className="relative flex flex-col items-center justify-center"
                  >
                    <div className="absolute -top-6 bg-blue-600 rounded-full p-3 shadow-lg border-4 border-white">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="mt-4 text-xs font-medium text-blue-600">
                      {item.label}
                    </div>
                  </Link>
                );
              }

              // 通常のナビゲーションアイテム
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() =>
                    trackUserAction('bottom_nav_click', {
                      itemId: item.id,
                      label: item.label,
                      href: item.href,
                      isActive,
                    })
                  }
                  className={cn(
                    'flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 min-w-[64px]',
                    isActive
                      ? 'text-blue-600'
                      : 'text-gray-600 hover:text-blue-600 active:scale-95'
                  )}
                >
                  <div className="relative">
                    <Icon
                      className={cn(
                        'h-6 w-6 transition-transform duration-200',
                        isActive && 'scale-110'
                      )}
                    />
                    {/* バッジ表示 */}
                    {item.badge && item.badge > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-xs font-medium mt-1 transition-all duration-200',
                      isActive ? 'text-blue-600 font-semibold' : 'text-gray-600'
                    )}
                  >
                    {item.label}
                  </span>

                  {/* アクティブインジケーター */}
                  {isActive && (
                    <div className="absolute -bottom-1 w-6 h-1 bg-blue-600 rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* iPhone X以降の Home Indicator 対応 */}
        <div className="h-safe-area-inset-bottom bg-white" />
      </nav>
    </>
  );
}

/**
 * モバイル専用ページラッパー
 * 下部ナビゲーションとの干渉を防ぐ
 */
export function MobilePageWrapper({ children }: { children: React.ReactNode }) {
  const { isMobile } = useResponsive();

  return (
    <div
      className={cn(
        'min-h-screen',
        isMobile && 'pb-20' // 下部ナビの高さ分のパディング
      )}
    >
      {children}
      {isMobile && <BottomNavigationBar />}
    </div>
  );
}

/**
 * クイックアクションFAB
 * メインのFABとは別の補助的なアクション
 */
interface QuickActionFABProps {
  actions: Array<{
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    onClick: () => void;
    color?: string;
  }>;
}

export function QuickActionFAB({ actions }: QuickActionFABProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const { isMobile } = useResponsive();

  if (!isMobile || actions.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-24 right-4 z-40">
      {/* 展開されたアクション */}
      {isExpanded && (
        <div className="flex flex-col space-y-3 mb-3">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                onClick={() => {
                  action.onClick();
                  setIsExpanded(false);
                }}
                className={cn(
                  'flex items-center justify-center w-12 h-12 rounded-full shadow-lg transition-all duration-200 transform hover:scale-110',
                  action.color || 'bg-gray-600 text-white'
                )}
                style={{
                  animation: `slideUp 0.2s ease-out ${index * 0.1}s both`,
                }}
              >
                <Icon className="h-6 w-6" />
              </button>
            );
          })}
        </div>
      )}

      {/* メインのFABトリガー */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'flex items-center justify-center w-14 h-14 bg-gray-800 text-white rounded-full shadow-lg transition-all duration-300',
          isExpanded && 'rotate-45'
        )}
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
}

/**
 * スワイプジェスチャー対応
 */
export function useSwipeNavigation() {
  const { isMobile } = useResponsive();
  const pathname = usePathname();

  React.useEffect(() => {
    if (!isMobile) return;

    let startX = 0;
    let startY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;

      const deltaX = endX - startX;
      const deltaY = endY - startY;

      // 水平スワイプの判定（垂直スワイプより大きい場合）
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 100) {
        if (deltaX > 0) {
          // 右スワイプ - 戻る
          window.history.back();
        } else {
          // 左スワイプ - 次のページ（実装に応じて）
          // router.push('/next-page');
        }
      }
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, pathname]);
}
