'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { updateDailyReport } from '@/lib/supabase/queries/daily-reports';
import type { DailyReport } from '@/types/database';
import {
  DailyReportFormData as DailyReportFormType,
  dailyReportSchema,
  calculateDistance,
  CreateDailyReportData,
} from '@/lib/validations/daily-report';

interface DailyReportEditFormProps {
  report: DailyReport;
}

/**
 * 日報編集フォーム
 *
 * 機能：
 * - 既存日報データの編集
 * - 稼働チェック（Switch）
 * - 時間入力（開始・終了）+ 現在時刻ボタン
 * - メーター入力（開始・終了）+ 距離自動計算
 * - 配送件数・高速料金入力
 * - react-hook-form + zodバリデーション
 */
export function DailyReportEditForm({ report }: DailyReportEditFormProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  const form = useForm<DailyReportFormType>({
    resolver: zodResolver(dailyReportSchema),
    defaultValues: {
      date: report.date,
      is_worked: report.is_worked,
      start_time: report.start_time || '',
      end_time: report.end_time || '',
      start_odometer: report.start_odometer || undefined,
      end_odometer: report.end_odometer || undefined,
      deliveries: report.deliveries || undefined,
      highway_fee: report.highway_fee || undefined,
      notes: report.notes || '',
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = form;

  const isWorked = watch('is_worked');
  const startOdometer = watch('start_odometer');
  const endOdometer = watch('end_odometer');

  // 距離自動計算（メーター一周も考慮）
  const calculatedDistance = calculateDistance(startOdometer, endOdometer);

  // 現在時刻設定
  const setCurrentTime = (field: 'start_time' | 'end_time') => {
    const now = new Date();
    const timeString = now.toTimeString().slice(0, 5);
    setValue(field, timeString);
  };

  // カウントダウンタイマー
  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      router.push('/reports/list');
    }
  }, [countdown, router]);

  // 一覧に戻る関数
  const goToList = () => {
    router.push('/reports/list');
  };

  // フォーム送信
  const onSubmit = async (data: DailyReportFormType) => {
    if (!user) {
      setSubmitError('ユーザーが認証されていません。ログインしてください。');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      // 更新データを準備
      const updateData: Partial<CreateDailyReportData> = {
        date: data.date,
        is_worked: data.is_worked,
        start_time: data.start_time,
        end_time: data.end_time,
        start_odometer: data.start_odometer,
        end_odometer: data.end_odometer,
        deliveries: data.deliveries,
        highway_fee: data.highway_fee,
        notes: data.notes,
      };

      // Supabaseで日報を更新
      const updatedReport = await updateDailyReport(report.id, updateData);

      console.log('更新された日報:', updatedReport);

      // 成功状態を表示
      setSubmitSuccess(true);

      // 5秒後に一覧ページにリダイレクト
      setCountdown(5);
    } catch (error) {
      console.error('更新エラー:', error);
      const errorMessage =
        error instanceof Error ? error.message : '不明なエラーが発生しました';
      setSubmitError(`更新に失敗しました: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          日報編集 - {new Date(report.date).toLocaleDateString('ja-JP')}
        </CardTitle>
      </CardHeader>

      <CardContent>
        {/* 成功メッセージ */}
        {submitSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
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
                    ✅ 日報を更新しました！
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    変更内容が保存されました。
                    {countdown && (
                      <span className="font-medium ml-1">
                        ({countdown}秒後に一覧に戻ります)
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <Button
                onClick={goToList}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                一覧に戻る
              </Button>
            </div>
          </div>
        )}

        {/* エラーメッセージ */}
        {submitError && (
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
                <p className="text-sm font-medium text-red-800">
                  {submitError}
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* 日付 */}
          <div className="space-y-2">
            <Label htmlFor="date">日付</Label>
            <Input
              id="date"
              type="date"
              {...register('date')}
              className="w-full"
            />
            {errors.date && (
              <p className="text-sm text-red-500">{errors.date.message}</p>
            )}
          </div>

          {/* 稼働チェック */}
          <div className="flex items-center space-x-3">
            <input
              id="is_worked"
              type="checkbox"
              {...register('is_worked')}
              className="h-4 w-4 rounded"
            />
            <Label htmlFor="is_worked" className="text-base font-medium">
              この日は稼働日ですか？
            </Label>
          </div>

          {/* 稼働日の場合の詳細入力 */}
          {isWorked && (
            <div className="space-y-6 border-t pt-6">
              {/* 時間入力 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_time">開始時間</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="start_time"
                      type="time"
                      {...register('start_time')}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentTime('start_time')}
                    >
                      現在
                    </Button>
                  </div>
                  {errors.start_time && (
                    <p className="text-sm text-red-500">
                      {errors.start_time.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_time">終了時間</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="end_time"
                      type="time"
                      {...register('end_time')}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentTime('end_time')}
                    >
                      現在
                    </Button>
                  </div>
                  {errors.end_time && (
                    <p className="text-sm text-red-500">
                      {errors.end_time.message}
                    </p>
                  )}
                </div>
              </div>

              {/* メーター入力 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_odometer">開始メーター（km）</Label>
                  <Input
                    id="start_odometer"
                    type="number"
                    step="0.1"
                    {...register('start_odometer', { valueAsNumber: true })}
                    className="w-full"
                  />
                  {errors.start_odometer && (
                    <p className="text-sm text-red-500">
                      {errors.start_odometer.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_odometer">終了メーター（km）</Label>
                  <Input
                    id="end_odometer"
                    type="number"
                    step="0.1"
                    {...register('end_odometer', { valueAsNumber: true })}
                    className="w-full"
                  />
                  {errors.end_odometer && (
                    <p className="text-sm text-red-500">
                      {errors.end_odometer.message}
                    </p>
                  )}
                </div>
              </div>

              {/* 距離表示 */}
              {calculatedDistance !== null && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <svg
                      className="h-5 w-5 text-blue-400 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-blue-800 font-medium">
                      走行距離: {calculatedDistance.toFixed(1)}km
                    </span>
                  </div>
                </div>
              )}

              {/* 配送件数・高速料金 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deliveries">配送件数</Label>
                  <Input
                    id="deliveries"
                    type="number"
                    min="0"
                    {...register('deliveries', { valueAsNumber: true })}
                    className="w-full"
                  />
                  {errors.deliveries && (
                    <p className="text-sm text-red-500">
                      {errors.deliveries.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="highway_fee">高速料金（円）</Label>
                  <Input
                    id="highway_fee"
                    type="number"
                    min="0"
                    {...register('highway_fee', { valueAsNumber: true })}
                    className="w-full"
                  />
                  {errors.highway_fee && (
                    <p className="text-sm text-red-500">
                      {errors.highway_fee.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 備考 */}
          <div className="space-y-2">
            <Label htmlFor="notes">備考・メモ</Label>
            <textarea
              id="notes"
              {...register('notes')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="その他のメモや特記事項があれば記入してください..."
            />
            {errors.notes && (
              <p className="text-sm text-red-500">{errors.notes.message}</p>
            )}
          </div>

          {/* 送信ボタン */}
          <div className="flex space-x-4">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  更新中...
                </>
              ) : (
                '日報を更新'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={goToList}
              disabled={isSubmitting}
            >
              キャンセル
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
