/**
 * microCMS関連の基本型定義
 */

// Base microCMS response structure
export interface MicroCMSResponse<T> {
  contents: T[];
  totalCount: number;
  offset: number;
  limit: number;
}

// Base microCMS content fields
export interface MicroCMSContentBase {
  id: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  revisedAt?: string;
}

// Media/Image definition
export interface MicroCMSImage {
  url: string;
  height: number;
  width: number;
}

// Generic content type - カスタマイズして使用
export interface Content extends MicroCMSContentBase {
  title: string;
  content?: string;
  description?: string;
  thumbnail?: MicroCMSImage;
  eyecatch?: MicroCMSImage;
  slug?: string;
}

// API response types
export type ContentsResponse = MicroCMSResponse<Content>;

/**
 * 共通のページ関連型
 */
export interface PageProps {
  params: Promise<Record<string, string>>;
  searchParams?: Record<string, string | string[] | undefined>;
}

/**
 * エラー関連型
 */
export interface APIError {
  message: string;
  status: number;
  code?: string;
}

/**
 * フォーム関連型
 */
export interface FormState {
  isLoading: boolean;
  error?: string | null;
  success?: boolean;
}

// 作品関連の型はfeatures/works/types.tsからエクスポート
export type {
  Work,
  WorksResponse,
  WorkCategory,
  WorkTag,
} from '@/features/works/types';
