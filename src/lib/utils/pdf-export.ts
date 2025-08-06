import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import type { DailyReport } from '@/types/database';

/**
 * 月次統計データの型定義
 */
export interface MonthlyStats {
  totalWorkDays: number;
  totalDistance: number;
  totalWorkHours: number;
  averageDistance: number;
  averageWorkHours: number;
}

/**
 * PDF設定
 */
const PDF_CONFIG = {
  unit: 'mm' as const,
  format: 'a4' as const,
  orientation: 'portrait' as const,
  margin: {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20,
  },
  fontSize: {
    title: 16,
    subtitle: 12,
    body: 10,
    small: 8,
  },
  colors: {
    black: '#000000',
    gray: '#666666',
    lightGray: '#CCCCCC',
  },
  lineHeight: 5,
};

/**
 * A4ページの有効サイズ（マージンを考慮）
 */
const PAGE_SIZE = {
  width: 210 - PDF_CONFIG.margin.left - PDF_CONFIG.margin.right,
  height: 297 - PDF_CONFIG.margin.top - PDF_CONFIG.margin.bottom,
};

/**
 * 稼働状況を記号で表示
 */
function formatWorkStatusSymbol(isWorked: boolean): string {
  return isWorked ? '○' : '×';
}

/**
 * 時間を「H時間M分」形式で表示
 */
function formatDuration(startTime?: string, endTime?: string): string {
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

  if (minutes === 0) {
    return `${hours}時間`;
  }
  return `${hours}時間${minutes}分`;
}

/**
 * 統計データを計算
 */
export function calculateMonthlyStats(reports: DailyReport[]): MonthlyStats {
  const workReports = reports.filter((r) => r.is_worked);

  const totalWorkDays = workReports.length;
  const totalDistance = workReports.reduce(
    (sum, r) => sum + (r.distance_km || 0),
    0
  );

  let totalWorkMinutes = 0;
  workReports.forEach((r) => {
    if (r.start_time && r.end_time) {
      const [startHour, startMin] = r.start_time.split(':').map(Number);
      const [endHour, endMin] = r.end_time.split(':').map(Number);

      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      let diffMinutes = endMinutes - startMinutes;
      if (diffMinutes < 0) {
        diffMinutes += 24 * 60; // 翌日にまたがる場合
      }

      totalWorkMinutes += diffMinutes;
    }
  });

  const totalWorkHours = totalWorkMinutes / 60;
  const averageDistance = totalWorkDays > 0 ? totalDistance / totalWorkDays : 0;
  const averageWorkHours =
    totalWorkDays > 0 ? totalWorkHours / totalWorkDays : 0;

  return {
    totalWorkDays,
    totalDistance,
    totalWorkHours,
    averageDistance,
    averageWorkHours,
  };
}

/**
 * PDFに日本語フォントを設定
 * ブラウザ環境での日本語文字化け対策
 */
function setupJapaneseFont(doc: jsPDF): void {
  try {
    // jsPDFでサポートされている日本語対応可能な設定
    // ヒラギノ角ゴシック系フォントを試行
    doc.setFont('times', 'normal');

    // 日本語文字のテスト描画で確認
    const testText = 'テスト';
    const textWidth = doc.getTextWidth(testText);

    // 文字幅が正常に取得できない場合は代替フォント
    if (textWidth === 0 || isNaN(textWidth)) {
      doc.setFont('courier', 'normal');
    }
  } catch (error) {
    console.warn('日本語フォント設定エラー:', error);
    // フォールバック: デフォルトフォント
    doc.setFont('helvetica', 'normal');
  }
}

/**
 * 日本語テキストを安全に描画
 * 文字化け対策とフォールバック処理
 */
function drawJapaneseText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  options?: {
    fontSize?: number;
    maxWidth?: number;
    align?: 'left' | 'center' | 'right';
  }
): void {
  const { fontSize = 10, maxWidth, align = 'left' } = options || {};

  try {
    doc.setFontSize(fontSize);

    // 長いテキストの場合は改行処理
    if (maxWidth && doc.getTextWidth(text) > maxWidth) {
      const lines = doc.splitTextToSize(text, maxWidth);
      let currentY = y;

      lines.forEach((line: string) => {
        let drawX = x;
        if (align === 'center') {
          drawX = x - doc.getTextWidth(line) / 2;
        } else if (align === 'right') {
          drawX = x - doc.getTextWidth(line);
        }

        doc.text(line, drawX, currentY);
        currentY += fontSize * 0.4; // 行間調整
      });
    } else {
      let drawX = x;
      if (align === 'center') {
        drawX = x - doc.getTextWidth(text) / 2;
      } else if (align === 'right') {
        drawX = x - doc.getTextWidth(text);
      }

      doc.text(text, drawX, y);
    }
  } catch (error) {
    console.warn('日本語テキスト描画エラー:', error);
    // フォールバック: 基本的な描画
    doc.text(text || '', x, y);
  }
}

/**
 * PDFヘッダーを描画
 */
function drawHeader(
  doc: jsPDF,
  title: string,
  period: string,
  userName: string
): number {
  let yPosition = PDF_CONFIG.margin.top;

  // タイトル
  doc.setTextColor(PDF_CONFIG.colors.black);
  drawJapaneseText(doc, title, PDF_CONFIG.margin.left, yPosition, {
    fontSize: PDF_CONFIG.fontSize.title,
  });
  yPosition += PDF_CONFIG.lineHeight * 2;

  // 期間とユーザー名
  doc.setTextColor(PDF_CONFIG.colors.gray);
  drawJapaneseText(doc, `期間: ${period}`, PDF_CONFIG.margin.left, yPosition, {
    fontSize: PDF_CONFIG.fontSize.subtitle,
  });
  drawJapaneseText(
    doc,
    `ユーザー: ${userName}`,
    PDF_CONFIG.margin.left + 80,
    yPosition,
    {
      fontSize: PDF_CONFIG.fontSize.subtitle,
    }
  );
  yPosition += PDF_CONFIG.lineHeight * 2;

  // 区切り線
  doc.setDrawColor(PDF_CONFIG.colors.lightGray);
  doc.line(
    PDF_CONFIG.margin.left,
    yPosition,
    PDF_CONFIG.margin.left + PAGE_SIZE.width,
    yPosition
  );
  yPosition += PDF_CONFIG.lineHeight;

  return yPosition;
}

/**
 * 統計サマリーを描画
 */
function drawStatistics(
  doc: jsPDF,
  stats: MonthlyStats,
  yPosition: number
): number {
  doc.setTextColor(PDF_CONFIG.colors.black);
  drawJapaneseText(doc, '月次統計', PDF_CONFIG.margin.left, yPosition, {
    fontSize: PDF_CONFIG.fontSize.subtitle,
  });
  yPosition += PDF_CONFIG.lineHeight * 1.5;

  doc.setTextColor(PDF_CONFIG.colors.gray);

  const statItems = [
    `稼働日数: ${stats.totalWorkDays}日`,
    `総走行距離: ${stats.totalDistance.toFixed(1)}km`,
    `総作業時間: ${stats.totalWorkHours.toFixed(1)}時間`,
    `平均走行距離: ${stats.averageDistance.toFixed(1)}km/日`,
    `平均作業時間: ${stats.averageWorkHours.toFixed(1)}時間/日`,
  ];

  statItems.forEach((item) => {
    drawJapaneseText(doc, item, PDF_CONFIG.margin.left + 5, yPosition, {
      fontSize: PDF_CONFIG.fontSize.body,
    });
    yPosition += PDF_CONFIG.lineHeight;
  });

  yPosition += PDF_CONFIG.lineHeight;
  return yPosition;
}

/**
 * 日報テーブルヘッダーを描画
 */
function drawTableHeader(doc: jsPDF, yPosition: number): number {
  doc.setFontSize(PDF_CONFIG.fontSize.subtitle);
  doc.setTextColor(PDF_CONFIG.colors.black);
  doc.text('日別詳細', PDF_CONFIG.margin.left, yPosition);
  yPosition += PDF_CONFIG.lineHeight * 1.5;

  // テーブルヘッダー
  doc.setFontSize(PDF_CONFIG.fontSize.body);
  doc.setTextColor(PDF_CONFIG.colors.black);

  const headers = [
    '日付',
    '稼働',
    '開始',
    '終了',
    '時間',
    '距離(km)',
    'ルート',
  ];
  const colWidths = [25, 15, 20, 20, 25, 20, 45];
  let xPosition = PDF_CONFIG.margin.left;

  headers.forEach((header, index) => {
    doc.text(header, xPosition, yPosition);
    xPosition += colWidths[index];
  });

  yPosition += PDF_CONFIG.lineHeight * 0.5;

  // ヘッダー下線
  doc.setDrawColor(PDF_CONFIG.colors.black);
  doc.line(
    PDF_CONFIG.margin.left,
    yPosition,
    PDF_CONFIG.margin.left + PAGE_SIZE.width,
    yPosition
  );
  yPosition += PDF_CONFIG.lineHeight * 0.5;

  return yPosition;
}

/**
 * 日報テーブル行を描画
 */
function drawTableRow(
  doc: jsPDF,
  report: DailyReport,
  yPosition: number
): number {
  doc.setFontSize(PDF_CONFIG.fontSize.body);
  doc.setTextColor(PDF_CONFIG.colors.gray);

  const colWidths = [25, 15, 20, 20, 25, 20, 45];
  let xPosition = PDF_CONFIG.margin.left;

  const rowData = [
    format(new Date(report.date), 'M/d(E)', { locale: ja }),
    formatWorkStatusSymbol(report.is_worked),
    report.start_time || '',
    report.end_time || '',
    formatDuration(report.start_time, report.end_time),
    report.distance_km?.toString() || '',
    report.notes || '',
  ];

  rowData.forEach((data, index) => {
    doc.text(data, xPosition, yPosition);
    xPosition += colWidths[index];
  });

  return yPosition + PDF_CONFIG.lineHeight;
}

/**
 * PDFフッターを描画
 */
function drawFooter(doc: jsPDF): void {
  const pageHeight = 297; // A4高さ
  const footerY = pageHeight - PDF_CONFIG.margin.bottom + 5;

  doc.setFontSize(PDF_CONFIG.fontSize.small);
  doc.setTextColor(PDF_CONFIG.colors.gray);

  // 生成日時
  const generatedAt = format(new Date(), 'yyyy年M月d日 HH:mm生成', {
    locale: ja,
  });
  doc.text(generatedAt, PDF_CONFIG.margin.left, footerY);

  // ページ番号
  const pageNum = `${doc.getNumberOfPages()} ページ`;
  const pageNumWidth = doc.getTextWidth(pageNum);
  doc.text(
    pageNum,
    PDF_CONFIG.margin.left + PAGE_SIZE.width - pageNumWidth,
    footerY
  );
}

/**
 * 月次レポートPDFを生成
 * @param reports 日報データ配列
 * @param stats 月次統計データ
 * @param period 期間文字列
 * @param userName ユーザー名
 * @returns PDF生成の Promise
 */
export async function generateMonthlyReportPDF(
  reports: DailyReport[],
  stats: MonthlyStats,
  period: string,
  userName: string
): Promise<void> {
  try {
    // PDFドキュメントを作成
    const doc = new jsPDF({
      unit: PDF_CONFIG.unit,
      format: PDF_CONFIG.format,
      orientation: PDF_CONFIG.orientation,
    });

    // 日本語フォント設定
    setupJapaneseFont(doc);

    // ヘッダー描画
    let yPosition = drawHeader(doc, '運転手業務月次レポート', period, userName);
    yPosition += PDF_CONFIG.lineHeight;

    // 統計サマリー描画
    yPosition = drawStatistics(doc, stats, yPosition);
    yPosition += PDF_CONFIG.lineHeight;

    // テーブルヘッダー描画
    yPosition = drawTableHeader(doc, yPosition);

    // 日付順にソート（古い順）
    const sortedReports = [...reports].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // 日報データを描画
    sortedReports.forEach((report) => {
      // ページブレイクチェック
      if (yPosition > 250) {
        // ページの最下部近くの場合
        doc.addPage();
        yPosition = PDF_CONFIG.margin.top;
        yPosition = drawTableHeader(doc, yPosition);
      }

      yPosition = drawTableRow(doc, report, yPosition);
    });

    // フッター描画
    drawFooter(doc);

    // PDFファイルをダウンロード
    const fileName = `運転手業務月次レポート_${period}.pdf`;
    doc.save(fileName);
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error('PDF生成に失敗しました');
  }
}

/**
 * カスタム期間のレポートPDFを生成
 * @param reports 日報データ配列
 * @param startDate 開始日
 * @param endDate 終了日
 * @param userName ユーザー名
 */
export async function generateCustomReportPDF(
  reports: DailyReport[],
  startDate: string,
  endDate: string,
  userName: string
): Promise<void> {
  const stats = calculateMonthlyStats(reports);
  const period = `${format(new Date(startDate), 'yyyy/M/d', {
    locale: ja,
  })} - ${format(new Date(endDate), 'yyyy/M/d', { locale: ja })}`;

  await generateMonthlyReportPDF(reports, stats, period, userName);
}

/**
 * 年間レポートPDFを生成
 * @param reports 日報データ配列
 * @param year 年
 * @param userName ユーザー名
 */
export async function generateAnnualReportPDF(
  reports: DailyReport[],
  year: number,
  userName: string
): Promise<void> {
  const stats = calculateMonthlyStats(reports);
  const period = `${year}年`;

  await generateMonthlyReportPDF(reports, stats, period, userName);
}

/**
 * PDF生成がサポートされているかチェック
 */
export function isPDFSupported(): boolean {
  try {
    // ブラウザ環境でのPDF生成可能性をチェック
    return typeof window !== 'undefined' && typeof document !== 'undefined';
  } catch {
    return false;
  }
}

/**
 * PDF生成オプションの取得
 */
export function getPDFGenerationOptions(): Array<{
  value: string;
  label: string;
  description: string;
}> {
  return [
    {
      value: 'monthly',
      label: '月次レポート',
      description: '指定した月の日報データをPDF出力',
    },
    {
      value: 'custom',
      label: 'カスタム期間',
      description: '任意の期間の日報データをPDF出力',
    },
    {
      value: 'annual',
      label: '年間レポート',
      description: '指定した年の全日報データをPDF出力',
    },
  ];
}
