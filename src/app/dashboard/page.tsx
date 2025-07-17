'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getDailyReports } from '@/lib/supabase/queries/daily-reports';
import { DailyReport } from '@/types/database';
import {
  Calendar,
  FileText,
  Plus,
  TrendingUp,
  Truck,
  MapPin,
  Clock,
  DollarSign,
  Activity,
  BarChart3,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, isToday } from 'date-fns';
import { ja } from 'date-fns/locale';

// 月次統計の型定義
interface MonthlyStats {
  workingDays: number;
  totalDistance: number;
  totalDeliveries: number;
  totalHighwayFee: number;
  averageDistance: number;
  averageDeliveries: number;
}

/**
 * ダッシュボードページ
 *
 * 機能：
 * - 今月の統計情報表示
 * - 最近の日報一覧（直近5件）
 * - クイックアクション（新規作成、一覧表示など）
 * - KPI 可視化
 */
export default function DashboardPage() {
  const { user, profile, loading } = useAuth();
  const [recentReports, setRecentReports] = useState<DailyReport[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats>({
    workingDays: 0,
    totalDistance: 0,
    totalDeliveries: 0,
    totalHighwayFee: 0,
    averageDistance: 0,
    averageDeliveries: 0,
  });
  const [isLoadingData, setIsLoadingData] = useState(true);

  // ダッシュボードデータの読み込み
  const loadDashboardData = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoadingData(true);

      // 全ての日報を取得
      const allReports = await getDailyReports(user.id);

      // 最近の日報（直近5件）
      const recent = allReports.slice(0, 5);
      setRecentReports(recent);

      // 今月の統計計算
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      const thisMonthReports = allReports.filter((report) => {
        const reportDate = new Date(report.date);
        return reportDate >= monthStart && reportDate <= monthEnd;
      });

      const workingReports = thisMonthReports.filter(
        (report) => report.is_worked
      );

      const stats: MonthlyStats = {
        workingDays: workingReports.length,
        totalDistance: workingReports.reduce((sum, report) => {
          const distance = report.distance_km || 0;
          return sum + distance;
        }, 0),
        totalDeliveries: workingReports.reduce((sum, report) => {
          const deliveries = report.deliveries || 0;
          return sum + deliveries;
        }, 0),
        totalHighwayFee: workingReports.reduce((sum, report) => {
          const fee = report.highway_fee || 0;
          return sum + fee;
        }, 0),
        averageDistance: 0,
        averageDeliveries: 0,
      };

      // 平均値の計算
      if (stats.workingDays > 0) {
        stats.averageDistance =
          Math.round((stats.totalDistance / stats.workingDays) * 10) / 10;
        stats.averageDeliveries =
          Math.round((stats.totalDeliveries / stats.workingDays) * 10) / 10;
      }

      setMonthlyStats(stats);
    } catch (error) {
      console.error('ダッシュボードデータ読み込みエラー:', error);
    } finally {
      setIsLoadingData(false);
    }
  }, [user]);

  // データの読み込み
  useEffect(() => {
    if (user && !loading) {
      loadDashboardData();
    }
  }, [user, loading, loadDashboardData]);

  // 認証チェック
  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>読み込み中...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-red-600">認証が必要です。ログインしてください。</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* ヘッダー */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ダッシュボード</h1>
            <p className="mt-2 text-gray-600">
              こんにちは、{profile?.display_name || 'ユーザー'}さん！
            </p>
            <p className="text-sm text-gray-500">
              {format(new Date(), 'yyyy年M月d日 (EEEE)', { locale: ja })}
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <Button asChild>
              <Link href="/reports">
                <Plus className="h-4 w-4 mr-2" />
                新しい日報
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/reports/list">
                <FileText className="h-4 w-4 mr-2" />
                日報一覧
              </Link>
            </Button>
          </div>
        </div>

        {/* 今月の統計 */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            今月の統計
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({format(new Date(), 'yyyy年M月', { locale: ja })})
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 稼働日数 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">稼働日数</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {monthlyStats.workingDays}日
                </div>
                <p className="text-xs text-muted-foreground">今月の稼働実績</p>
              </CardContent>
            </Card>

            {/* 総走行距離 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  総走行距離
                </CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {monthlyStats.totalDistance.toLocaleString()}km
                </div>
                <p className="text-xs text-muted-foreground">
                  平均: {monthlyStats.averageDistance}km/日
                </p>
              </CardContent>
            </Card>

            {/* 総配送件数 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  総配送件数
                </CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {monthlyStats.totalDeliveries.toLocaleString()}件
                </div>
                <p className="text-xs text-muted-foreground">
                  平均: {monthlyStats.averageDeliveries}件/日
                </p>
              </CardContent>
            </Card>

            {/* 高速料金 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">高速料金</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ¥{monthlyStats.totalHighwayFee.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">今月の合計支出</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 最近の日報 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">最近の日報</h2>
            <Button variant="outline" size="sm" asChild>
              <Link href="/reports/list">
                すべて表示
                <TrendingUp className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>

          {isLoadingData ? (
            <div className="text-center py-8">
              <Activity className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-gray-500">データを読み込み中...</p>
            </div>
          ) : recentReports.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  日報がありません
                </h3>
                <p className="text-gray-500 mb-4">
                  最初の日報を作成して業務記録を開始しましょう。
                </p>
                <Button asChild>
                  <Link href="/reports">
                    <Plus className="h-4 w-4 mr-2" />
                    新しい日報を作成
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {recentReports.map((report) => (
                <Card
                  key={report.id}
                  className={
                    isToday(new Date(report.date)) ? 'border-blue-500' : ''
                  }
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div
                          className={`p-2 rounded-full ${
                            report.is_worked
                              ? 'bg-green-100 text-green-600'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {report.is_worked ? (
                            <Truck className="h-4 w-4" />
                          ) : (
                            <Clock className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium">
                              {format(new Date(report.date), 'M月d日 (EEE)', {
                                locale: ja,
                              })}
                            </h3>
                            {isToday(new Date(report.date)) && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                今日
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            {report.is_worked ? (
                              <>
                                {report.start_time &&
                                  report.end_time &&
                                  `${report.start_time} - ${report.end_time}`}
                                {report.distance_km && (
                                  <span className="ml-2">
                                    • {report.distance_km}km
                                  </span>
                                )}
                                {report.deliveries && (
                                  <span className="ml-2">
                                    • {report.deliveries}件
                                  </span>
                                )}
                              </>
                            ) : (
                              '非稼働日'
                            )}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/reports/edit/${report.id}`}>編集</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* クイックアクション */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            クイックアクション
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/reports">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-100 rounded-full">
                      <Plus className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">新しい日報</h3>
                      <p className="text-sm text-gray-500">今日の業務を記録</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/reports/monthly">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-green-100 rounded-full">
                      <BarChart3 className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">月次レポート</h3>
                      <p className="text-sm text-gray-500">
                        統計とエクスポート
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/reports/list">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-purple-100 rounded-full">
                      <FileText className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">日報一覧</h3>
                      <p className="text-sm text-gray-500">過去の記録を確認</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
