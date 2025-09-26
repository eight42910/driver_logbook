import { createClient } from 'microcms-js-sdk';
import type { Content, ContentsResponse } from '@/types';

const serviceDomain = process.env.MICROCMS_SERVICE_DOMAIN;
const apiKey = process.env.MICROCMS_API_KEY;

if (!serviceDomain || !apiKey) {
  throw new Error('MICROCMS_SERVICE_DOMAIN and MICROCMS_API_KEY are required.');
}

export const client = createClient({
  serviceDomain,
  apiKey,
});

// コンテンツを全て取得（エンドポイント名は用途に応じて変更）
export const getAllContents = async (
  endpoint: string,
  limit = 10,
  offset = 0
): Promise<ContentsResponse> => {
  try {
    const response = await client.get({
      endpoint,
      queries: {
        limit,
        offset,
        orders: '-publishedAt',
      },
    });
    return response;
  } catch (error) {
    console.error(`Failed to fetch contents from ${endpoint}:`, error);
    throw error;
  }
};

// 特定のコンテンツを取得
export const getContentById = async (
  endpoint: string,
  id: string
): Promise<Content> => {
  try {
    const response = await client.get({
      endpoint,
      contentId: id,
    });
    return response;
  } catch (error) {
    console.error(`Failed to fetch content with id ${id}:`, error);
    throw error;
  }
};

// スラッグでコンテンツを取得
export const getContentBySlug = async (
  endpoint: string,
  slug: string
): Promise<Content | null> => {
  try {
    const response = await client.get({
      endpoint,
      queries: {
        filters: `slug[equals]${slug}`,
        limit: 1,
      },
    });
    return response.contents[0] || null;
  } catch (error) {
    console.error(`Failed to fetch content with slug ${slug}:`, error);
    return null;
  }
};
