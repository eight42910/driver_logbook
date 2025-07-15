'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeftIcon } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getDailyReportById } from '@/lib/supabase/queries/daily-reports';
import { DailyReportEditForm } from '@/components/forms/DailyReportEditForm';
import type { DailyReport } from '@/types/database';

/**
 * 日報編集ページ
 *
 * 機能：
 * - IDで指定された日報の編集
 * - 自分の日報のみ編集可能
 * - 存在しない場合は404エラー表示
 */
export default function EditDailyReportPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [report, setReport] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reportId = parseInt(params.id as string);

  // 認証チェック
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // 日報データ取得
  useEffect(() => {
    const fetchReport = async () => {
      if (!user?.id || isNaN(reportId)) {
        setError('無効なパラメータです');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const fetchedReport = await getDailyReportById(reportId, user.id);

        if (!fetchedReport) {
          setError('指定された日報が見つかりません');
        } else {
          setReport(fetchedReport);
        }
      } catch (err) {
        console.error('日報取得エラー:', err);
        setError('日報の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    if (user?.id && !isNaN(reportId)) {
      fetchReport();
    }
  }, [user?.id, reportId]);

  // 認証中の場合
  if (authLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">認証情報を確認しています...</p>
        </div>
      </div>
    );
  }

  // 認証されていない場合
  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* ページヘッダー */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/reports/list">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            一覧に戻る
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">日報編集</h1>
          <p className="text-gray-600">
            {report &&
              `${new Date(report.date).toLocaleDateString(
                'ja-JP'
              )}の日報を編集`}
          </p>
        </div>
      </div>

      {/* コンテンツ */}
      <div className="max-w-4xl mx-auto">
        {loading ? (
          // ローディング状態
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">日報データを読み込んでいます...</p>
              </div>
            </CardContent>
          </Card>
        ) : error ? (
          // エラー状態
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">エラー</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">{error}</p>
              <div className="flex gap-4">
                <Link href="/reports/list">
                  <Button variant="outline">一覧に戻る</Button>
                </Link>
                <Button onClick={() => window.location.reload()}>
                  再読み込み
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : report ? (
          // 編集フォーム
          <DailyReportEditForm report={report} />
        ) : null}
      </div>
    </div>
  );
}
