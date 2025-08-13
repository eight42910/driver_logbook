'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSidebar, useResponsive } from '@/contexts/LayoutContext';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Settings,
  Truck,
  List,
  Plus,
  Calendar,
  X,
} from 'lucide-react';

// サイドバーナビゲーションアイテムの定義
const sidebarNavItems = [
  {
    title: 'ダッシュボード',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: '概要と統計情報',
  },
  {
    title: '日報管理',
    icon: FileText,
    items: [
      {
        title: '新規作成',
        href: '/reports',
        icon: Plus,
        description: '新しい日報を作成',
      },
      {
        title: '一覧・編集',
        href: '/reports/list',
        icon: List,
        description: '既存の日報を表示・編集',
      },
    ],
  },
  {
    title: 'レポート',
    icon: BarChart3,
    items: [
      {
        title: '月次レポート',
        href: '/reports/monthly',
        icon: Calendar,
        description: '月別の集計とエクスポート',
      },
    ],
  },
  {
    title: '設定',
    href: '/settings',
    icon: Settings,
    description: 'アプリケーション設定',
  },
];

/**
 * サイドバーコンポーネント
 *
 * 機能：
 * - 階層化されたナビゲーション
 * - アクティブな項目のハイライト
 * - アイコンと説明付きのメニュー項目
 * - レスポンシブ対応（デスクトップのみ表示）
 */
export function Sidebar() {
  const pathname = usePathname();

  // レイアウト関連のフック
  const {
    isOpen: sidebarOpen,
    setOpen: setSidebarOpen,
    isMobile,
  } = useSidebar();
  const { isDesktop } = useResponsive();

  // アクティブなルートの判定
  const isActiveRoute = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  // モバイルでサイドバーを閉じる
  const handleLinkClick = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  // サイドバーが表示されない場合は何も描画しない
  if (!sidebarOpen && !isDesktop) {
    return null;
  }

  return (
    <>
      {/* サイドバー本体 */}
      <div
        className={cn(
          'flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ease-in-out',
          {
            // デスクトップ
            'hidden lg:flex lg:w-64 lg:fixed lg:inset-y-0 lg:z-40': isDesktop,
            // モバイル
            'fixed inset-y-0 left-0 z-50 w-64': isMobile && sidebarOpen,
            hidden: isMobile && !sidebarOpen,
          }
        )}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* ロゴ・ブランド */}
          <div className="flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200">
            <Link
              href="/dashboard"
              className="flex items-center space-x-2"
              onClick={handleLinkClick}
            >
              <Truck className="h-8 w-8 text-blue-600" />
              <div className="flex flex-col">
                <span className="text-lg font-bold text-gray-900">
                  Driver Logbook
                </span>
                <span className="text-xs text-gray-500">v3.0</span>
              </div>
            </Link>

            {/* モバイル用クローズボタン */}
            {isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
                className="p-2 lg:hidden"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>

          {/* ナビゲーション */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {sidebarNavItems.map((item) => {
              // グループアイテム（サブメニューあり）
              if (item.items) {
                return (
                  <div key={item.title} className="space-y-1">
                    {/* グループヘッダー */}
                    <div className="px-3 py-2">
                      <div className="flex items-center space-x-3">
                        <item.icon className="h-5 w-5 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {item.title}
                        </span>
                      </div>
                    </div>

                    {/* サブメニュー */}
                    <div className="ml-8 space-y-1">
                      {item.items.map((subItem) => (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className={cn(
                            'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                            isActiveRoute(subItem.href)
                              ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                          )}
                        >
                          <subItem.icon
                            className={cn(
                              'mr-3 h-4 w-4 flex-shrink-0',
                              isActiveRoute(subItem.href)
                                ? 'text-blue-600'
                                : 'text-gray-400 group-hover:text-gray-500'
                            )}
                          />
                          <div className="flex flex-col">
                            <span>{subItem.title}</span>
                            <span className="text-xs text-gray-400">
                              {subItem.description}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              }

              // 単一アイテム
              return (
                <Link
                  key={item.href}
                  href={item.href!}
                  onClick={handleLinkClick}
                  className={cn(
                    'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    isActiveRoute(item.href!)
                      ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <item.icon
                    className={cn(
                      'mr-3 h-5 w-5 flex-shrink-0',
                      isActiveRoute(item.href!)
                        ? 'text-blue-600'
                        : 'text-gray-400 group-hover:text-gray-500'
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{item.title}</span>
                    <span className="text-xs text-gray-400">
                      {item.description}
                    </span>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* フッター */}
          <div className="flex-shrink-0 p-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center">
              <p>© 2025 Driver Logbook v3</p>
              <p>運転手業務効率化システム</p>
            </div>
          </div>
        </div>
      </div>

      {/* モバイル用オーバーレイ */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
}
