'use client';

import React, { Suspense, lazy, useState, useEffect } from 'react';
import Image from 'next/image';
import { useMobilePerformance } from '@/lib/utils/mobile-performance-monitor';
import { useResponsive } from '@/contexts/LayoutContext';

// 軽量なSkeletonコンポーネント
const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

/**
 * モバイル最適化コンポーネント群
 * パフォーマンスと体験の最適化を実現
 */

const ChartModule = lazy(() =>
  import('recharts').then((module) => ({
    default: module.LineChart,
  }))
);

/**
 * モバイル用軽量ダッシュボード
 */
export function MobileDashboard() {
  const { metrics } = useMobilePerformance();
  const { isMobile } = useResponsive();
  const [stats, setStats] = useState<MobileStats | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  // モバイル用の軽量データフェッチ
  useEffect(() => {
    if (!isMobile) {
      setIsLoading(false);
      return;
    }

    let isCancelled = false;

    const loadStats = async () => {
      try {
        setIsLoading(true);
        const data = await fetchLightweightStats();
        if (!isCancelled) {
          setStats(data);
        }
      } catch (error) {
        console.error('Stats loading error:', error);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadStats();

    return () => {
      isCancelled = true;
    };
  }, [isMobile]);

  if (!isMobile) {
    return <FullDashboard />;
  }

  return (
    <div className="p-4 space-y-4">
      {/* パフォーマンス警告 */}
      {metrics.networkType === 'slow-2g' && <PerformanceWarningBanner />}

      {/* 軽量スタッツカード */}
      <Suspense fallback={<DashboardSkeleton />}>
        <QuickStatsGrid stats={stats} isLoading={isLoading} />
      </Suspense>

      {/* 最近のアクティビティ（最小限） */}
      <Suspense fallback={<ActivitySkeleton />}>
        <RecentActivityMobile />
      </Suspense>

      {/* クイックアクション */}
      <QuickActionGrid />
    </div>
  );
}

/**
 * ネットワーク状況に応じた警告バナー
 */
function PerformanceWarningBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
      <div className="flex items-center justify-between">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>低速ネットワークを検出</strong>
              <br />
              軽量モードで表示しています
            </p>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-yellow-400 hover:text-yellow-600"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

/**
 * 軽量スタッツグリッド
 */
interface MobileStats {
  todayWorked?: boolean;
  monthlyDays?: number;
  totalDistance?: number;
  weeklyIncome?: number;
}

interface QuickStatsGridProps {
  stats: MobileStats | undefined;
  isLoading: boolean;
}

function QuickStatsGrid({ stats, isLoading }: QuickStatsGridProps) {
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const quickStats = [
    {
      label: '今日の稼働',
      value: stats?.todayWorked ? '✅ 稼働中' : '❌ 未稼働',
      color: stats?.todayWorked ? 'text-green-600' : 'text-red-600',
    },
    {
      label: '今月の日数',
      value: `${stats?.monthlyDays || 0}日`,
      color: 'text-blue-600',
    },
    {
      label: '総距離',
      value: `${stats?.totalDistance || 0}km`,
      color: 'text-purple-600',
    },
    {
      label: '今週の収入',
      value: `¥${(stats?.weeklyIncome || 0).toLocaleString()}`,
      color: 'text-green-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {quickStats.map((stat, index) => (
        <div
          key={index}
          className="bg-white p-4 rounded-lg shadow-sm border border-gray-100"
        >
          <div className="text-xs text-gray-500 mb-1">{stat.label}</div>
          <div className={`text-lg font-semibold ${stat.color}`}>
            {stat.value}
          </div>
        </div>
      ))}
    </div>
  );
}

interface ActivityItem {
  description: string;
  createdAt: Date;
}

/**
 * モバイル用最近のアクティビティ
 */
function RecentActivityMobile() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    let isCancelled = false;

    const loadActivities = async () => {
      try {
        const data = await fetchRecentActivities(3); // 最新3件のみ
        if (!isCancelled) {
          setActivities(data);
        }
      } catch (error) {
        console.error('Activities loading error:', error);
      }
    };

    loadActivities();

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold">最近の活動</h3>
      </div>
      <div className="divide-y divide-gray-100">
        {activities.slice(0, 3).map((activity: ActivityItem, index: number) => (
          <div key={index} className="p-4 flex items-center space-x-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 truncate">
                {activity.description}
              </p>
              <p className="text-xs text-gray-500">
                {formatTimeAgo(activity.createdAt)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * クイックアクショングリッド
 */
function QuickActionGrid() {
  const actions = [
    {
      label: '今日の日報',
      icon: '📝',
      href: '/reports',
      badge: null,
    },
    {
      label: '月次レポート',
      icon: '📊',
      href: '/reports/monthly',
      badge: null,
    },
    {
      label: '収支管理',
      icon: '💰',
      href: '/finance',
      badge: 'NEW',
    },
    {
      label: '設定',
      icon: '⚙️',
      href: '/settings',
      badge: null,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {actions.map((action, index) => (
        <a
          key={index}
          href={action.href}
          className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center space-y-2 hover:bg-gray-50 transition-colors"
        >
          <div className="relative">
            <span className="text-2xl">{action.icon}</span>
            {action.badge && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 rounded-full">
                {action.badge}
              </span>
            )}
          </div>
          <span className="text-sm font-medium text-center">
            {action.label}
          </span>
        </a>
      ))}
    </div>
  );
}

/**
 * プログレッシブ画像読み込み
 */
interface ProgressiveImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
}

export function ProgressiveImage({
  src,
  alt,
  className = '',
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PC9zdmc+',
}: ProgressiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* プレースホルダー */}
      {!isLoaded && !hasError && (
        <Image
          src={placeholder}
          alt=""
          fill
          className="object-cover filter blur-sm"
        />
      )}

      {/* メイン画像 */}
      <Image
        src={src}
        alt={alt}
        fill
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* エラー時のフォールバック */}
      {hasError && (
        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
          <span className="text-gray-400">画像を読み込めません</span>
        </div>
      )}
    </div>
  );
}

/**
 * 遅延読み込み対応のチャート
 */
interface ChartData {
  [key: string]: string | number;
}

interface LazyChartProps {
  data: ChartData[];
  type: 'line' | 'bar' | 'pie';
  className?: string;
}

export function LazyChart({ data, type, className }: LazyChartProps) {
  const [shouldLoad, setShouldLoad] = useState(false);

  // Intersection Observer で画面内に入ったら読み込み
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
        }
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById(`chart-${type}`);
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [type]);

  return (
    <div id={`chart-${type}`} className={className}>
      {shouldLoad ? (
        <Suspense fallback={<ChartSkeleton />}>
          <ChartModule data={data} />
        </Suspense>
      ) : (
        <ChartPlaceholder />
      )}
    </div>
  );
}

/**
 * スケルトンコンポーネント群
 */
function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="bg-white p-4 rounded-lg shadow-sm border border-gray-100"
        >
          <Skeleton className="h-3 w-16 mb-2" />
          <Skeleton className="h-6 w-20" />
        </div>
      ))}
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="p-4 border-b border-gray-100">
        <Skeleton className="h-5 w-24" />
      </div>
      <div className="divide-y divide-gray-100">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-4 flex items-center space-x-3">
            <Skeleton className="w-2 h-2 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-3/4 mb-1" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

function ChartPlaceholder() {
  return (
    <div className="bg-gray-50 p-8 rounded-lg border-2 border-dashed border-gray-300 text-center">
      <div className="text-gray-400">
        📊
        <br />
        チャートを読み込み中...
      </div>
    </div>
  );
}

/**
 * ヘルパー関数
 */
async function fetchLightweightStats() {
  // 軽量な統計データのみ取得
  // 実際の実装では Supabase から最小限のデータを取得
  return {
    todayWorked: true,
    monthlyDays: 15,
    totalDistance: 1250,
    weeklyIncome: 95000,
  };
}

async function fetchRecentActivities(limit: number): Promise<ActivityItem[]> {
  // 最近のアクティビティを取得
  return [
    { description: '日報を作成しました', createdAt: new Date() },
    {
      description: 'PDF レポートを出力しました',
      createdAt: new Date(Date.now() - 3600000),
    },
    {
      description: '月次データを更新しました',
      createdAt: new Date(Date.now() - 7200000),
    },
  ].slice(0, limit);
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'たった今';
  if (diffMins < 60) return `${diffMins}分前`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}時間前`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}日前`;
}

// フルダッシュボード（デスクトップ用）
function FullDashboard() {
  return <div>Full Desktop Dashboard</div>;
}
