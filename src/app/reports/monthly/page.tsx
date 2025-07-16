'use client';

import { useState, useEffect, useMemo } from 'react';
import { format, parse, isValid } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import {
  getMonthlyReports,
  MonthlyStats,
} from '@/lib/supabase/queries/monthly-reports';
import { exportMonthlyReportPDF } from '@/lib/utils/pdf-export';
import {
  exportMonthlyReportCSV,
  exportDailyDetailsCSV,
} from '@/lib/utils/csv-export';
import { Download, FileSpreadsheet, Calendar } from 'lucide-react';

export default function MonthlyReportsPage() {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    return format(new Date(), 'yyyy-MM');
  });
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 選択された月の年と月を取得
  const { year, month } = useMemo(() => {
    const date = parse(selectedMonth, 'yyyy-MM', new Date());
    if (!isValid(date)) {
      const now = new Date();
      return { year: now.getFullYear(), month: now.getMonth() + 1 };
    }
    return { year: date.getFullYear(), month: date.getMonth() + 1 };
  }, [selectedMonth]);

  // 月次データを取得
  useEffect(() => {
    const fetchMonthlyData = async () => {
      if (!user?.id) return;

      setLoading(true);
      setError(null);

      try {
        const data = await getMonthlyReports(user.id, year, month);
        setMonthlyStats(data);
      } catch (err) {
        console.error('月次データ取得エラー:', err);
        setError('データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchMonthlyData();
  }, [user?.id, year, month]);

  // PDF出力
  const handlePDFExport = async () => {
    if (!monthlyStats) return;

    try {
      await exportMonthlyReportPDF(monthlyStats);
    } catch (err) {
      console.error('PDF出力エラー:', err);
      setError('PDF出力に失敗しました');
    }
  };

  // CSV出力（月次統計）
  const handleMonthlyCSVExport = () => {
    if (!monthlyStats) return;

    try {
      exportMonthlyReportCSV(monthlyStats);
    } catch (err) {
      console.error('CSV出力エラー:', err);
      setError('CSV出力に失敗しました');
    }
  };

  // CSV出力（日次詳細）
  const handleDailyDetailsCSVExport = () => {
    if (!monthlyStats?.reports) return;

    try {
      exportDailyDetailsCSV(monthlyStats.reports, year, month);
    } catch (err) {
      console.error('日次詳細CSV出力エラー:', err);
      setError('CSV出力に失敗しました');
    }
  };

  if (!user) {
    return <div>ログインが必要です</div>;
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            月次レポート
          </h1>
          <p className="text-gray-600">月間の勤務実績と統計を確認できます</p>
        </div>

        {/* 月選択 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              レポート期間
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1 max-w-xs">
                <Label htmlFor="month-select">対象月</Label>
                <Input
                  id="month-select"
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handlePDFExport}
                  disabled={!monthlyStats || loading}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  PDF出力
                </Button>
                <Button
                  onClick={handleMonthlyCSVExport}
                  disabled={!monthlyStats || loading}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  月次CSV
                </Button>
                <Button
                  onClick={handleDailyDetailsCSVExport}
                  disabled={!monthlyStats?.reports.length || loading}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  日次CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* エラー表示 */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* ローディング */}
        {loading && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">データを読み込み中...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 月次統計 */}
        {!loading && monthlyStats && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  勤務日数
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {monthlyStats.workingDays}日
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  総走行距離
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {monthlyStats.totalDistance.toLocaleString()}km
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  総支出
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ¥{monthlyStats.totalExpenses.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  1日平均走行距離
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(monthlyStats.averageDistancePerDay)}km
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 日次レポート一覧 */}
        {!loading && monthlyStats && monthlyStats.reports.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>
                {format(new Date(year, month - 1), 'yyyy年M月', { locale: ja })}
                の勤務記録
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">日付</th>
                      <th className="text-left p-2">勤務</th>
                      <th className="text-left p-2">開始時刻</th>
                      <th className="text-left p-2">終了時刻</th>
                      <th className="text-right p-2">走行距離</th>
                      <th className="text-right p-2">支出</th>
                      <th className="text-left p-2">備考</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyStats.reports.map((report) => (
                      <tr key={report.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          {format(new Date(report.date), 'M/d(E)', {
                            locale: ja,
                          })}
                        </td>
                        <td className="p-2">
                          <span
                            className={`inline-flex px-2 py-1 text-xs rounded-full ${
                              report.is_worked
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {report.is_worked ? '勤務' : '休み'}
                          </span>
                        </td>
                        <td className="p-2">{report.start_time || '-'}</td>
                        <td className="p-2">{report.end_time || '-'}</td>
                        <td className="p-2 text-right">
                          {(report as unknown as Record<string, unknown>)
                            .distance
                            ? `${
                                (report as unknown as Record<string, unknown>)
                                  .distance
                              }km`
                            : '-'}
                        </td>
                        <td className="p-2 text-right">
                          {(report as unknown as Record<string, unknown>)
                            .expenses
                            ? `¥${Number(
                                (report as unknown as Record<string, unknown>)
                                  .expenses
                              ).toLocaleString()}`
                            : '-'}
                        </td>
                        <td className="p-2 text-gray-600">
                          {report.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* データなしの場合 */}
        {!loading && monthlyStats && monthlyStats.reports.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-gray-500">
                  {format(new Date(year, month - 1), 'yyyy年M月', {
                    locale: ja,
                  })}
                  の勤務記録はありません
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
