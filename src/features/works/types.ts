/**
 * microCMSの画像型
 */
export interface MicroCMSImage {
  url: string;
  height: number;
  width: number;
}

/**
 * Workカテゴリー型
 */
export interface WorkCategory {
  id: string;
  name: string;
  slug: string;
  color?: string;
  description?: string;
}

/**
 * Workタグ型
 */
export interface WorkTag {
  id: string;
  name: string;
  slug: string;
}

/**
 * Work型（microCMSの基本フィールドを含む）
 */
export interface Work {
  id: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  revisedAt?: string;

  // コンテンツフィールド
  title: string;
  slug: string;
  description?: string;
  content?: string;
  eyecatch?: MicroCMSImage;

  // Work固有フィールド
  category?: WorkCategory;
  tags?: WorkTag[];
  featured?: boolean;
  status?: 'draft' | 'published' | 'archived';

  // プロジェクト詳細
  client?: string;
  role?: string;
  duration?: string;
  technologies?: string[];
  projectUrl?: string;
  githubUrl?: string;

  // SEO
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: MicroCMSImage;
}

/**
 * Works一覧レスポンス型
 */
export interface WorksResponse {
  contents: Work[];
  totalCount: number;
  offset: number;
  limit: number;
}

/**
 * Work一覧ページのProps型
 */
export interface WorksPageProps {
  searchParams?: {
    page?: string;
    category?: string;
    tag?: string;
    search?: string;
  };
}

/**
 * Work詳細ページのProps型
 */
export interface WorkDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

/**
 * Workカード表示用の型（一覧ページなどで使用）
 */
export interface WorkCardData {
  id: string;
  title: string;
  slug: string;
  description?: string;
  eyecatch?: MicroCMSImage;
  category?: WorkCategory;
  tags?: WorkTag[];
  publishedAt?: string;
  featured?: boolean;
}

/**
 * フィルター用の型
 */
export interface WorksFilter {
  category?: string;
  tags?: string[];
  status?: Work['status'];
  featured?: boolean;
  dateRange?: {
    start?: string;
    end?: string;
  };
}

/**
 * ソート用の型
 */
export interface WorksSort {
  field: 'publishedAt' | 'createdAt' | 'updatedAt' | 'title';
  order: 'asc' | 'desc';
}

/**
 * Works検索用パラメーター型
 */
export interface WorksSearchParams {
  query?: string;
  limit?: number;
  offset?: number;
  filter?: WorksFilter;
  sort?: WorksSort;
}
