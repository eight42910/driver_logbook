'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  PlusIcon,
  CalendarIcon,
  TableIcon,
  FilterIcon,
  SearchIcon,
  EditIcon,
  TrashIcon,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getDailyReportsWithCount } from '@/lib/supabase/queries/daily-reports';
import type { DailyReport } from '@/types/database';
import { CalendarView } from '@/components/calendar/CalendarView';
import { DeleteConfirmDialog } from '@/components/forms/DeleteConfirmDialog';

// フィルター条件の型定義
interface FilterOptions {
  startDate: string;
  endDate: string;
  workStatus: '' | 'worked' | 'not-worked';
  searchQuery: string;
}

// ページネーション設定
const ITEMS_PER_PAGE = 10;

export default function DailyReportsListPage() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<'table' | 'calendar'>('table');

  // データ状態
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ページネーション状態
  const [currentPage, setCurrentPage] = useState(1);

  // フィルター状態
  const [filters, setFilters] = useState<FilterOptions>({
    startDate: '',
    endDate: '',
    workStatus: '',
    searchQuery: '',
  });

  // フィルターの表示/非表示
  const [showFilters, setShowFilters] = useState(false);

  // 削除ダイアログの状態
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<DailyReport | null>(
    null
  );
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // データ取得関数
  const fetchReports = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const offset = (currentPage - 1) * ITEMS_PER_PAGE;
      const options = {
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        isWorked:
          filters.workStatus === 'worked'
            ? true
            : filters.workStatus === 'not-worked'
            ? false
            : undefined,
        searchQuery: filters.searchQuery || undefined,
        limit: ITEMS_PER_PAGE,
        offset,
      };

      const { reports: fetchedReports, totalCount: count } =
        await getDailyReportsWithCount(user.id, options);

      setReports(fetchedReports);
      setTotalCount(count);
    } catch (err) {
      console.error('日報一覧取得エラー:', err);
      setError('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [user?.id, currentPage, filters]);

  // 初回ロードとフィルター・ページ変更時のデータ取得
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // フィルター更新関数
  const updateFilters = (newFilters: Partial<FilterOptions>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // フィルター変更時は1ページ目に戻る
  };

  // 削除関連の関数
  const handleDeleteClick = (report: DailyReport) => {
    setReportToDelete(report);
    setDeleteDialogOpen(true);
    setDeleteSuccess(null);
    setDeleteError(null);
  };

  const handleDeleteSuccess = (reportId: number) => {
    // 楽観的削除：UIから即座に削除
    setReports((prev) => prev.filter((report) => report.id !== reportId));
    setTotalCount((prev) => prev - 1);
    setDeleteSuccess('日報を削除しました');

    // 3秒後に成功メッセージを非表示
    setTimeout(() => setDeleteSuccess(null), 3000);
  };

  const handleDeleteError = (error: string) => {
    setDeleteError(error);

    // 5秒後にエラーメッセージを非表示
    setTimeout(() => setDeleteError(null), 5000);
  };

  // ページネーション情報
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endIndex = Math.min(currentPage * ITEMS_PER_PAGE, totalCount);

  return (
    <div className="container mx-auto py-8 px-4">
      {/* ページヘッダー */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">日報一覧</h1>
          <p className="text-gray-600">過去の稼働記録を確認・編集できます</p>
        </div>

        {/* 新規作成ボタン */}
        <Link href="/reports">
          <Button className="flex items-center gap-2">
            <PlusIcon className="h-4 w-4" />
            新しい日報を作成
          </Button>
        </Link>
      </div>

      {/* 成功・エラーメッセージ */}
      {deleteSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                {deleteSuccess}
              </p>
            </div>
          </div>
        </div>
      )}

      {deleteError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{deleteError}</p>
            </div>
          </div>
        </div>
      )}

      {/* 表示切り替えとフィルター */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            {/* ビュー切り替えタブ */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setCurrentView('table')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'table'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <TableIcon className="h-4 w-4" />
                テーブル表示
              </button>
              <button
                onClick={() => setCurrentView('calendar')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'calendar'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <CalendarIcon className="h-4 w-4" />
                カレンダー表示
              </button>
            </div>

            {/* フィルターボタン */}
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FilterIcon className="h-4 w-4" />
              フィルター
            </Button>
          </div>
        </CardHeader>

        {showFilters && (
          <CardContent>
            {/* 検索バー */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                検索（メモから検索）
              </label>
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="メモやコメントから検索..."
                  value={filters.searchQuery}
                  onChange={(e) =>
                    updateFilters({ searchQuery: e.target.value })
                  }
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* フィルター項目 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  期間（開始日）
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => updateFilters({ startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  期間（終了日）
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => updateFilters({ endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  作業状況
                </label>
                <select
                  value={filters.workStatus}
                  onChange={(e) =>
                    updateFilters({
                      workStatus: e.target.value as
                        | ''
                        | 'worked'
                        | 'not-worked',
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">すべて</option>
                  <option value="worked">作業日</option>
                  <option value="not-worked">非作業日</option>
                </select>
              </div>
            </div>

            {/* フィルターリセットボタン */}
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilters({
                    startDate: '',
                    endDate: '',
                    workStatus: '',
                    searchQuery: '',
                  });
                }}
              >
                フィルターをリセット
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* メインコンテンツエリア */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">
              {currentView === 'table' ? 'テーブル表示' : 'カレンダー表示'}
            </CardTitle>
            {totalCount > 0 && (
              <p className="text-sm text-gray-600">
                全{totalCount}件中 {startIndex}〜{endIndex}件を表示
              </p>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {loading ? (
            // ローディング状態
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">データを読み込んでいます...</p>
            </div>
          ) : error ? (
            // エラー状態
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchReports} variant="outline">
                再試行
              </Button>
            </div>
          ) : reports.length === 0 ? (
            // データが空の状態
            <div className="text-center py-12">
              <TableIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                日報データがありません
              </h3>
              <p className="text-gray-600 mb-4">
                条件に合致する日報が見つかりませんでした
              </p>
              <Link href="/reports">
                <Button>新しい日報を作成</Button>
              </Link>
            </div>
          ) : currentView === 'table' ? (
            // テーブル表示
            <div className="space-y-4">
              {/* デスクトップテーブル表示 */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700">
                        日付
                      </th>
                      <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700">
                        稼働状況
                      </th>
                      <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700">
                        時間
                      </th>
                      <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700">
                        距離
                      </th>
                      <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700">
                        配送
                      </th>
                      <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700">
                        高速料金
                      </th>
                      <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report) => (
                      <tr key={report.id} className="hover:bg-gray-50">
                        <td className="border border-gray-200 px-4 py-3 text-sm">
                          {new Date(report.date).toLocaleDateString('ja-JP')}
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-sm">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              report.is_worked
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {report.is_worked ? '作業日' : '非作業日'}
                          </span>
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-sm">
                          {report.is_worked &&
                          report.start_time &&
                          report.end_time
                            ? `${report.start_time} - ${report.end_time}`
                            : '-'}
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-sm">
                          {report.distance_km ? `${report.distance_km}km` : '-'}
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-sm">
                          {report.deliveries ? `${report.deliveries}件` : '-'}
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-sm">
                          {report.highway_fee
                            ? `¥${report.highway_fee.toLocaleString()}`
                            : '-'}
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-sm">
                          <div className="flex gap-2">
                            <Link href={`/reports/edit/${report.id}`}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex items-center gap-1"
                              >
                                <EditIcon className="h-3 w-3" />
                                編集
                              </Button>
                            </Link>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:border-red-300"
                              onClick={() => handleDeleteClick(report)}
                            >
                              <TrashIcon className="h-3 w-3" />
                              削除
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* モバイルカード表示 */}
              <div className="md:hidden space-y-4">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                  >
                    {/* カードヘッダー */}
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-medium text-gray-900">
                          {new Date(report.date).toLocaleDateString('ja-JP')}
                        </div>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full mt-1 ${
                            report.is_worked
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {report.is_worked ? '作業日' : '非作業日'}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/reports/edit/${report.id}`}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-1"
                          >
                            <EditIcon className="h-3 w-3" />
                            編集
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:border-red-300"
                          onClick={() => handleDeleteClick(report)}
                        >
                          <TrashIcon className="h-3 w-3" />
                          削除
                        </Button>
                      </div>
                    </div>

                    {/* カードボディ */}
                    {report.is_worked && (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-gray-600">時間</div>
                          <div className="font-medium">
                            {report.start_time && report.end_time
                              ? `${report.start_time} - ${report.end_time}`
                              : '-'}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-600">距離</div>
                          <div className="font-medium">
                            {report.distance_km
                              ? `${report.distance_km}km`
                              : '-'}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-600">配送</div>
                          <div className="font-medium">
                            {report.deliveries ? `${report.deliveries}件` : '-'}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-600">高速料金</div>
                          <div className="font-medium">
                            {report.highway_fee
                              ? `¥${report.highway_fee.toLocaleString()}`
                              : '-'}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* メモ表示 */}
                    {report.notes && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="text-gray-600 text-xs mb-1">メモ</div>
                        <div className="text-sm text-gray-800 line-clamp-2">
                          {report.notes}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* ページネーション */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((prev) => prev - 1)}
                  >
                    前へ
                  </Button>

                  {/* ページ番号表示 */}
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, currentPage - 2) + i;
                      if (pageNum > totalPages) return null;

                      return (
                        <Button
                          key={pageNum}
                          variant={
                            pageNum === currentPage ? 'default' : 'outline'
                          }
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                  >
                    次へ
                  </Button>
                </div>
              )}
            </div>
          ) : (
            // カレンダー表示
            <CalendarView
              reports={reports}
              onDateClick={(date) => {
                // 日付クリック時の処理（将来的に詳細表示や編集画面に遷移）
                console.log('Clicked date:', date);
                // TODO: 詳細モーダル表示や編集画面遷移を実装
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* 使用方法のヘルプ */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-blue-800">
              📊 日報一覧の使い方
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-blue-700">
              <p>
                • <strong>テーブル表示</strong>
                ：日報を表形式で一覧表示、並び替えや検索が可能
              </p>
              <p>
                • <strong>カレンダー表示</strong>
                ：カレンダー形式で月単位の稼働状況を確認
              </p>
              <p>
                • <strong>フィルター機能</strong>：期間や作業状況で絞り込み表示
              </p>
              <p>
                • <strong>編集・削除</strong>：各日報の詳細から編集・削除が可能
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 削除確認ダイアログ */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        report={reportToDelete}
        onDeleteSuccess={handleDeleteSuccess}
        onDeleteError={handleDeleteError}
      />
    </div>
  );
}
