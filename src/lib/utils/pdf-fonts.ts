import jsPDF from 'jspdf';

/**
 * PDF用日本語フォント設定モジュール
 * NotoSansJP の Web Font を使用して日本語表示を実現
 */

/**
 * 日本語フォント設定のオプション
 */
export interface JapaneseFontOptions {
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  maxWidth?: number;
  align?: 'left' | 'center' | 'right';
}

/**
 * Web Font を使った日本語フォントの読み込み
 * Google Fonts の NotoSansJP を動的に読み込み
 */
async function loadJapaneseWebFont(): Promise<boolean> {
  try {
    // Google Fonts の NotoSansJP を読み込み
    const fontUrl =
      'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&display=swap';

    // 既に読み込み済みかチェック
    const existingLink = document.querySelector(`link[href="${fontUrl}"]`);
    if (existingLink) {
      return true;
    }

    // フォントリンクを動的に追加
    const link = document.createElement('link');
    link.href = fontUrl;
    link.rel = 'stylesheet';
    link.crossOrigin = 'anonymous';

    document.head.appendChild(link);

    // フォント読み込み完了を待機
    return new Promise((resolve) => {
      link.onload = () => resolve(true);
      link.onerror = () => resolve(false);

      // タイムアウト設定（3秒）
      setTimeout(() => resolve(false), 3000);
    });
  } catch (error) {
    console.warn('日本語Webフォントの読み込みに失敗:', error);
    return false;
  }
}

/**
 * Canvas を使用した日本語文字幅計算
 * jsPDF の getTextWidth が日本語で正確でない場合の代替手段
 */
function measureJapaneseText(
  text: string,
  fontSize: number = 10,
  fontFamily: string = 'Noto Sans JP, sans-serif'
): number {
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) return text.length * fontSize * 0.6; // フォールバック

    context.font = `${fontSize}px ${fontFamily}`;
    const metrics = context.measureText(text);

    // mm単位に変換（96dpi基準）
    return (metrics.width * 25.4) / 96;
  } catch (error) {
    console.warn('文字幅測定エラー:', error);
    return text.length * fontSize * 0.6; // フォールバック
  }
}

/**
 * jsPDF に日本語フォントを設定
 * フォールバック機能付きで確実な日本語表示を実現
 */
export async function setupJapaneseFont(doc: jsPDF): Promise<void> {
  try {
    // Web Font の読み込み試行
    const webFontLoaded = await loadJapaneseWebFont();

    if (webFontLoaded) {
      // Web Font が利用可能な場合
      doc.setFont('Noto Sans JP', 'normal');
      console.info('PDF: Noto Sans JP Web Font を使用');
    } else {
      // フォールバック: デフォルトフォント
      doc.setFont('helvetica', 'normal');
      console.warn('PDF: フォールバックフォント（helvetica）を使用');
    }

    // 基本フォントサイズ設定
    doc.setFontSize(10);
  } catch (error) {
    console.error('PDF日本語フォント設定エラー:', error);
    // 最終フォールバック
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
  }
}

/**
 * 日本語テキストを安全に描画
 * 文字化け対策とレイアウト調整を含む
 */
export function drawJapaneseText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  options: JapaneseFontOptions = {}
): void {
  const {
    fontSize = 10,
    fontWeight = 'normal',
    maxWidth,
    align = 'left',
  } = options;

  try {
    // フォント設定
    doc.setFontSize(fontSize);
    doc.setFont('Noto Sans JP', fontWeight === 'bold' ? 'bold' : 'normal');

    // 長いテキストの処理
    if (maxWidth) {
      const lines = doc.splitTextToSize(text, maxWidth);
      let currentY = y;

      (Array.isArray(lines) ? lines : [lines]).forEach((line: string) => {
        let drawX = x;

        // テキスト配置調整
        if (align === 'center') {
          const textWidth = measureJapaneseText(line, fontSize);
          drawX = x - textWidth / 2;
        } else if (align === 'right') {
          const textWidth = measureJapaneseText(line, fontSize);
          drawX = x - textWidth;
        }

        doc.text(line, drawX, currentY);
        currentY += fontSize * 0.4; // 行間調整
      });
    } else {
      let drawX = x;

      // 単行テキストの配置調整
      if (align === 'center') {
        const textWidth = measureJapaneseText(text, fontSize);
        drawX = x - textWidth / 2;
      } else if (align === 'right') {
        const textWidth = measureJapaneseText(text, fontSize);
        drawX = x - textWidth;
      }

      doc.text(text, drawX, y);
    }
  } catch (error) {
    console.warn('日本語テキスト描画エラー:', error);
    // エラー時はデフォルト描画
    doc.text(text || '', x, y);
  }
}

/**
 * PDF生成前の環境チェック
 * ブラウザ対応状況と必要な機能の確認
 */
export function checkPDFEnvironment(): {
  isSupported: boolean;
  webFontSupported: boolean;
  canvasSupported: boolean;
} {
  try {
    const isSupported =
      typeof window !== 'undefined' && typeof document !== 'undefined';
    const webFontSupported =
      typeof document !== 'undefined' && 'fonts' in document;
    const canvasSupported = typeof HTMLCanvasElement !== 'undefined';

    return {
      isSupported,
      webFontSupported,
      canvasSupported,
    };
  } catch {
    return {
      isSupported: false,
      webFontSupported: false,
      canvasSupported: false,
    };
  }
}

/**
 * フォント読み込み状態の確認
 * デバッグ用の情報取得
 */
export function getFontStatus(): {
  availableFonts: string[];
  notoSansJPLoaded: boolean;
} {
  try {
    if (typeof document === 'undefined') {
      return { availableFonts: [], notoSansJPLoaded: false };
    }

    // 利用可能なフォント一覧（近似）
    const availableFonts = [
      'Arial',
      'Helvetica',
      'Times New Roman',
      'Courier New',
      'Noto Sans JP',
      'sans-serif',
      'serif',
      'monospace',
    ];

    // Noto Sans JP の読み込み状況確認
    const notoSansJPLoaded = document.fonts
      ? document.fonts.check('12px "Noto Sans JP"')
      : false;

    return {
      availableFonts,
      notoSansJPLoaded,
    };
  } catch {
    return { availableFonts: [], notoSansJPLoaded: false };
  }
}
