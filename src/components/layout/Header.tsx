'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar, useResponsive } from '@/contexts/LayoutContext';
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  Truck,
  User,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

// ナビゲーションアイテムの定義
const navigationItems = [
  {
    href: '/dashboard',
    label: 'ダッシュボード',
    icon: LayoutDashboard,
  },
  {
    href: '/reports',
    label: '日報作成',
    icon: FileText,
  },
  {
    href: '/reports/list',
    label: '日報一覧',
    icon: FileText,
  },
  {
    href: '/reports/monthly',
    label: '月次レポート',
    icon: BarChart3,
  },
];

/**
 * ヘッダーコンポーネント
 *
 * 機能：
 * - ロゴ・ブランド表示
 * - ナビゲーションメニュー（デスクトップ）
 * - ハンバーガーメニュー（モバイル）
 * - ユーザープロフィール・ドロップダウン
 * - ログアウト機能
 */
export function Header() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // レイアウト関連のフック
  const { isOpen: sidebarOpen, toggle: toggleSidebar } = useSidebar();
  const { isDesktop } = useResponsive();

  // ログアウト処理
  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  };

  // アクティブなナビゲーションアイテムの判定
  const isActiveRoute = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  // ユーザー表示名の取得
  const displayName =
    profile?.display_name || user?.email?.split('@')[0] || 'ユーザー';

  // アバターの初期文字
  const avatarInitial = displayName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {/* サイドバートグルボタン（デスクトップ） */}
        {isDesktop && (
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="mr-4 p-2"
            title={sidebarOpen ? 'サイドバーを閉じる' : 'サイドバーを開く'}
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-5 w-5" />
            ) : (
              <PanelLeftOpen className="h-5 w-5" />
            )}
          </Button>
        )}

        {/* ロゴ・ブランド */}
        <div className="mr-4 flex">
          <Link href="/dashboard" className="mr-6 flex items-center space-x-2">
            <Truck className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block">
              Driver Logbook v3
            </span>
            <span className="font-bold sm:hidden">DL v3</span>
          </Link>
        </div>

        {/* デスクトップナビゲーション */}
        <div className="mr-4 hidden md:flex">
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 transition-colors hover:text-foreground/80 ${
                    isActiveRoute(item.href)
                      ? 'text-foreground'
                      : 'text-foreground/60'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* スペーサー */}
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          {/* モバイルメニュー */}
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
                >
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">メニューを開く</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="pr-0 w-72">
                {/* モバイルメニューヘッダー */}
                <div className="flex items-center space-x-2 pb-6 border-b">
                  <Truck className="h-8 w-8 text-blue-600" />
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-gray-900">
                      Driver Logbook
                    </span>
                    <span className="text-xs text-gray-500">v3.0</span>
                  </div>
                </div>

                {/* ナビゲーションメニュー */}
                <nav className="flex flex-col space-y-2 pt-6">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = isActiveRoute(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center space-x-4 rounded-lg px-4 py-3 text-base font-medium transition-all duration-200 ${
                          isActive
                            ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-600 shadow-sm'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <Icon
                          className={`h-6 w-6 ${
                            isActive ? 'text-blue-600' : 'text-gray-400'
                          }`}
                        />
                        <span className="flex-1">{item.label}</span>
                        {isActive && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        )}
                      </Link>
                    );
                  })}
                </nav>

                {/* モバイルメニューフッター */}
                <div className="absolute bottom-6 left-4 right-4">
                  <div className="text-xs text-gray-500 text-center border-t pt-4">
                    <p>© 2025 Driver Logbook v3</p>
                    <p>運転手業務効率化システム</p>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* ユーザーメニュー */}
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" alt={displayName} />
                    <AvatarFallback>{avatarInitial}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {displayName}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="flex items-center">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>ダッシュボード</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>プロフィール</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>設定</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>ログアウト</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
