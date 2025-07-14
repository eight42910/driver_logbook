'use client';

import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DailyReport } from '@/types/database';

interface CalendarViewProps {
  reports: DailyReport[];
  onDateClick?: (date: string) => void;
}

export function CalendarView({ reports, onDateClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // 現在の年月を取得
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // 月の最初の日と最後の日を計算
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const firstDayOfWeek = firstDayOfMonth.getDay(); // 0 = 日曜日

  // カレンダーに表示する日付を生成
  const calendarDays: (Date | null)[] = [];

  // 前月の末尾日付を追加（空白埋め）
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(null);
  }

  // 現在月の日付を追加
  for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
    calendarDays.push(new Date(year, month, day));
  }

  // 日報データをマップ化（高速検索用）
  const reportsByDate = new Map<string, DailyReport>();
  reports.forEach((report) => {
    reportsByDate.set(report.date, report);
  });

  // 月を移動する関数
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // 日付をYYYY-MM-DD形式に変換
  const formatDateForComparison = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // 今日の日付
  const today = new Date();
  const todayString = formatDateForComparison(today);

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* カレンダーヘッダー */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 sm:gap-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            {year}年{month + 1}月
          </h2>
          <Button variant="outline" size="sm" onClick={goToToday}>
            今日
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousMonth}
            className="p-2"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextMonth}
            className="p-2"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['日', '月', '火', '水', '木', '金', '土'].map((day) => (
          <div
            key={day}
            className="p-3 text-center text-sm font-medium text-gray-600 bg-gray-50 rounded-md"
          >
            {day}
          </div>
        ))}
      </div>

      {/* カレンダーグリッド */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, index) => {
          if (!date) {
            // 空白セル
            return (
              <div
                key={`empty-${index}`}
                className="h-16 sm:h-20 md:h-24 bg-gray-50 rounded-md"
              />
            );
          }

          const dateString = formatDateForComparison(date);
          const report = reportsByDate.get(dateString);
          const isToday = dateString === todayString;
          const hasReport = !!report;

          return (
            <div
              key={dateString}
              className={`h-16 sm:h-20 md:h-24 p-1 sm:p-2 border border-gray-200 rounded-md cursor-pointer transition-colors hover:bg-gray-50 relative ${
                isToday ? 'bg-blue-50 border-blue-300' : 'bg-white'
              }`}
              onClick={() => onDateClick?.(dateString)}
            >
              {/* 日付表示 */}
              <div
                className={`text-xs sm:text-sm font-medium mb-0.5 sm:mb-1 ${
                  isToday ? 'text-blue-600' : 'text-gray-900'
                }`}
              >
                {date.getDate()}
              </div>

              {/* 日報データ表示 */}
              {hasReport && (
                <div className="space-y-0.5 sm:space-y-1">
                  {/* 稼働状況インジケーター */}
                  <div
                    className={`w-full h-0.5 sm:h-1 rounded-full ${
                      report.is_worked ? 'bg-green-400' : 'bg-gray-300'
                    }`}
                  />

                  {/* 詳細情報（デスクトップのみ表示） */}
                  {report.is_worked && (
                    <div className="hidden sm:block space-y-0.5">
                      {report.distance_km && (
                        <div className="text-xs text-gray-600 truncate">
                          {report.distance_km}km
                        </div>
                      )}
                      {report.deliveries && (
                        <div className="text-xs text-gray-600 truncate">
                          配送{report.deliveries}件
                        </div>
                      )}
                    </div>
                  )}

                  {/* モバイル用簡潔表示 */}
                  {report.is_worked && (
                    <div className="sm:hidden">
                      <div className="w-1 h-1 bg-green-600 rounded-full mx-auto" />
                    </div>
                  )}
                </div>
              )}

              {/* 今日マーカー */}
              {isToday && (
                <div className="absolute top-0.5 sm:top-1 right-0.5 sm:right-1">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-600 rounded-full" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 凡例 */}
      <div className="mt-6 flex flex-wrap gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-green-400 rounded-full" />
          <span>作業日</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-gray-300 rounded-full" />
          <span>非作業日</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-600 rounded-full" />
          <span>今日</span>
        </div>
      </div>

      {/* 統計情報 */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-900 mb-2">
          {year}年{month + 1}月の統計
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-gray-600">総日数</div>
            <div className="font-medium">{reports.length}日</div>
          </div>
          <div>
            <div className="text-gray-600">作業日</div>
            <div className="font-medium">
              {reports.filter((r) => r.is_worked).length}日
            </div>
          </div>
          <div>
            <div className="text-gray-600">総距離</div>
            <div className="font-medium">
              {reports.reduce((sum, r) => sum + (r.distance_km || 0), 0)}km
            </div>
          </div>
          <div>
            <div className="text-gray-600">総配送</div>
            <div className="font-medium">
              {reports.reduce((sum, r) => sum + (r.deliveries || 0), 0)}件
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
