/**
 * モバイルパフォーマンス監視システム
 * 読み込み遅延の原因を特定するための包括的な分析ツール
 */

import { useState, useEffect } from 'react';

// Web Performance API の型拡張
interface PerformanceEventTiming extends PerformanceEntry {
  processingStart: number;
}

interface LayoutShift extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

interface PerformanceReport {
  timestamp: string;
  metrics: Partial<PerformanceMetrics>;
  recommendations: string[];
}

export interface PerformanceMetrics {
  // Core Web Vitals
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift

  // Network
  networkType: string;
  connectionSpeed: string;

  // Bundle
  bundleSize: number;
  loadTime: number;

  // Device
  deviceMemory: number;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  userAgent: string;
}

/**
 * モバイルパフォーマンス測定
 */
export class MobilePerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {};

  constructor() {
    this.initializeMonitoring();
  }

  private initializeMonitoring() {
    // Core Web Vitals の測定
    this.measureCoreWebVitals();

    // ネットワーク情報の取得
    this.measureNetworkInfo();

    // デバイス情報の取得
    this.measureDeviceInfo();

    // バンドル情報の測定
    this.measureBundlePerformance();
  }

  private measureCoreWebVitals() {
    // First Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fcpEntry = entries.find(
        (entry) => entry.name === 'first-contentful-paint'
      );
      if (fcpEntry) {
        this.metrics.fcp = fcpEntry.startTime;
        this.reportMetric('FCP', fcpEntry.startTime);
      }
    }).observe({ entryTypes: ['paint'] });

    // Largest Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.metrics.lcp = lastEntry.startTime;
      this.reportMetric('LCP', lastEntry.startTime);
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        const fidEntry = entry as PerformanceEventTiming;
        this.metrics.fid = fidEntry.processingStart - fidEntry.startTime;
        this.reportMetric('FID', this.metrics.fid);
      });
    }).observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift
    let clsValue = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const layoutShiftEntry = entry as LayoutShift;
        if (!layoutShiftEntry.hadRecentInput) {
          clsValue += layoutShiftEntry.value;
        }
      }
      this.metrics.cls = clsValue;
      this.reportMetric('CLS', clsValue);
    }).observe({ entryTypes: ['layout-shift'] });
  }

  private measureNetworkInfo() {
    if ('connection' in navigator) {
      const connection = (
        navigator as Navigator & {
          connection: { effectiveType: string; downlink: number };
        }
      ).connection;
      this.metrics.networkType = connection.effectiveType;
      this.metrics.connectionSpeed = connection.downlink + 'Mbps';
    }
  }

  private measureDeviceInfo() {
    // デバイスメモリ
    if ('deviceMemory' in navigator) {
      this.metrics.deviceMemory = (
        navigator as Navigator & { deviceMemory: number }
      ).deviceMemory;
    }

    // デバイスタイプ判定
    const userAgent = navigator.userAgent;
    this.metrics.userAgent = userAgent;

    if (/Mobi|Android/i.test(userAgent)) {
      this.metrics.deviceType = 'mobile';
    } else if (/Tablet|iPad/i.test(userAgent)) {
      this.metrics.deviceType = 'tablet';
    } else {
      this.metrics.deviceType = 'desktop';
    }
  }

  private measureBundlePerformance() {
    // ページロード完了時の測定
    window.addEventListener('load', () => {
      const loadTime =
        performance.timing.loadEventEnd - performance.timing.navigationStart;
      this.metrics.loadTime = loadTime;

      // リソースサイズの測定
      const resources = performance.getEntriesByType('resource');
      const totalSize = resources.reduce((total, resource) => {
        const resourceEntry = resource as PerformanceResourceTiming;
        return total + (resourceEntry.transferSize || 0);
      }, 0);

      this.metrics.bundleSize = totalSize;

      this.generatePerformanceReport();
    });
  }

  private reportMetric(name: string, value: number) {
    // コンソールログ
    console.log(`[PERF] ${name}: ${value.toFixed(2)}ms`);

    // パフォーマンス警告
    const thresholds = {
      FCP: 1800, // 1.8秒
      LCP: 2500, // 2.5秒
      FID: 100, // 100ms
      CLS: 0.1, // 0.1
    };

    const threshold = thresholds[name as keyof typeof thresholds];
    if (threshold && value > threshold) {
      console.warn(
        `[PERF WARNING] ${name} (${value.toFixed(
          2
        )}) exceeds threshold (${threshold})`
      );
    }
  }

  private generatePerformanceReport() {
    const report = {
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      recommendations: this.generateRecommendations(),
    };

    // ローカルストレージに保存（デバッグ用）
    localStorage.setItem('mobile-performance-report', JSON.stringify(report));

    // 本番環境では分析サービスに送信
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics(report);
    }

    return report;
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.metrics.lcp && this.metrics.lcp > 2500) {
      recommendations.push('画像の最適化またはプリロードを検討してください');
    }

    if (this.metrics.fid && this.metrics.fid > 100) {
      recommendations.push('JavaScriptの実行を最適化してください');
    }

    if (this.metrics.bundleSize && this.metrics.bundleSize > 500000) {
      recommendations.push('バンドルサイズの削減を検討してください');
    }

    if (
      this.metrics.networkType === '2g' ||
      this.metrics.networkType === 'slow-2g'
    ) {
      recommendations.push('低速ネットワーク対応の最適化が必要です');
    }

    return recommendations;
  }

  private sendToAnalytics(_report: PerformanceReport) {
    // Google Analytics、Mixpanel等への送信
    // 実装は使用する分析サービスに応じて
    console.log('Analytics data would be sent in production:', _report);
  }

  /**
   * パフォーマンス監視開始
   */
  public static startMonitoring() {
    if (typeof window !== 'undefined') {
      return new MobilePerformanceMonitor();
    }
  }

  /**
   * 現在のメトリクスを取得
   */
  public getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }
}

/**
 * モバイル専用パフォーマンスフック
 */
export function useMobilePerformance() {
  const [monitor, setMonitor] = useState<MobilePerformanceMonitor | null>(null);
  const [metrics, setMetrics] = useState<Partial<PerformanceMetrics>>({});

  useEffect(() => {
    const performanceMonitor = MobilePerformanceMonitor.startMonitoring();
    if (performanceMonitor) {
      setMonitor(performanceMonitor);
    }

    // 定期的にメトリクスを更新
    const interval = setInterval(() => {
      if (performanceMonitor) {
        setMetrics(performanceMonitor.getMetrics());
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return { metrics, monitor };
}
