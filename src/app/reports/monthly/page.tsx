'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  usePageLoadTracking,
  usePerformance,
} from '@/contexts/PerformanceContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { getDailyReports } from '@/lib/supabase/queries/daily-reports';
import { DailyReport } from '@/types/database';
import {
  Calendar,
  FileText,
  MapPin,
  Truck,
  DollarSign,
  Activity,
  TrendingUp,
  Clock,
  FileDown,
  FileSpreadsheet,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ja } from 'date-fns/locale';
import type { CSVExportFormat } from '@/lib/utils/csv-export';
import { calculateMonthlyStats } from '@/lib/utils/pdf-generator-html2canvas';

// 月次統計の型定義
interface MonthlyStats {
  year: number;
  month: number;
  workingDays: number;
  totalDistance: number;
  totalDeliveries: number;
  totalHighwayFee: number;
  totalWorkingHours: number;
  averageDistance: number;
  averageDeliveries: number;
  averageWorkingHours: number;
}

/**
 * 月次レポートページ
 *
 * 機能：
 * - 年月選択
 * - 月次統計表示
 * - 日報詳細一覧表示
 * - PDF/CSVエクスポート（今後実装）
 */
export default function MonthlyReportsPage() {
  const { user, profile, loading } = useAuth();
  const { trackUserAction } = usePerformance();

  // ページ読み込みトラッキング
  usePageLoadTracking('Monthly Report');

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [monthlyReports, setMonthlyReports] = useState<DailyReport[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // PDFエクスポート関数（動的読み込み）
  const handlePDFExport = async () => {
    if (!monthlyReports.length || !profile?.display_name) {
      alert('エクスポートするデータがありません');
      return;
    }

    const startTime = performance.now();
    setIsExporting(true);

    try {
      // PDF生成モジュールを動的に読み込み
      const { generateMonthlyReportPDF } = await import(
        '@/lib/utils/pdf-generator-html2canvas'
      );

      // PDF用の統計データを計算
      const pdfStats = calculateMonthlyStats(monthlyReports);
      const period = `${selectedYear}年${selectedMonth}月`;

      await generateMonthlyReportPDF(
        monthlyReports,
        pdfStats,
        period,
        profile.display_name || 'ユーザー'
      );

      // 成功トラッキング
      const loadTime = performance.now() - startTime;
      trackUserAction('monthly_pdf_export_success', {
        reportCount: monthlyReports.length,
        period,
        loadTime,
      });
    } catch (error) {
      console.error('PDF export error:', error);
      alert('PDFエクスポートに失敗しました');

      // エラートラッキング
      trackUserAction('monthly_pdf_export_error', {
        error: error instanceof Error ? error.message : String(error),
        period: `${selectedYear}年${selectedMonth}月`,
      });
    } finally {
      setIsExporting(false);
    }
  };

  // CSVエクスポート関数（動的読み込み）
  const handleCSVExport = async (format: CSVExportFormat = 'detailed') => {
    if (!monthlyReports.length) {
      alert('エクスポートするデータがありません');
      return;
    }

    const startTime = performance.now();
    setIsExporting(true);

    try {
      // CSV出力モジュールを動的に読み込み
      const { downloadMonthlyCSV } = await import('@/lib/utils/csv-export');

      downloadMonthlyCSV(monthlyReports, selectedYear, selectedMonth, format);

      // 成功トラッキング
      const loadTime = performance.now() - startTime;
      trackUserAction('monthly_csv_export_success', {
        reportCount: monthlyReports.length,
        format,
        period: `${selectedYear}年${selectedMonth}月`,
        loadTime,
      });
    } catch (error) {
      console.error('CSV export error:', error);
      alert('CSVエクスポートに失敗しました');

      // エラートラッキング
      trackUserAction('monthly_csv_export_error', {
        error: error instanceof Error ? error.message : String(error),
        format,
        period: `${selectedYear}年${selectedMonth}月`,
      });
    } finally {
      setIsExporting(false);
    }
  };

  // 月次データの読み込み
  const loadMonthlyData = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoadingData(true);

      // 全ての日報を取得
      const allReports = await getDailyReports(user.id);

      // 選択した月のデータをフィルター
      const monthStart = startOfMonth(
        new Date(selectedYear, selectedMonth - 1)
      );
      const monthEnd = endOfMonth(new Date(selectedYear, selectedMonth - 1));

      const monthReports = allReports.filter((report) => {
        const reportDate = new Date(report.date);
        return reportDate >= monthStart && reportDate <= monthEnd;
      });

      setMonthlyReports(monthReports);

      // 統計計算
      const workingReports = monthReports.filter((report) => report.is_worked);

      const stats: MonthlyStats = {
        year: selectedYear,
        month: selectedMonth,
        workingDays: workingReports.length,
        totalDistance: 0,
        totalDeliveries: 0,
        totalHighwayFee: 0,
        totalWorkingHours: 0,
        averageDistance: 0,
        averageDeliveries: 0,
        averageWorkingHours: 0,
      };

      // 合計値の計算
      workingReports.forEach((report) => {
        stats.totalDistance += report.distance_km || 0;
        stats.totalDeliveries += report.deliveries || 0;
        stats.totalHighwayFee += report.highway_fee || 0;

        // 稼働時間の計算（時:分形式から時間数に変換）
        if (report.start_time && report.end_time) {
          const startHour = parseInt(report.start_time.split(':')[0]);
          const startMin = parseInt(report.start_time.split(':')[1]);
          const endHour = parseInt(report.end_time.split(':')[0]);
          const endMin = parseInt(report.end_time.split(':')[1]);

          const startMinutes = startHour * 60 + startMin;
          const endMinutes = endHour * 60 + endMin;
          const workingMinutes = endMinutes - startMinutes;

          if (workingMinutes > 0) {
            stats.totalWorkingHours += workingMinutes / 60;
          }
        }
      });

      // 平均値の計算
      if (stats.workingDays > 0) {
        stats.averageDistance =
          Math.round((stats.totalDistance / stats.workingDays) * 10) / 10;
        stats.averageDeliveries =
          Math.round((stats.totalDeliveries / stats.workingDays) * 10) / 10;
        stats.averageWorkingHours =
          Math.round((stats.totalWorkingHours / stats.workingDays) * 10) / 10;
      }

      setMonthlyStats(stats);
    } catch (error) {
      console.error('月次データ読み込みエラー:', error);
    } finally {
      setIsLoadingData(false);
    }
  }, [user, selectedYear, selectedMonth]);

  // データ読み込み
  useEffect(() => {
    if (user && !loading) {
      loadMonthlyData();
    }
  }, [user, loading, selectedYear, selectedMonth, loadMonthlyData]);

  // 年月選択オプションの生成
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

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
      <div className="space-y-6">
        {/* ヘッダー */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">月次レポート</h1>
            <p className="mt-2 text-gray-600">
              月別の業務統計とデータのエクスポート
            </p>
          </div>
        </div>

        {/* 年月選択 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              対象月選択
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="space-y-2">
                <Label htmlFor="year">年</Label>
                <select
                  id="year"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}年
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="month">月</Label>
                <select
                  id="month"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                >
                  {months.map((month) => (
                    <option key={month} value={month}>
                      {month}月
                    </option>
                  ))}
                </select>
              </div>
              <div className="pt-8">
                <Button onClick={loadMonthlyData} disabled={isLoadingData}>
                  {isLoadingData ? (
                    <>
                      <Activity className="h-4 w-4 mr-2 animate-spin" />
                      読み込み中...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="h-4 w-4 mr-2" />
                      データ更新
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 月次統計 */}
        {monthlyStats && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedYear}年{selectedMonth}月の統計
              </h2>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={handlePDFExport}
                  disabled={isExporting || !monthlyReports.length}
                >
                  {isExporting ? (
                    <>
                      <Activity className="h-4 w-4 mr-2 animate-spin" />
                      PDF出力中...
                    </>
                  ) : (
                    <>
                      <FileDown className="h-4 w-4 mr-2" />
                      PDF出力
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleCSVExport('detailed')}
                  disabled={isExporting || !monthlyReports.length}
                >
                  {isExporting ? (
                    <>
                      <Activity className="h-4 w-4 mr-2 animate-spin" />
                      CSV出力中...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      CSV出力
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {/* 稼働日数 */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    稼働日数
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {monthlyStats.workingDays}日
                  </div>
                  <p className="text-xs text-muted-foreground">
                    全日数: {monthlyReports.length}日
                  </p>
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

              {/* 稼働時間 */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    総稼働時間
                  </CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.round(monthlyStats.totalWorkingHours)}時間
                  </div>
                  <p className="text-xs text-muted-foreground">
                    平均: {monthlyStats.averageWorkingHours}時間/日
                  </p>
                </CardContent>
              </Card>

              {/* 高速料金 */}
              <Card className="md:col-span-2 lg:col-span-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    高速料金
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ¥{monthlyStats.totalHighwayFee.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">月間合計支出</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* 日報詳細一覧 */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            日報詳細一覧
          </h2>

          {isLoadingData ? (
            <div className="text-center py-8">
              <Activity className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-gray-500">データを読み込み中...</p>
            </div>
          ) : monthlyReports.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  該当月の日報がありません
                </h3>
                <p className="text-gray-500">
                  {selectedYear}年{selectedMonth}
                  月の日報データが見つかりません。
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="bg-white rounded-lg border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        日付
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        稼働状況
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        時間
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        距離
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        配送件数
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        高速料金
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        備考
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {monthlyReports.map((report) => (
                      <tr key={report.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {format(new Date(report.date), 'M/d (EEE)', {
                            locale: ja,
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              report.is_worked
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {report.is_worked ? '稼働' : '非稼働'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {report.is_worked &&
                          report.start_time &&
                          report.end_time
                            ? `${report.start_time}-${report.end_time}`
                            : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {report.distance_km ? `${report.distance_km}km` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {report.deliveries ? `${report.deliveries}件` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {report.highway_fee
                            ? `¥${report.highway_fee.toLocaleString()}`
                            : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div
                            className="max-w-xs truncate"
                            title={report.notes || ''}
                          >
                            {report.notes || '-'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
