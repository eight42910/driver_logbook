'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TrashIcon } from 'lucide-react';
import { deleteDailyReport } from '@/lib/supabase/queries/daily-reports';
import type { DailyReport } from '@/types/database';

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: DailyReport | null;
  onDeleteSuccess: (reportId: number) => void;
  onDeleteError: (error: string) => void;
}

/**
 * 削除確認ダイアログ
 *
 * 機能：
 * - 削除確認とキャンセル
 * - 楽観的削除（即座にUIから削除）
 * - エラー時の復元処理
 */
export function DeleteConfirmDialog({
  open,
  onOpenChange,
  report,
  onDeleteSuccess,
  onDeleteError,
}: DeleteConfirmDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!report) return;

    setIsDeleting(true);

    try {
      // Supabaseで削除実行
      await deleteDailyReport(report.id);

      // 成功時のコールバック実行
      onDeleteSuccess(report.id);

      // ダイアログを閉じる
      onOpenChange(false);
    } catch (error) {
      console.error('削除エラー:', error);
      const errorMessage =
        error instanceof Error ? error.message : '削除に失敗しました';
      onDeleteError(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    if (!isDeleting) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <TrashIcon className="h-5 w-5" />
            日報の削除
          </DialogTitle>
          <DialogDescription>
            {report && (
              <>
                <span className="font-medium">
                  {new Date(report.date).toLocaleDateString('ja-JP')}
                </span>
                の日報を削除しますか？
                <br />
                <span className="text-red-600 font-medium">
                  この操作は取り消せません。
                </span>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* 日報詳細表示 */}
        {report && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">稼働状況</span>
              <span
                className={`text-sm px-2 py-1 rounded-full ${
                  report.is_worked
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {report.is_worked ? '作業日' : '非作業日'}
              </span>
            </div>

            {report.is_worked && (
              <>
                {report.start_time && report.end_time && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">時間</span>
                    <span className="text-sm">
                      {report.start_time} - {report.end_time}
                    </span>
                  </div>
                )}

                {report.distance_km && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">距離</span>
                    <span className="text-sm">{report.distance_km}km</span>
                  </div>
                )}

                {report.deliveries && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">配送</span>
                    <span className="text-sm">{report.deliveries}件</span>
                  </div>
                )}

                {report.highway_fee && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">高速料金</span>
                    <span className="text-sm">
                      ¥{report.highway_fee.toLocaleString()}
                    </span>
                  </div>
                )}
              </>
            )}

            {report.notes && (
              <div>
                <span className="text-sm text-gray-600">メモ</span>
                <p className="text-sm mt-1 whitespace-pre-wrap">
                  {report.notes}
                </p>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isDeleting}
          >
            キャンセル
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                削除中...
              </>
            ) : (
              <>
                <TrashIcon className="h-4 w-4" />
                削除する
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
