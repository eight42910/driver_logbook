'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  HomeIcon,
  BookOpenIcon,
  BarChart3Icon,
  SettingsIcon,
  UserIcon,
} from 'lucide-react';

const sidebarItems = [
  {
    href: '/dashboard',
    label: 'ダッシュボード',
    icon: HomeIcon,
  },
  {
    href: '/reports/list',
    label: '日報一覧',
    icon: BookOpenIcon,
  },
  {
    href: '/reports',
    label: '日報作成',
    icon: BookOpenIcon,
  },
  {
    href: '/monthly-reports',
    label: '月次レポート',
    icon: BarChart3Icon,
  },
  {
    href: '/profile',
    label: 'プロフィール',
    icon: UserIcon,
  },
  {
    href: '/settings',
    label: '設定',
    icon: SettingsIcon,
  },
];

/**
 * サイドバーコンポーネント
 * デスクトップ表示時のメインナビゲーション
 */
export function Sidebar() {
  const pathname = usePathname();
  const { userProfile } = useAuth();

  return (
    <aside className="hidden w-64 md:flex flex-col bg-white border-r border-gray-200">
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        {/* ユーザー情報 */}
        <div className="flex items-center flex-shrink-0 px-4 mb-6">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-sm font-medium text-blue-700">
                {userProfile?.display_name?.charAt(0) || 'U'}
              </span>
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">
              {userProfile?.display_name || 'ユーザー'}
            </p>
            {userProfile?.company_name && (
              <p className="text-xs text-gray-500">
                {userProfile.company_name}
              </p>
            )}
          </div>
        </div>

        {/* ナビゲーション */}
        <nav className="flex-1 px-2 space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <Icon
                  className={cn(
                    'mr-3 h-5 w-5 flex-shrink-0',
                    isActive
                      ? 'text-blue-500'
                      : 'text-gray-400 group-hover:text-gray-500'
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* ユーティリティ情報 */}
        <div className="px-4 py-3 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            <p className="mb-1">Version 3.0.0</p>
            <p>© 2024 Driver Logbook</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

/**
 * モバイル用サイドバーコンポーネント
 * シンプルなリンクリスト
 */
export function MobileSidebar({ className }: SidebarProps) {
  const pathname = usePathname();

  const routes = [
    {
      label: 'ダッシュボード',
      icon: LayoutDashboard,
      href: '/dashboard',
    },
    {
      label: '日報管理',
      icon: FileText,
      href: '/reports',
    },
    {
      label: 'メンテナンス',
      icon: Wrench,
      href: '/maintenance',
    },
    {
      label: '経費管理',
      icon: Receipt,
      href: '/expenses',
    },
    {
      label: '設定',
      icon: Settings,
      href: '/settings',
    },
  ];

  return (
    <nav className={cn('grid gap-2 text-lg font-medium', className)}>
      {routes.map((route) => (
        <Button
          key={route.href}
          asChild
          variant={pathname === route.href ? 'default' : 'ghost'}
          className="justify-start"
        >
          <Link href={route.href}>
            <route.icon className="h-5 w-5 mr-3" />
            {route.label}
          </Link>
        </Button>
      ))}
    </nav>
  );
}
