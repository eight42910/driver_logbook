'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { smartPreloadStrategy } from '@/lib/utils/smart-preload-strategy';

/**
 * スマートプリロード機能を提供するカスタムフック
 */
export function useSmartPreload() {
  const pathname = usePathname();
  const lastPathRef = useRef<string>('');
  const pageStartTimeRef = useRef<number>(Date.now());
  const isInitializedRef = useRef<boolean>(false);

  // ページ遷移の記録とプリロード実行
  useEffect(() => {
    const currentTime = Date.now();
    
    // 初回ロード時はスキップ
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      lastPathRef.current = pathname;
      pageStartTimeRef.current = currentTime;
      
      // 現在のページのプリロードを実行
      setTimeout(() => {
        smartPreloadStrategy.preloadForCurrentPage(pathname);
      }, 1000); // 1秒後に実行（初期読み込み後）
      
      return;
    }

    // 前のページからの遷移を記録
    if (lastPathRef.current && lastPathRef.current !== pathname) {
      const duration = currentTime - pageStartTimeRef.current;
      smartPreloadStrategy.recordNavigation(lastPathRef.current, pathname, duration);
    }

    // 現在のページの情報を更新
    lastPathRef.current = pathname;
    pageStartTimeRef.current = currentTime;

    // 新しいページのプリロードを実行
    const timeoutId = setTimeout(() => {
      smartPreloadStrategy.preloadForCurrentPage(pathname);
    }, 500); // 500ms後に実行

    return () => {
      clearTimeout(timeoutId);
    };
  }, [pathname]);

  // 手動でプリロードを実行する関数
  const preloadRoute = useCallback((targetPath: string) => {
    smartPreloadStrategy.preloadForCurrentPage(targetPath);
  }, []);

  // パフォーマンス統計を取得する関数
  const getPerformanceStats = useCallback(() => {
    return smartPreloadStrategy.getPerformanceStats();
  }, []);

  // 特定のリソースをプリロードする関数
  const preloadResource = useCallback((url: string, type: 'image' | 'css' | 'js' | 'font' = 'image') => {
    if (typeof window === 'undefined') return;

    try {
      const link = document.createElement('link');
      link.rel = 'preload';
      
      switch (type) {
        case 'image':
          link.as = 'image';
          break;
        case 'css':
          link.as = 'style';
          break;
        case 'js':
          link.as = 'script';
          break;
        case 'font':
          link.as = 'font';
          link.crossOrigin = 'anonymous';
          break;
      }
      
      link.href = url;
      document.head.appendChild(link);
      
      console.log(`Manually preloaded ${type}: ${url}`);
    } catch (error) {
      console.warn(`Failed to preload resource ${url}:`, error);
    }
  }, []);

  // 戻るボタンのプリロード（ブラウザ履歴ベース）
  const preloadBackButton = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    // 履歴から前のページを推測してプリロード
    const referrer = document.referrer;
    if (referrer && referrer.includes(window.location.hostname)) {
      const referrerPath = new URL(referrer).pathname;
      preloadRoute(referrerPath);
    }
  }, [preloadRoute]);

  return {
    preloadRoute,
    preloadResource,
    preloadBackButton,
    getPerformanceStats,
    currentPath: pathname,
  };
}

/**
 * ページ離脱時にナビゲーション情報を記録するフック
 */
export function usePageLeaveTracking() {
  const pathname = usePathname();
  const pageStartTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    pageStartTimeRef.current = Date.now();

    // ページ離脱時の処理
    const handleBeforeUnload = () => {
      const duration = Date.now() - pageStartTimeRef.current;
      // 最後のページとして記録（次回起動時に使用）
      try {
        sessionStorage.setItem('lastPageInfo', JSON.stringify({
          path: pathname,
          duration,
          timestamp: Date.now(),
        }));
      } catch (error) {
        console.warn('Failed to save page leave info:', error);
      }
    };

    // ページ非表示時の処理（モバイル対応）
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleBeforeUnload();
      } else if (document.visibilityState === 'visible') {
        // ページが再表示された時はタイマーをリセット
        pageStartTimeRef.current = Date.now();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pathname]);
}

/**
 * ネットワーク状況に応じたプリロード制御フック
 */
export function useNetworkAwarePreload() {
  const { preloadRoute, preloadResource } = useSmartPreload();

  // ネットワーク条件を取得
  const getNetworkInfo = useCallback(() => {
    if (typeof navigator === 'undefined') {
      return { effectiveType: '4g', saveData: false };
    }

    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;

    return {
      effectiveType: connection?.effectiveType || '4g',
      downlink: connection?.downlink || 10,
      rtt: connection?.rtt || 100,
      saveData: connection?.saveData || false,
    };
  }, []);

  // ネットワーク条件に応じたプリロード
  const smartPreload = useCallback((targetPath: string) => {
    const networkInfo = getNetworkInfo();
    
    // データセーバーモードまたは低速回線の場合はスキップ
    if (networkInfo.saveData || networkInfo.effectiveType === 'slow-2g') {
      console.log('Skipping preload due to network conditions');
      return;
    }

    // 3G以下の場合は遅延実行
    if (networkInfo.effectiveType === '2g' || networkInfo.effectiveType === '3g') {
      setTimeout(() => {
        preloadRoute(targetPath);
      }, 2000); // 2秒遅延
    } else {
      preloadRoute(targetPath);
    }
  }, [preloadRoute, getNetworkInfo]);

  // 重要なリソースのみプリロード
  const preloadCriticalResources = useCallback(() => {
    const networkInfo = getNetworkInfo();
    
    if (networkInfo.saveData) return;

    // フォントは常にプリロード（小さいサイズ）
    preloadResource('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap', 'font');

    // 良好な接続の場合のみ画像をプリロード
    if (networkInfo.effectiveType === '4g' && !networkInfo.saveData) {
      // アプリアイコンなどの重要な画像をここでプリロード
      // preloadResource('/images/app-icon.png', 'image');
    }
  }, [preloadResource, getNetworkInfo]);

  return {
    smartPreload,
    preloadCriticalResources,
    getNetworkInfo,
  };
}

/**
 * ユーザーインタラクションに基づくプリロードフック
 */
export function useInteractionPreload() {
  const { preloadRoute } = useSmartPreload();

  // ホバー時のプリロード
  const handleLinkHover = useCallback((targetPath: string) => {
    // デスクトップのみ（モバイルではhoverが意味をなさない）
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      preloadRoute(targetPath);
    }
  }, [preloadRoute]);

  // タッチ開始時のプリロード（モバイル）
  const handleLinkTouchStart = useCallback((targetPath: string) => {
    // タッチ開始から実際のナビゲーションまでの時間を活用
    preloadRoute(targetPath);
  }, [preloadRoute]);

  // フォーカス時のプリロード
  const handleLinkFocus = useCallback((targetPath: string) => {
    preloadRoute(targetPath);
  }, [preloadRoute]);

  return {
    handleLinkHover,
    handleLinkTouchStart,
    handleLinkFocus,
  };
}

/**
 * プリロード統計を表示するデバッグフック
 */
export function usePreloadDebug() {
  const { getPerformanceStats } = useSmartPreload();

  const logStats = useCallback(() => {
    const stats = getPerformanceStats();
    console.group('Smart Preload Statistics');
    console.log('Total patterns learned:', stats.totalPatterns);
    console.log('Navigation history size:', stats.totalHistory);
    console.log('Currently preloaded resources:', stats.preloadedResources);
    console.log('Average confidence:', stats.averageConfidence?.toFixed(2));
    console.log('Most frequent patterns:', stats.mostFrequentPatterns);
    console.groupEnd();
  }, [getPerformanceStats]);

  // 開発環境でのみ自動ログ出力
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(logStats, 30000); // 30秒ごと
      return () => clearInterval(interval);
    }
  }, [logStats]);

  return { logStats, getPerformanceStats };
}
