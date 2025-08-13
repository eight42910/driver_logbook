'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  networkOptimizer,
  type NetworkStatus,
  type OptimizationConfig,
} from '@/lib/utils/network-optimization';

/**
 * ネットワーク最適化機能を提供するカスタムフック
 */
export function useNetworkOptimization() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>(
    networkOptimizer.getNetworkStatus()
  );
  const [isLightModeActive, setIsLightModeActive] = useState(
    networkOptimizer.isLightModeActive()
  );

  useEffect(() => {
    // ネットワーク状態変化の監視
    networkOptimizer.onNetworkChange((status) => {
      setNetworkStatus(status);
      setIsLightModeActive(networkOptimizer.isLightModeActive());
    });
  }, []);

  const updateConfig = useCallback((config: Partial<OptimizationConfig>) => {
    networkOptimizer.updateConfig(config);
  }, []);

  const toggleOfflineMode = useCallback((enabled: boolean) => {
    networkOptimizer.toggleOfflineMode(enabled);
  }, []);

  const getOptimizationStats = useCallback(() => {
    return networkOptimizer.getOptimizationStats();
  }, []);

  return {
    networkStatus,
    isLightModeActive,
    updateConfig,
    toggleOfflineMode,
    getOptimizationStats,
  };
}

/**
 * レスポンシブ画像最適化フック
 */
export function useResponsiveImage() {
  const { networkStatus } = useNetworkOptimization();

  const getOptimalImageProps = useCallback(
    (src: string, alt: string, width?: number, height?: number) => {
      const quality = getImageQualityForNetwork(
        networkStatus.connectionQuality
      );
      const loading = networkStatus.isLowData ? 'lazy' : 'eager';

      return {
        src,
        alt,
        width,
        height,
        loading: loading as 'eager' | 'lazy',
        quality,
        placeholder: networkStatus.isLowData ? 'blur' : undefined,
        priority: !networkStatus.isLowData,
      };
    },
    [networkStatus]
  );

  const getResponsiveSizes = useCallback(
    (breakpoints: Record<string, number>) => {
      const entries = Object.entries(breakpoints);
      return entries
        .map(([size, width]) => `(max-width: ${size}) ${width}px`)
        .join(', ');
    },
    []
  );

  return {
    getOptimalImageProps,
    getResponsiveSizes,
    shouldLazyLoad: networkStatus.isLowData,
    shouldUseBlurPlaceholder: networkStatus.isLowData,
  };
}

/**
 * 適応的リソース読み込みフック
 */
export function useAdaptiveLoading() {
  const { networkStatus, isLightModeActive } = useNetworkOptimization();

  const shouldLoadResource = useCallback(
    (priority: 'high' | 'medium' | 'low') => {
      if (!navigator.onLine) return false;

      switch (networkStatus.connectionQuality) {
        case 'excellent':
          return true;
        case 'good':
          return priority !== 'low';
        case 'fair':
          return priority === 'high';
        case 'poor':
          return priority === 'high' && !networkStatus.saveData;
        default:
          return false;
      }
    },
    [networkStatus]
  );

  const getLoadingStrategy = useCallback(() => {
    if (isLightModeActive) {
      return 'conservative';
    }

    switch (networkStatus.connectionQuality) {
      case 'excellent':
        return 'aggressive';
      case 'good':
        return 'balanced';
      case 'fair':
        return 'conservative';
      default:
        return 'minimal';
    }
  }, [networkStatus, isLightModeActive]);

  const shouldPreload = useCallback(
    (resourceType: 'image' | 'script' | 'style' | 'font') => {
      if (networkStatus.saveData) return false;

      const strategy = getLoadingStrategy();

      switch (strategy) {
        case 'aggressive':
          return true;
        case 'balanced':
          return resourceType === 'font' || resourceType === 'style';
        case 'conservative':
          return resourceType === 'font';
        default:
          return false;
      }
    },
    [networkStatus, getLoadingStrategy]
  );

  return {
    shouldLoadResource,
    getLoadingStrategy,
    shouldPreload,
    isLightModeActive,
    connectionQuality: networkStatus.connectionQuality,
  };
}

/**
 * データ使用量監視フック
 */
export function useDataUsageMonitor() {
  const [dataUsage, setDataUsage] = useState({
    totalBytes: 0,
    savedBytes: 0,
    sessionStartTime: Date.now(),
  });

  const recordDataUsage = useCallback((resourceUrl: string, bytes: number) => {
    setDataUsage((prev) => ({
      ...prev,
      totalBytes: prev.totalBytes + bytes,
    }));

    // ローカルストレージに記録
    try {
      const stored = localStorage.getItem('dataUsageStats');
      const stats = stored ? JSON.parse(stored) : { daily: {}, total: 0 };
      const today = new Date().toISOString().split('T')[0];

      stats.daily[today] = (stats.daily[today] || 0) + bytes;
      stats.total += bytes;

      localStorage.setItem('dataUsageStats', JSON.stringify(stats));
    } catch (error) {
      console.warn('Failed to store data usage stats:', error);
    }
  }, []);

  const recordSavedData = useCallback((savedBytes: number) => {
    setDataUsage((prev) => ({
      ...prev,
      savedBytes: prev.savedBytes + savedBytes,
    }));
  }, []);

  const getDailyUsage = useCallback(() => {
    try {
      const stored = localStorage.getItem('dataUsageStats');
      if (!stored) return {};

      const stats = JSON.parse(stored);
      return stats.daily || {};
    } catch (error) {
      console.warn('Failed to get daily usage stats:', error);
      return {};
    }
  }, []);

  const getTotalSavings = useCallback(() => {
    const optimizationStats = networkOptimizer.getOptimizationStats();
    let totalSaved = 0;

    optimizationStats.forEach((stat) => {
      totalSaved += stat.savedBytes;
    });

    return totalSaved;
  }, []);

  return {
    dataUsage,
    recordDataUsage,
    recordSavedData,
    getDailyUsage,
    getTotalSavings,
  };
}

/**
 * オフライン対応フック
 */
export function useOfflineSupport() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineQueue, setOfflineQueue] = useState<
    Array<{
      id: string;
      method: string;
      url: string;
      data: any;
      timestamp: number;
    }>
  >([]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      processOfflineQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const addToOfflineQueue = useCallback(
    (method: string, url: string, data: any) => {
      const item = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        method,
        url,
        data,
        timestamp: Date.now(),
      };

      setOfflineQueue((prev) => [...prev, item]);

      // ローカルストレージにも保存
      try {
        const stored = localStorage.getItem('offlineQueue');
        const queue = stored ? JSON.parse(stored) : [];
        queue.push(item);
        localStorage.setItem('offlineQueue', JSON.stringify(queue));
      } catch (error) {
        console.warn('Failed to store offline queue item:', error);
      }
    },
    []
  );

  const processOfflineQueue = useCallback(async () => {
    try {
      const stored = localStorage.getItem('offlineQueue');
      if (!stored) return;

      const queue = JSON.parse(stored);
      const processedItems: string[] = [];

      for (const item of queue) {
        try {
          await fetch(item.url, {
            method: item.method,
            headers: {
              'Content-Type': 'application/json',
            },
            body: item.data ? JSON.stringify(item.data) : undefined,
          });

          processedItems.push(item.id);
          console.log(`Processed offline queue item: ${item.id}`);
        } catch (error) {
          console.warn(
            `Failed to process offline queue item ${item.id}:`,
            error
          );
        }
      }

      // 処理済みアイテムを削除
      const remainingQueue = queue.filter(
        (item: any) => !processedItems.includes(item.id)
      );
      localStorage.setItem('offlineQueue', JSON.stringify(remainingQueue));
      setOfflineQueue(remainingQueue);
    } catch (error) {
      console.warn('Failed to process offline queue:', error);
    }
  }, []);

  const clearOfflineQueue = useCallback(() => {
    setOfflineQueue([]);
    localStorage.removeItem('offlineQueue');
  }, []);

  return {
    isOnline,
    offlineQueue,
    addToOfflineQueue,
    processOfflineQueue,
    clearOfflineQueue,
    queueSize: offlineQueue.length,
  };
}

/**
 * パフォーマンス予算監視フック
 */
export function usePerformanceBudget() {
  const [budget] = useState({
    maxLoadTime: 3000, // 3秒
    maxImageSize: 500 * 1024, // 500KB
    maxScriptSize: 1024 * 1024, // 1MB
    maxTotalSize: 5 * 1024 * 1024, // 5MB
  });

  const [currentUsage, setCurrentUsage] = useState({
    loadTime: 0,
    imageSize: 0,
    scriptSize: 0,
    totalSize: 0,
  });

  const checkBudget = useCallback(
    (resourceType: string, size: number, loadTime?: number) => {
      const newUsage = { ...currentUsage };

      switch (resourceType) {
        case 'image':
          newUsage.imageSize += size;
          break;
        case 'script':
          newUsage.scriptSize += size;
          break;
        default:
          newUsage.totalSize += size;
      }

      if (loadTime) {
        newUsage.loadTime = Math.max(newUsage.loadTime, loadTime);
      }

      setCurrentUsage(newUsage);

      // 予算超過の警告
      const warnings: string[] = [];

      if (newUsage.loadTime > budget.maxLoadTime) {
        warnings.push(
          `Load time budget exceeded: ${newUsage.loadTime}ms > ${budget.maxLoadTime}ms`
        );
      }

      if (newUsage.imageSize > budget.maxImageSize) {
        warnings.push(
          `Image size budget exceeded: ${newUsage.imageSize} > ${budget.maxImageSize} bytes`
        );
      }

      if (newUsage.scriptSize > budget.maxScriptSize) {
        warnings.push(
          `Script size budget exceeded: ${newUsage.scriptSize} > ${budget.maxScriptSize} bytes`
        );
      }

      if (newUsage.totalSize > budget.maxTotalSize) {
        warnings.push(
          `Total size budget exceeded: ${newUsage.totalSize} > ${budget.maxTotalSize} bytes`
        );
      }

      if (warnings.length > 0) {
        console.warn('Performance budget warnings:', warnings);
      }

      return {
        isWithinBudget: warnings.length === 0,
        warnings,
        usage: newUsage,
        budget,
      };
    },
    [budget, currentUsage]
  );

  const getBudgetStatus = useCallback(() => {
    return {
      loadTime: {
        current: currentUsage.loadTime,
        budget: budget.maxLoadTime,
        percentage: (currentUsage.loadTime / budget.maxLoadTime) * 100,
      },
      imageSize: {
        current: currentUsage.imageSize,
        budget: budget.maxImageSize,
        percentage: (currentUsage.imageSize / budget.maxImageSize) * 100,
      },
      scriptSize: {
        current: currentUsage.scriptSize,
        budget: budget.maxScriptSize,
        percentage: (currentUsage.scriptSize / budget.maxScriptSize) * 100,
      },
      totalSize: {
        current: currentUsage.totalSize,
        budget: budget.maxTotalSize,
        percentage: (currentUsage.totalSize / budget.maxTotalSize) * 100,
      },
    };
  }, [budget, currentUsage]);

  return {
    checkBudget,
    getBudgetStatus,
    currentUsage,
    budget,
  };
}

// ヘルパー関数
function getImageQualityForNetwork(
  quality: NetworkStatus['connectionQuality']
): number {
  switch (quality) {
    case 'excellent':
      return 90;
    case 'good':
      return 80;
    case 'fair':
      return 60;
    case 'poor':
      return 40;
    default:
      return 60;
  }
}
