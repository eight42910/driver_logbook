import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

// 日本語フォントをサポートするためのjsPDF設定
// 実際のプロジェクトでは適切な日本語フォントファイルを追加する必要があります

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
 * 月次レポートをPDFとして出力
 */
export async function exportMonthlyReportPDF(
  monthlyStats: MonthlyStats
): Promise<void> {
  try {
    const doc = new jsPDF();

    // PDFのタイトル
    const title = `${monthlyStats.year}年${monthlyStats.month}月 勤務報告書`;

    // フォントサイズとページ設定
    doc.setFontSize(16);
    doc.text(title, 20, 20);

    // 統計情報
    doc.setFontSize(12);
    let yPosition = 40;

    doc.text('■ 月次統計', 20, yPosition);
    yPosition += 10;

    doc.text(`勤務日数: ${monthlyStats.workingDays}日`, 30, yPosition);
    yPosition += 7;

    doc.text(
      `総走行距離: ${monthlyStats.totalDistance.toLocaleString()}km`,
      30,
      yPosition
    );
    yPosition += 7;

    doc.text(
      `総支出: ¥${monthlyStats.totalExpenses.toLocaleString()}`,
      30,
      yPosition
    );
    yPosition += 7;

    doc.text(
      `1日平均走行距離: ${Math.round(monthlyStats.averageDistancePerDay)}km`,
      30,
      yPosition
    );
    yPosition += 15;

    // 日次レポート一覧
    doc.text('■ 日次勤務記録', 20, yPosition);
    yPosition += 10;

    // テーブルヘッダー
    doc.setFontSize(10);
    doc.text('日付', 20, yPosition);
    doc.text('勤務', 50, yPosition);
    doc.text('開始', 70, yPosition);
    doc.text('終了', 90, yPosition);
    doc.text('距離', 110, yPosition);
    doc.text('支出', 130, yPosition);
    doc.text('備考', 150, yPosition);
    yPosition += 7;

    // 線を引く
    doc.line(20, yPosition - 2, 190, yPosition - 2);

    // データ行
    monthlyStats.reports.forEach((report) => {
      if (yPosition > 260) {
        doc.addPage();
        yPosition = 20;
      }

      const dateStr = format(new Date(report.date), 'M/d(E)', { locale: ja });
      const workStatus = report.is_worked ? '勤務' : '休み';
      const startTime = report.start_time || '-';
      const endTime = report.end_time || '-';
      const extendedReport = report as unknown as {
        distance?: number;
        expenses?: number;
      };
      const distance = extendedReport.distance
        ? `${extendedReport.distance}km`
        : '-';
      const expenses = extendedReport.expenses
        ? `¥${extendedReport.expenses.toLocaleString()}`
        : '-';
      const notes = report.notes || '-';

      doc.text(dateStr, 20, yPosition);
      doc.text(workStatus, 50, yPosition);
      doc.text(startTime, 70, yPosition);
      doc.text(endTime, 90, yPosition);
      doc.text(distance, 110, yPosition);
      doc.text(expenses, 130, yPosition);
      doc.text(
        notes.length > 20 ? notes.substring(0, 20) + '...' : notes,
        150,
        yPosition
      );

      yPosition += 7;
    });

    // PDFをダウンロード
    const fileName = `勤務報告書_${monthlyStats.year}年${monthlyStats.month}月.pdf`;
    doc.save(fileName);
  } catch (error) {
    console.error('PDF出力エラー:', error);
    throw new Error('PDF出力に失敗しました');
  }
}

/**
 * カスタムレポートのPDF出力（将来の拡張用）
 */
export async function exportCustomReportPDF(
  title: string,
  data: Array<Record<string, unknown>>,
  headers: string[]
): Promise<void> {
  try {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text(title, 20, 20);

    let yPosition = 40;
    doc.setFontSize(10);

    // ヘッダー
    headers.forEach((header, index) => {
      doc.text(header, 20 + index * 30, yPosition);
    });
    yPosition += 7;

    // 線を引く
    doc.line(20, yPosition - 2, 20 + headers.length * 30, yPosition - 2);

    // データ行
    data.forEach((row) => {
      if (yPosition > 260) {
        doc.addPage();
        yPosition = 20;
      }

      headers.forEach((header, index) => {
        const value = row[header];
        const text = value ? String(value) : '-';
        doc.text(
          text.length > 15 ? text.substring(0, 15) + '...' : text,
          20 + index * 30,
          yPosition
        );
      });

      yPosition += 7;
    });

    doc.save(`${title}.pdf`);
  } catch (error) {
    console.error('カスタムPDF出力エラー:', error);
    throw new Error('PDF出力に失敗しました');
  }
}
