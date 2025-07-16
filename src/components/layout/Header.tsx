'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import {
  MenuIcon,
  HomeIcon,
  BookOpenIcon,
  BarChart3Icon,
  SettingsIcon,
  LogOutIcon,
  UserIcon,
} from 'lucide-react';

const navigationItems = [
  { href: '/dashboard', label: 'ダッシュボード', icon: HomeIcon },
  { href: '/daily-reports', label: '日報管理', icon: BookOpenIcon },
  { href: '/monthly-reports', label: '月次レポート', icon: BarChart3Icon },
  { href: '/settings', label: '設定', icon: SettingsIcon },
];

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, userProfile, signOut, loading } = useAuth();

  // 認証が必要ないページかチェック
  const isAuthPage =
    pathname?.startsWith('/login') || pathname?.startsWith('/register');

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const getUserDisplayName = () => {
    if (userProfile?.display_name) return userProfile.display_name;
    if (user?.email) return user.email;
    return 'ユーザー';
  };

  const getUserInitials = () => {
    const name = getUserDisplayName();
    if (name.includes('@')) {
      // メールアドレスの場合は最初の文字
      return name.charAt(0).toUpperCase();
    }
    // 日本語名の場合は最初の文字
    return name.charAt(0);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4">
        <div className="flex h-14 items-center justify-between">
          {/* ロゴ・ブランド */}
          <div className="flex items-center space-x-4">
            <Link
              href={user ? '/dashboard' : '/'}
              className="flex items-center space-x-2"
            >
              <div className="h-8 w-8 rounded-md bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">DL</span>
              </div>
              <span className="font-semibold text-lg">Driver Logbook</span>
            </Link>
          </div>

          {/* デスクトップナビゲーション */}
          {user && !isAuthPage && (
            <nav className="hidden md:flex items-center space-x-6">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-2 text-sm font-medium transition-colors hover:text-blue-600 ${
                      isActive ? 'text-blue-600' : 'text-gray-600'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* 右側のアクション */}
          <div className="flex items-center space-x-4">
            {loading ? (
              <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
            ) : user && !isAuthPage ? (
              <>
                {/* ユーザーメニュー */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-8 w-8 rounded-full"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-medium">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {getUserDisplayName()}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center">
                        <UserIcon className="mr-2 h-4 w-4" />
                        プロフィール
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="flex items-center">
                        <SettingsIcon className="mr-2 h-4 w-4" />
                        設定
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="text-red-600"
                    >
                      <LogOutIcon className="mr-2 h-4 w-4" />
                      ログアウト
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* モバイルメニュー */}
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden">
                      <MenuIcon className="h-5 w-5" />
                      <span className="sr-only">メニューを開く</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                    <SheetHeader>
                      <SheetTitle>ナビゲーション</SheetTitle>
                    </SheetHeader>
                    <nav className="flex flex-col space-y-4">
                      <div className="px-3 py-2">
                        <div className="space-y-1">
                          {navigationItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className={`flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 ${
                                  isActive
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'text-gray-700'
                                }`}
                              >
                                <Icon className="h-4 w-4" />
                                <span>{item.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    </nav>
                  </SheetContent>
                </Sheet>
              </>
            ) : (
              !isAuthPage && (
                <div className="flex items-center space-x-2">
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/login">ログイン</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href="/register">新規登録</Link>
                  </Button>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
