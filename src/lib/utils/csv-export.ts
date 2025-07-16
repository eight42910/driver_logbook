import Papa from 'papaparse';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

export interface MonthlyStats {
  workingDays: number;
  totalDistance: number;
  totalExpenses: number;
  averageDistancePerDay: number;
  reports: Array<{
    id: number;
    date: string;
    is_worked: boolean;
    start_time?: string | null;
    end_time?: string | null;
    notes?: string | null;
    // 将来の拡張用フィールド
    distance?: number;
    expenses?: number;
  }>;
  year: number;
  month: number;
}

/**
 * 文字列をBOM付きUTF-8でエンコードしてダウンロード
 */
function downloadCSV(content: string, filename: string): void {
  // BOM付きUTF-8でエンコード（Excel対応）
  const bom = '\uFEFF';
  const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' });

  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/**
 * 月次統計CSVエクスポート
 */
export function exportMonthlyReportCSV(monthlyStats: MonthlyStats): void {
  const data = [
    ['項目', '値'],
    ['対象年月', `${monthlyStats.year}年${monthlyStats.month}月`],
    ['勤務日数', `${monthlyStats.workingDays}日`],
    ['総走行距離', `${monthlyStats.totalDistance}km`],
    ['総支出', `¥${monthlyStats.totalExpenses.toLocaleString()}`],
    ['1日平均走行距離', `${Math.round(monthlyStats.averageDistancePerDay)}km`],
  ];

  const csv = Papa.unparse(data, {
    header: false,
  });

  const filename = `月次統計_${monthlyStats.year}年${monthlyStats.month}月.csv`;
  downloadCSV(csv, filename);
}

/**
 * 日次詳細CSVエクスポート
 */
export function exportDailyDetailsCSV(
  reports: MonthlyStats['reports'],
  year: number,
  month: number
): void {
  const headers = [
    '日付',
    '曜日',
    '勤務状態',
    '開始時刻',
    '終了時刻',
    '走行距離(km)',
    '支出(円)',
    '備考',
  ];

  const data = reports.map((report) => {
    const date = new Date(report.date);
    return [
      format(date, 'yyyy/MM/dd'),
      format(date, 'E', { locale: ja }),
      report.is_worked ? '勤務' : '休み',
      report.start_time || '',
      report.end_time || '',
      (report as unknown as { distance?: number }).distance || '',
      (report as unknown as { expenses?: number }).expenses || '',
      report.notes || '',
    ];
  });

  const csv = Papa.unparse(
    {
      fields: headers,
      data: data,
    },
    {
      header: true,
    }
  );

  const filename = `日次詳細_${year}年${month}月.csv`;
  downloadCSV(csv, filename);
}

/**
 * 年次比較用CSVエクスポート
 */
export function exportYearlyComparisonCSV(
  monthlyDataList: MonthlyStats[]
): void {
  const headers = [
    '年月',
    '勤務日数',
    '総走行距離(km)',
    '総支出(円)',
    '1日平均走行距離(km)',
  ];

  const data = monthlyDataList.map((monthlyStats) => [
    `${monthlyStats.year}年${monthlyStats.month}月`,
    monthlyStats.workingDays,
    monthlyStats.totalDistance,
    monthlyStats.totalExpenses,
    Math.round(monthlyStats.averageDistancePerDay),
  ]);

  const csv = Papa.unparse(
    {
      fields: headers,
      data: data,
    },
    {
      header: true,
    }
  );

  const filename = `年次比較_${new Date().getFullYear()}.csv`;
  downloadCSV(csv, filename);
}

/**
 * カスタムデータのCSVエクスポート（汎用）
 */
export function exportCustomCSV(
  data: Array<Record<string, unknown>>,
  filename: string,
  headers?: string[]
): void {
  let csv: string;

  if (headers) {
    csv = Papa.unparse({
      fields: headers,
      data: data,
    });
  } else {
    csv = Papa.unparse(data, {
      header: true,
    });
  }

  downloadCSV(csv, `${filename}.csv`);
}

/**
 * 勤務実績サマリーCSVエクスポート
 */
export function exportWorkSummaryCSV(
  reports: MonthlyStats['reports'],
  year: number,
  month: number
): void {
  // 勤務日のみ抽出
  const workingReports = reports.filter((report) => report.is_worked);

  // 週別集計
  const weeklyData: Record<
    string,
    {
      week: string;
      workingDays: number;
      totalDistance: number;
      totalExpenses: number;
    }
  > = {};

  workingReports.forEach((report) => {
    const date = new Date(report.date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay()); // 週の開始（日曜日）
    const weekKey = format(weekStart, 'yyyy-MM-dd');

    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = {
        week: `${format(weekStart, 'M/d')}週`,
        workingDays: 0,
        totalDistance: 0,
        totalExpenses: 0,
      };
    }

    weeklyData[weekKey].workingDays++;
    weeklyData[weekKey].totalDistance +=
      (report as unknown as { distance?: number }).distance || 0;
    weeklyData[weekKey].totalExpenses +=
      (report as unknown as { expenses?: number }).expenses || 0;
  });

  const headers = ['週', '勤務日数', '走行距離(km)', '支出(円)'];

  const data = Object.values(weeklyData).map((week) => [
    week.week,
    week.workingDays,
    week.totalDistance,
    week.totalExpenses,
  ]);

  const csv = Papa.unparse(
    {
      fields: headers,
      data: data,
    },
    {
      header: true,
    }
  );

  const filename = `週別サマリー_${year}年${month}月.csv`;
  downloadCSV(csv, filename);
}
