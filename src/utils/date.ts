/**
 * 日付フォーマットユーティリティ
 */

/**
 * 日付を日本語形式でフォーマット
 * @param date - フォーマットする日付
 * @param options - Intl.DateTimeFormatのオプション
 * @returns フォーマットされた日付文字列
 */
export const formatDate = (
  date: string | Date,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('ja-JP', options).format(dateObj);
};

/**
 * 相対的な日付を取得（例：3日前、1週間前）
 * @param date - 比較する日付
 * @returns 相対的な日付文字列
 */
export const getRelativeDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  const intervals = [
    { label: '年', seconds: 31536000 },
    { label: 'ヶ月', seconds: 2592000 },
    { label: '週間', seconds: 604800 },
    { label: '日', seconds: 86400 },
    { label: '時間', seconds: 3600 },
    { label: '分', seconds: 60 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count > 0) {
      return `${count}${interval.label}前`;
    }
  }

  return 'たった今';
};

/**
 * ISO文字列から年月日のみを取得
 * @param isoString - ISO形式の日付文字列
 * @returns YYYY-MM-DD形式の文字列
 */
export const getDateOnly = (isoString: string): string => {
  return isoString.split('T')[0];
};

/**
 * 2つの日付の差分を計算
 * @param startDate - 開始日
 * @param endDate - 終了日
 * @returns 日数の差分
 */
export const getDaysDifference = (
  startDate: string | Date,
  endDate: string | Date
): number => {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  const diffInTime = end.getTime() - start.getTime();
  return Math.ceil(diffInTime / (1000 * 3600 * 24));
};
