import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import type { DailyReport } from '@/types/database';

/**
 * HTML2Canvas + jsPDF による確実な日本語PDF生成
 * ブラウザのレンダリングエンジンを活用してHTMLをキャンバスに変換後、PDFに埋め込み
 */

export interface MonthlyStats {
  year: number;
  month: number;
  workingDays: number;
  totalDistance: number;
  totalDeliveries: number;
  totalHighwayFee: number;
  totalWorkingHours: number;
  averageDistance: number;
  averageDeliveries: number;
  averageWorkingHours: number;
}

/**
 * 月次統計データを計算
 * @param reports 日報データ配列
 * @param year 年
 * @param month 月
 */
export function calculateMonthlyStats(
  reports: DailyReport[],
  year?: number,
  month?: number
): MonthlyStats {
  const workReports = reports.filter((r) => r.is_worked);

  const workingDays = workReports.length;
  const totalDistance = workReports.reduce(
    (sum, r) => sum + (r.distance_km || 0),
    0
  );

  const totalDeliveries = workReports.reduce(
    (sum, r) => sum + (r.deliveries || 0),
    0
  );

  const totalHighwayFee = workReports.reduce(
    (sum, r) => sum + (r.highway_fee || 0),
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

  const totalWorkingHours = totalWorkMinutes / 60;
  const averageDistance = workingDays > 0 ? totalDistance / workingDays : 0;
  const averageDeliveries = workingDays > 0 ? totalDeliveries / workingDays : 0;
  const averageWorkingHours =
    workingDays > 0 ? totalWorkingHours / workingDays : 0;

  // デフォルト値を設定（年月が指定されていない場合）
  const currentDate = new Date();
  const currentYear = year || currentDate.getFullYear();
  const currentMonth = month || currentDate.getMonth() + 1;

  return {
    year: currentYear,
    month: currentMonth,
    workingDays,
    totalDistance,
    totalDeliveries,
    totalHighwayFee,
    totalWorkingHours,
    averageDistance,
    averageDeliveries,
    averageWorkingHours,
  };
}

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
 * PDF用HTMLテンプレートを生成
 */
function createPDFTemplate(
  reports: DailyReport[],
  stats: MonthlyStats,
  period: string,
  userName: string
): string {
  // 日付順にソート（古い順）
  const sortedReports = [...reports].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>運転手業務月次レポート</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Noto Sans JP', 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', 'Meiryo', sans-serif;
            font-size: 12px;
            line-height: 1.6;
            color: #333;
            background: white;
            width: 210mm;
            min-height: 297mm;
            padding: 20mm;
            margin: 0 auto;
            letter-spacing: 0.02em;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
        }
        
        .title {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .subtitle {
            font-size: 14px;
            color: #666;
            margin-bottom: 5px;
        }
        
        .stats-section {
            margin-bottom: 30px;
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
        }
        
        .stats-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 15px;
            color: #333;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
        }
        
        .stat-item {
            padding: 8px 0;
            border-bottom: 1px solid #ddd;
        }
        
        .stat-label {
            font-weight: 500;
            color: #555;
        }
        
        .stat-value {
            font-weight: bold;
            color: #333;
        }
        
        .table-section {
            margin-top: 30px;
        }
        
        .table-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 15px;
        }
        
        .report-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        
        .report-table th,
        .report-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: center;
            font-size: 11px;
            letter-spacing: 0.03em;
        }
        
        .report-table th {
            background-color: #f1f3f4;
            font-weight: bold;
            color: #333;
        }
        
        .report-table td {
            background-color: white;
        }
        
        .date-col { width: 15%; }
        .status-col { width: 8%; }
        .time-col { width: 12%; }
        .distance-col { width: 12%; }
        .notes-col { width: 25%; }
        
        .work-status {
            font-weight: bold;
        }
        
        .work-status.worked {
            color: #059669;
        }
        
        .work-status.not-worked {
            color: #dc2626;
        }
        
        .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 15px;
        }
        
        .page-break {
            page-break-before: always;
        }
        
        /* 数字・時刻の可読性向上 */
        .time-value, .number-value {
            font-family: 'Noto Sans JP', 'Monaco', 'Menlo', monospace;
            letter-spacing: 0.1em;
            font-weight: 500;
        }
        
        .date-value {
            letter-spacing: 0.05em;
            font-weight: 500;
        }
        
        @media print {
            body {
                margin: 0;
                padding: 20mm;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">運転手業務月次レポート</div>
        <div class="subtitle">期間: ${period}</div>
        <div class="subtitle">ユーザー: ${userName}</div>
        <div class="subtitle">生成日時: ${format(
          new Date(),
          'yyyy年M月d日 HH:mm',
          { locale: ja }
        )}</div>
    </div>
    
    <div class="stats-section">
        <div class="stats-title">月次統計</div>
        <div class="stats-grid">
            <div class="stat-item">
                <div class="stat-label">稼働日数</div>
                <div class="stat-value">
                    <span class="number-value">${stats.workingDays}</span>日
                </div>
            </div>
            <div class="stat-item">
                <div class="stat-label">総走行距離</div>
                <div class="stat-value">
                    <span class="number-value">${stats.totalDistance.toFixed(
                      1
                    )}</span>km
                </div>
            </div>
            <div class="stat-item">
                <div class="stat-label">総作業時間</div>
                <div class="stat-value">
                    <span class="number-value">${stats.totalWorkingHours.toFixed(
                      1
                    )}</span>時間
                </div>
            </div>
            <div class="stat-item">
                <div class="stat-label">平均走行距離</div>
                <div class="stat-value">
                    <span class="number-value">${stats.averageDistance.toFixed(
                      1
                    )}</span>km/日
                </div>
            </div>
        </div>
    </div>
    
    <div class="table-section">
        <div class="table-title">日別詳細</div>
        <table class="report-table">
            <thead>
                <tr>
                    <th class="date-col">日付</th>
                    <th class="status-col">稼働</th>
                    <th class="time-col">開始時刻</th>
                    <th class="time-col">終了時刻</th>
                    <th class="time-col">作業時間</th>
                    <th class="distance-col">距離(km)</th>
                    <th class="notes-col">備考</th>
                </tr>
            </thead>
            <tbody>
                ${sortedReports
                  .map(
                    (report) => `
                    <tr>
                        <td class="date-col">
                            <span class="date-value">${format(
                              new Date(report.date),
                              'M/d(E)',
                              { locale: ja }
                            )}</span>
                        </td>
                        <td class="status-col">
                            <span class="work-status ${
                              report.is_worked ? 'worked' : 'not-worked'
                            }">
                                ${formatWorkStatusSymbol(report.is_worked)}
                            </span>
                        </td>
                        <td class="time-col">
                            <span class="time-value">${
                              report.start_time || ''
                            }</span>
                        </td>
                        <td class="time-col">
                            <span class="time-value">${
                              report.end_time || ''
                            }</span>
                        </td>
                        <td class="time-col">
                            <span class="time-value">${formatDuration(
                              report.start_time,
                              report.end_time
                            )}</span>
                        </td>
                        <td class="distance-col">
                            <span class="number-value">${
                              report.distance_km?.toString() || ''
                            }</span>
                        </td>
                        <td class="notes-col">${report.notes || ''}</td>
                    </tr>
                `
                  )
                  .join('')}
            </tbody>
        </table>
    </div>
    
    <div class="footer">
        <div>© 2025 Driver Logbook v3 - 運転手業務効率化システム</div>
        <div>このレポートは自動生成されました</div>
    </div>
</body>
</html>`;
}

/**
 * HTMLテンプレートからPDFを生成
 */
export async function generateMonthlyReportPDF(
  reports: DailyReport[],
  stats: MonthlyStats,
  period: string,
  userName: string
): Promise<void> {
  try {
    // 一時的にHTMLを作成
    const htmlContent = createPDFTemplate(reports, stats, period, userName);

    // 非表示のiframeを作成してHTMLを描画
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    iframe.style.width = '210mm';
    iframe.style.height = '297mm';
    document.body.appendChild(iframe);

    // iframeにHTMLを設定
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      throw new Error('iframeにアクセスできません');
    }

    iframeDoc.open();
    iframeDoc.write(htmlContent);
    iframeDoc.close();

    // フォント読み込み待機
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // html2canvasでキャンバスに変換
    const canvas = await html2canvas(iframeDoc.body, {
      width: 794, // A4幅 (210mm * 96dpi / 25.4)
      height: 1123, // A4高さ (297mm * 96dpi / 25.4)
      scale: 2, // 高解像度
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
    });

    // iframeを削除
    document.body.removeChild(iframe);

    // PDFを作成
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // キャンバスをPDFに追加
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);

    // 複数ページに分割が必要な場合の処理
    // （現在は1ページに収める簡易版）

    // PDFファイルをダウンロード
    const fileName = `運転手業務月次レポート_${period}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error(
      'PDF生成に失敗しました。ブラウザがhtml2canvasをサポートしていない可能性があります。'
    );
  }
}

/**
 * カスタム期間のレポートPDFを生成
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
 * PDF生成がサポートされているかチェック
 */
export function isPDFSupported(): boolean {
  try {
    return (
      typeof window !== 'undefined' &&
      typeof document !== 'undefined' &&
      'toDataURL' in document.createElement('canvas')
    );
  } catch {
    return false;
  }
}
