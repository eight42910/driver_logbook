/**
 * 文字列操作ユーティリティ
 */

/**
 * 文字列をスラッグ化
 * @param text - スラッグ化する文字列
 * @returns スラッグ化された文字列
 */
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // 特殊文字を削除
    .replace(/[\s_-]+/g, '-') // スペース、アンダースコア、ハイフンをハイフンに変換
    .replace(/^-+|-+$/g, ''); // 先頭と末尾のハイフンを削除
};

/**
 * テキストを指定した長さで切り詰め
 * @param text - 切り詰める文字列
 * @param maxLength - 最大文字数
 * @param suffix - 末尾に追加する文字列
 * @returns 切り詰められた文字列
 */
export const truncate = (
  text: string,
  maxLength: number,
  suffix = '...'
): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
};

/**
 * HTMLタグを除去
 * @param html - HTMLを含む文字列
 * @returns HTMLタグが除去された文字列
 */
export const stripHtml = (html: string): string => {
  return html.replace(/<[^>]*>/g, '');
};

/**
 * 改行をHTMLの<br>タグに変換
 * @param text - 変換する文字列
 * @returns <br>タグに変換された文字列
 */
export const nl2br = (text: string): string => {
  return text.replace(/\n/g, '<br>');
};

/**
 * キャメルケースをケバブケースに変換
 * @param camelCase - キャメルケースの文字列
 * @returns ケバブケースの文字列
 */
export const camelToKebab = (camelCase: string): string => {
  return camelCase
    .replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2')
    .toLowerCase();
};

/**
 * ケバブケースをキャメルケースに変換
 * @param kebabCase - ケバブケースの文字列
 * @returns キャメルケースの文字列
 */
export const kebabToCamel = (kebabCase: string): string => {
  return kebabCase.replace(/-([a-z])/g, (match, letter) =>
    letter.toUpperCase()
  );
};

/**
 * 文字列が空かどうかをチェック
 * @param value - チェックする値
 * @returns 空の場合true
 */
export const isEmpty = (value: unknown): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};
