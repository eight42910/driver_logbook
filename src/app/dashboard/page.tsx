'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import {
  getMonthlyStats,
  getDailyReports,
} from '@/lib/supabase/queries/daily-reports';
import { PlusIcon, BookOpenIcon, TruckIcon, CalendarIcon } from 'lucide-react';
import Link from 'next/link';

// 統計データの型定義
interface DashboardStats {
  workingDays: number;
  totalDistance: number;
  totalDeliveries: number;
  totalTollFee: number;
  totalHours: number;
}

function DashboardContent() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [recentReports, setRecentReports] = useState<any[]>([]);

  // 全てのhooksを条件分岐より前に配置
  useEffect(() => {
    console.log('📊 Dashboard認証チェック:', {
      loading,
      user: !!user,
      userId: user?.id,
    });
    // 初回読み込み完了後に未認証ならリダイレクト
    if (!loading && !user) {
      console.log('❌ 未認証のためログインページにリダイレクト');
      router.push('/login');
    }
  }, [user, loading, router]);

  // 統計データとレポート履歴を取得
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      try {
        setStatsLoading(true);

        // 現在の年月を取得
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        // 月間統計を取得
        const monthlyStats = await getMonthlyStats(
          user.id,
          currentYear,
          currentMonth
        );
        setStats(monthlyStats);

        // 最近の日報を3件取得
        const reports = await getDailyReports(user.id, { limit: 3 });
        setRecentReports(reports);
      } catch (error) {
        console.error('ダッシュボードデータ取得エラー:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  // hooksの後に条件分岐
  // 初回の認証状態確認中のみローディング表示（短時間）
  if (loading && !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">認証状態を確認中...</p>
        </div>
      </div>
    );
  }

  // 認証状態確認完了後、未認証の場合はリダイレクト中
  if (!user) {
    return null;
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* ウェルカムメッセージ */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">
            おかえりなさい、{userProfile?.display_name || 'ドライバー'}さん！
          </h1>
          <p className="text-blue-100">
            {userProfile?.company_name ? `${userProfile.company_name}での` : ''}
            今日も安全運転でお疲れさまです。
          </p>
        </div>

        {/* 統計カード */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                今月の稼働日数
              </CardTitle>
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {stats?.workingDays || 0}日
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date().getMonth() + 1}月の実績
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                今月の総距離
              </CardTitle>
              <TruckIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {stats?.totalDistance || 0}km
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date().getMonth() + 1}月の実績
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                今月の配送件数
              </CardTitle>
              <BookOpenIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {stats?.totalDeliveries || 0}件
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date().getMonth() + 1}月の実績
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                今月の高速代
              </CardTitle>
              <TruckIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    ¥{stats?.totalTollFee?.toLocaleString() || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date().getMonth() + 1}月の実績
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* クイックアクション */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>クイックアクション</CardTitle>
              <CardDescription>よく使う機能へのショートカット</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button asChild className="w-full justify-start" size="lg">
                <Link href="/reports">
                  <PlusIcon className="mr-2 h-4 w-4" />
                  今日の日報を作成
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full justify-start"
                size="lg"
              >
                <Link href="/reports/list">
                  <BookOpenIcon className="mr-2 h-4 w-4" />
                  日報履歴を確認
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full justify-start"
                size="lg"
              >
                <Link href="/monthly-reports">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  月次レポート
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>最近の活動</CardTitle>
              <CardDescription>最新の日報エントリ</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statsLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    ))}
                  </div>
                ) : recentReports.length > 0 ? (
                  <div className="space-y-3">
                    {recentReports.map((report) => (
                      <div
                        key={report.id}
                        className="border-l-2 border-blue-500 pl-3"
                      >
                        <div className="flex justify-between items-center">
                          <p className="text-sm font-medium">
                            {new Date(report.date).toLocaleDateString('ja-JP')}
                          </p>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              report.is_worked
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {report.is_worked ? '稼働' : '休日'}
                          </span>
                        </div>
                        {report.is_worked && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {report.distance_km}km・{report.deliveries || 0}
                            件配送
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpenIcon className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p className="text-sm">まだ日報が登録されていません</p>
                    <p className="text-xs mt-1">
                      最初の日報を作成してみましょう！
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}

export default function DashboardPage() {
  return <DashboardContent />;
}
