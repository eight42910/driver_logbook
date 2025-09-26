import { getAllContents, getContentBySlug } from '@/lib/microcms';
import type { Work, WorksResponse } from './types';

const WORKS_ENDPOINT = 'works';

/**
 * Works一覧を取得
 */
export const getWorks = async (
  limit = 10,
  offset = 0
): Promise<WorksResponse> => {
  try {
    const response = await getAllContents(WORKS_ENDPOINT, limit, offset);
    return {
      contents: response.contents as Work[],
      totalCount: response.totalCount,
      offset: response.offset,
      limit: response.limit,
    };
  } catch (error) {
    console.error('Failed to fetch works:', error);
    throw new Error('Works取得に失敗しました');
  }
};

/**
 * 特定のWorkをスラッグで取得
 */
export const getWorkBySlug = async (slug: string): Promise<Work | null> => {
  try {
    const content = await getContentBySlug(WORKS_ENDPOINT, slug);
    return content as Work | null;
  } catch (error) {
    console.error(`Failed to fetch work with slug "${slug}":`, error);
    return null;
  }
};

/**
 * 公開中のWorks一覧を取得（公開日でソート）
 */
export const getPublishedWorks = async (
  limit = 10,
  offset = 0
): Promise<WorksResponse> => {
  try {
    const response = await getWorks(limit, offset);

    // 公開中のもののみフィルタリング
    const publishedWorks = response.contents.filter(
      (work) => work.publishedAt && new Date(work.publishedAt) <= new Date()
    );

    return {
      contents: publishedWorks,
      totalCount: publishedWorks.length,
      offset,
      limit,
    };
  } catch (error) {
    console.error('Failed to fetch published works:', error);
    throw new Error('公開中Works取得に失敗しました');
  }
};

/**
 * おすすめのWorks一覧を取得
 */
export const getFeaturedWorks = async (limit = 6): Promise<Work[]> => {
  try {
    const response = await getWorks(limit);
    return response.contents.filter((work) => work.featured);
  } catch (error) {
    console.error('Failed to fetch featured works:', error);
    return [];
  }
};

/**
 * カテゴリー別Works一覧を取得
 */
export const getWorksByCategory = async (
  category: string,
  limit = 10,
  offset = 0
): Promise<WorksResponse> => {
  try {
    // カテゴリーフィルターは実装次第で調整
    const response = await getWorks(limit * 2, offset); // 多めに取得してフィルタリング

    const filteredWorks = response.contents.filter(
      (work) => work.category?.name === category
    );

    return {
      contents: filteredWorks.slice(0, limit),
      totalCount: filteredWorks.length,
      offset,
      limit,
    };
  } catch (error) {
    console.error(`Failed to fetch works by category "${category}":`, error);
    throw new Error(`カテゴリー別Works取得に失敗しました: ${category}`);
  }
};
