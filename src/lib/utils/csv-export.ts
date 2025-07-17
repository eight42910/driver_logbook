import Papa from 'papaparse';
import { format as formatDate } from 'date-fns';
import { ja } from 'date-fns/locale';
import type { DailyReport } from '@/types/database';

/**
 * CSV エクスポート形式の種類
 */
export type CSVExportFormat = 'basic' | 'detailed' | 'accounting';

/**
 * 基本形式のCSVヘッダー
 */
const BASIC_HEADERS = [
  '日付',
  '稼働',
  '開始時刻',
  '終了時刻',
  'ルート',
  '距離(km)',
  '配送件数',
  '高速代',
  '備考',
];

/**
 * 詳細形式のCSVヘッダー
 */
const DETAILED_HEADERS = [
  '日付',
  '稼働状況',
  '開始時刻',
  '終了時刻',
  '作業時間',
  '走行距離(km)',
  '配送件数',
  '高速代',
  '備考',
  '作成日',
  '更新日',
];

/**
 * 経理用形式のCSVヘッダー
 */
const ACCOUNTING_HEADERS = [
  '作業日',
  '稼働フラグ',
  '開始',
  '終了',
  '時間',
  '距離',
  '配送件数',
  '高速代',
  'メモ',
];

/**
 * 稼働状況を日本語で表示
 */
function formatWorkStatus(isWorked: boolean): string {
  return isWorked ? '○' : '×';
}

/**
 * 稼働状況を詳細表示
 */
function formatWorkStatusDetailed(isWorked: boolean): string {
  return isWorked ? '稼働' : '休日';
}

/**
 * 作業時間を計算して表示
 */
function calculateWorkTime(startTime?: string, endTime?: string): string {
  if (!startTime || !endTime) return '';

  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  let diffMinutes = endMinutes - startMinutes;
  if (diffMinutes < 0) {
    diffMinutes += 24 * 60; // 翌日にまたがる場合
  }

  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  return `${hours}時間${minutes}分`;
}

/**
 * 作業時間を小数点形式で表示（経理用）
 */
function calculateWorkTimeDecimal(
  startTime?: string,
  endTime?: string
): string {
  if (!startTime || !endTime) return '0.0';

  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  let diffMinutes = endMinutes - startMinutes;
  if (diffMinutes < 0) {
    diffMinutes += 24 * 60; // 翌日にまたがる場合
  }

  return (diffMinutes / 60).toFixed(1);
}

/**
 * 基本形式のデータ行を生成
 */
function formatBasicRow(report: DailyReport): string[] {
  return [
    report.date,
    formatWorkStatus(report.is_worked),
    report.start_time || '',
    report.end_time || '',
    report.distance_km?.toString() || '',
    report.deliveries?.toString() || '',
    report.highway_fee?.toString() || '',
    report.notes || '',
  ];
}

/**
 * 詳細形式のデータ行を生成
 */
function formatDetailedRow(report: DailyReport): string[] {
  return [
    report.date,
    formatWorkStatusDetailed(report.is_worked),
    report.start_time || '',
    report.end_time || '',
    calculateWorkTime(report.start_time, report.end_time),
    report.distance_km?.toString() || '',
    report.deliveries?.toString() || '',
    report.highway_fee?.toString() || '',
    report.notes || '',
    formatDate(new Date(report.created_at), 'yyyy-MM-dd HH:mm', { locale: ja }),
    formatDate(new Date(report.updated_at), 'yyyy-MM-dd HH:mm', { locale: ja }),
  ];
}

/**
 * 経理用形式のデータ行を生成
 */
function formatAccountingRow(report: DailyReport): string[] {
  return [
    formatDate(new Date(report.date), 'yyyy/MM/dd'),
    report.is_worked ? '1' : '0',
    report.start_time || '',
    report.end_time || '',
    calculateWorkTimeDecimal(report.start_time, report.end_time),
    report.distance_km?.toString() || '',
    report.deliveries?.toString() || '',
    report.highway_fee?.toString() || '',
    report.notes || '',
  ];
}

/**
 * 日報データをCSV形式に変換
 * @param reports 日報データ配列
 * @param format エクスポート形式
 * @returns CSV文字列
 */
export function generateCSV(
  reports: DailyReport[],
  format: CSVExportFormat = 'basic'
): string {
  let headers: string[];
  let rows: string[][];

  // 日付順にソート（古い順）
  const sortedReports = [...reports].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  switch (format) {
    case 'basic':
      headers = BASIC_HEADERS;
      rows = sortedReports.map(formatBasicRow);
      break;
    case 'detailed':
      headers = DETAILED_HEADERS;
      rows = sortedReports.map(formatDetailedRow);
      break;
    case 'accounting':
      headers = ACCOUNTING_HEADERS;
      rows = sortedReports.map(formatAccountingRow);
      break;
    default:
      throw new Error(`Unsupported format: ${format}`);
  }

  // CSVデータを生成
  const csvData = [headers, ...rows];

  // PapaParseを使用してCSV文字列を生成
  const csv = Papa.unparse(csvData, {
    header: false,
    delimiter: ',',
    newline: '\r\n',
    quoteChar: '"',
    escapeChar: '"',
  });

  // UTF-8 BOM を追加（Excelでの文字化け防止）
  const BOM = '\uFEFF';
  return BOM + csv;
}

/**
 * CSVファイルをダウンロード
 * @param reports 日報データ配列
 * @param format エクスポート形式
 * @param fileName ファイル名（省略時は自動生成）
 */
export function downloadCSV(
  reports: DailyReport[],
  format: CSVExportFormat = 'basic',
  fileName?: string
): void {
  try {
    const csv = generateCSV(reports, format);

    // ファイル名の生成
    let finalFileName = fileName;
    if (!finalFileName) {
      const now = new Date();
      const dateStr = formatDate(now, 'yyyy-MM-dd');
      const formatSuffix =
        format === 'basic' ? '基本' : format === 'detailed' ? '詳細' : '経理用';
      finalFileName = `日報_${formatSuffix}_${dateStr}.csv`;
    }

    // Blobを作成してダウンロード
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', finalFileName);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // メモリリークを防ぐためURLを開放
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('CSV export error:', error);
    throw new Error('CSVエクスポートに失敗しました');
  }
}

/**
 * 月次CSVファイルをダウンロード
 * @param reports 日報データ配列
 * @param year 年
 * @param month 月
 * @param format エクスポート形式
 */
export function downloadMonthlyCSV(
  reports: DailyReport[],
  year: number,
  month: number,
  format: CSVExportFormat = 'basic'
): void {
  const formatSuffix =
    format === 'basic' ? '基本' : format === 'detailed' ? '詳細' : '経理用';
  const fileName = `日報_${year}年${month
    .toString()
    .padStart(2, '0')}月_${formatSuffix}.csv`;

  downloadCSV(reports, format, fileName);
}

/**
 * エクスポート形式の表示名を取得
 */
export function getFormatDisplayName(format: CSVExportFormat): string {
  switch (format) {
    case 'basic':
      return '基本形式';
    case 'detailed':
      return '詳細形式';
    case 'accounting':
      return '経理用形式';
    default:
      return '不明な形式';
  }
}

/**
 * エクスポート可能な形式の一覧を取得
 */
export function getAvailableFormats(): Array<{
  value: CSVExportFormat;
  label: string;
  description: string;
}> {
  return [
    {
      value: 'basic',
      label: '基本形式',
      description: '日付、稼働状況、時間、ルート、距離、備考',
    },
    {
      value: 'detailed',
      label: '詳細形式',
      description: '基本情報 + 作業時間計算 + 作成・更新日時',
    },
    {
      value: 'accounting',
      label: '経理用形式',
      description: '会計ソフト向けの数値形式（稼働フラグ、時間を小数点表示）',
    },
  ];
}
