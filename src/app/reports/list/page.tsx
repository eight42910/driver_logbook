'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DeleteConfirmDialog } from '@/components/forms/DeleteConfirmDialog';
import {
  getDailyReports,
  deleteDailyReport,
} from '@/lib/supabase/queries/daily-reports';
import { DailyReport } from '@/types/database';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  Truck,
  Activity,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

// フィルター条件の型定義
interface FilterState {
  dateFrom: string;
  dateTo: string;
  workStatus: 'all' | 'worked' | 'not_worked';
  searchText: string;
}

// ページネーションの設定
const ITEMS_PER_PAGE = 10;

/**
 * 日報一覧ページ
 *
 * 機能：
 * - 日報一覧表示
 * - 検索・フィルタリング
 * - ページネーション
 * - 編集・削除機能
 * - ソート機能（日付順）
 */
export default function ReportsListPage() {
  const { user, loading } = useAuth();
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<DailyReport[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // フィルター状態
  const [filters, setFilters] = useState<FilterState>({
    dateFrom: '',
    dateTo: '',
    workStatus: 'all',
    searchText: '',
  });

  // データ読み込み
  useEffect(() => {
    if (user && !loading) {
      loadReports();
    }
  }, [user, loading]);

  // フィルタリング処理
  useEffect(() => {
    applyFilters();
  }, [reports, filters]);

  // 日報データの読み込み
  const loadReports = async () => {
    if (!user) return;

    try {
      setIsLoadingData(true);
      const data = await getDailyReports(user.id);
      setReports(data);
    } catch (error) {
      console.error('日報読み込みエラー:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  // フィルタリング適用
  const applyFilters = () => {
    let filtered = [...reports];

    // 日付範囲フィルター
    if (filters.dateFrom) {
      filtered = filtered.filter((report) => report.date >= filters.dateFrom);
    }
    if (filters.dateTo) {
      filtered = filtered.filter((report) => report.date <= filters.dateTo);
    }

    // 稼働状況フィルター
    if (filters.workStatus !== 'all') {
      const isWorked = filters.workStatus === 'worked';
      filtered = filtered.filter((report) => report.is_worked === isWorked);
    }

    // テキスト検索
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      filtered = filtered.filter(
        (report) =>
          report.route?.toLowerCase().includes(searchLower) ||
          report.notes?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredReports(filtered);
    setCurrentPage(1); // フィルター変更時は1ページ目に戻る
  };

  // フィルターリセット
  const resetFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      workStatus: 'all',
      searchText: '',
    });
  };

  // 削除処理
  const handleDelete = async (id: number) => {
    setIsDeleting(true);
    try {
      await deleteDailyReport(id);
      await loadReports(); // データを再読み込み
      setDeleteTargetId(null);
    } catch (error) {
      console.error('削除エラー:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // ページネーション計算
  const totalPages = Math.ceil(filteredReports.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentReports = filteredReports.slice(startIndex, endIndex);

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
            <h1 className="text-3xl font-bold text-gray-900">日報一覧</h1>
            <p className="mt-2 text-gray-600">
              過去の業務記録を確認・編集できます
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button asChild>
              <Link href="/reports">
                <Plus className="h-4 w-4 mr-2" />
                新しい日報
              </Link>
            </Button>
          </div>
        </div>

        {/* 検索・フィルター */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              検索・フィルター
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 日付範囲 */}
              <div className="space-y-2">
                <Label htmlFor="dateFrom">開始日</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      dateFrom: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateTo">終了日</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, dateTo: e.target.value }))
                  }
                />
              </div>

              {/* 稼働状況 */}
              <div className="space-y-2">
                <Label htmlFor="workStatus">稼働状況</Label>
                <select
                  id="workStatus"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filters.workStatus}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      workStatus: e.target.value as FilterState['workStatus'],
                    }))
                  }
                >
                  <option value="all">すべて</option>
                  <option value="worked">稼働日のみ</option>
                  <option value="not_worked">非稼働日のみ</option>
                </select>
              </div>

              {/* テキスト検索 */}
              <div className="space-y-2">
                <Label htmlFor="searchText">キーワード検索</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="searchText"
                    placeholder="ルート、備考で検索"
                    className="pl-10"
                    value={filters.searchText}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        searchText: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button variant="outline" onClick={resetFilters}>
                フィルターリセット
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 検索結果サマリー */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            全{filteredReports.length}件中 {startIndex + 1}-
            {Math.min(endIndex, filteredReports.length)}件を表示
          </div>
          <div>{totalPages > 1 && `${currentPage}/${totalPages}ページ`}</div>
        </div>

        {/* 日報一覧 */}
        {isLoadingData ? (
          <div className="text-center py-8">
            <Activity className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p className="text-gray-500">データを読み込み中...</p>
          </div>
        ) : currentReports.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filteredReports.length === 0 && reports.length > 0
                  ? '検索条件に一致する日報がありません'
                  : '日報がありません'}
              </h3>
              <p className="text-gray-500 mb-4">
                {filteredReports.length === 0 && reports.length > 0
                  ? '検索条件を変更してお試しください。'
                  : '最初の日報を作成して業務記録を開始しましょう。'}
              </p>
              {filteredReports.length === 0 && reports.length > 0 ? (
                <Button variant="outline" onClick={resetFilters}>
                  フィルターをリセット
                </Button>
              ) : (
                <Button asChild>
                  <Link href="/reports">
                    <Plus className="h-4 w-4 mr-2" />
                    新しい日報を作成
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {currentReports.map((report) => (
              <Card
                key={report.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      {/* ステータスアイコン */}
                      <div
                        className={`p-3 rounded-full ${
                          report.is_worked
                            ? 'bg-green-100 text-green-600'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {report.is_worked ? (
                          <Truck className="h-5 w-5" />
                        ) : (
                          <Clock className="h-5 w-5" />
                        )}
                      </div>

                      {/* 日報詳細 */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold">
                            {format(
                              new Date(report.date),
                              'yyyy年M月d日 (EEE)',
                              { locale: ja }
                            )}
                          </h3>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              report.is_worked
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {report.is_worked ? '稼働' : '非稼働'}
                          </span>
                        </div>

                        {report.is_worked && (
                          <div className="space-y-2 text-sm text-gray-600">
                            {/* 時間情報 */}
                            {report.start_time && report.end_time && (
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4" />
                                <span>
                                  {report.start_time} - {report.end_time}
                                </span>
                              </div>
                            )}

                            {/* 距離・配送件数 */}
                            <div className="flex items-center space-x-4">
                              {report.distance_km && (
                                <div className="flex items-center space-x-1">
                                  <MapPin className="h-4 w-4" />
                                  <span>{report.distance_km}km</span>
                                </div>
                              )}
                              {report.deliveries && (
                                <div className="flex items-center space-x-1">
                                  <Truck className="h-4 w-4" />
                                  <span>{report.deliveries}件</span>
                                </div>
                              )}
                            </div>

                            {/* ルート */}
                            {report.route && (
                              <div className="text-gray-700">
                                <strong>ルート:</strong> {report.route}
                              </div>
                            )}

                            {/* 備考 */}
                            {report.notes && (
                              <div className="text-gray-700">
                                <strong>備考:</strong> {report.notes}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* アクションボタン */}
                    <div className="flex items-center space-x-2 ml-4">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/reports/edit/${report.id}`}>
                          <Edit className="h-4 w-4 mr-1" />
                          編集
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteTargetId(report.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        削除
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* ページネーション */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              前へ
            </Button>

            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <Button
                    key={page}
                    variant={page === currentPage ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="w-10"
                  >
                    {page}
                  </Button>
                )
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
            >
              次へ
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* 削除確認ダイアログ */}
        <DeleteConfirmDialog
          isOpen={deleteTargetId !== null}
          onClose={() => setDeleteTargetId(null)}
          onConfirm={() => deleteTargetId && handleDelete(deleteTargetId)}
          isLoading={isDeleting}
          itemName="日報"
        />
      </div>
    </MainLayout>
  );
}
