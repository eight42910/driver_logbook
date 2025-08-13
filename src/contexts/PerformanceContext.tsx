'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import {
  MobilePerformanceMonitor,
  useMobilePerformance,
  type PerformanceMetrics,
} from '@/lib/utils/mobile-performance-monitor';

interface PerformanceLog {
  type: 'page_load' | 'user_action';
  pageName?: string;
  action?: string;
  details?: Record<string, unknown>;
  timestamp: string;
  loadTime?: number;
  actionTime?: number;
  metrics: Partial<PerformanceMetrics>;
}

interface PerformanceReport {
  summary: {
    totalActions: number;
    totalPages: number;
    averageLoadTime: number;
    currentMetrics: Partial<PerformanceMetrics>;
  };
  logs: PerformanceLog[];
  recommendations: string[];
}

/**
 * パフォーマンス監視コンテキスト
 * アプリ全体でパフォーマンス測定を統合管理
 */

interface PerformanceContextType {
  metrics: Partial<PerformanceMetrics>;
  monitor: MobilePerformanceMonitor | null;
  isMonitoring: boolean;
  getPerformanceReport: () => PerformanceReport;
  trackPageLoad: (pageName: string) => void;
  trackUserAction: (action: string, details?: Record<string, unknown>) => void;
}

const PerformanceContext = createContext<PerformanceContextType | undefined>(
  undefined
);

interface PerformanceProviderProps {
  children: ReactNode;
  enableInProduction?: boolean;
}

export function PerformanceProvider({
  children,
  enableInProduction = false,
}: PerformanceProviderProps) {
  const { metrics, monitor } = useMobilePerformance();
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [performanceLog, setPerformanceLog] = useState<PerformanceLog[]>([]);

  useEffect(() => {
    // 開発環境または本番で有効化されている場合のみ監視開始
    const shouldMonitor =
      process.env.NODE_ENV === 'development' || enableInProduction;

    if (shouldMonitor && !isMonitoring) {
      setIsMonitoring(true);
      console.log('🚀 [Performance Monitor] 監視を開始しました');
    }
  }, [isMonitoring, enableInProduction]);

  const trackPageLoad = (pageName: string) => {
    if (!isMonitoring) return;

    const timestamp = new Date().toISOString();
    const loadTime = performance.now();

    const logEntry: PerformanceLog = {
      type: 'page_load',
      pageName,
      timestamp,
      loadTime,
      metrics: { ...metrics },
    };

    setPerformanceLog((prev) => [...prev, logEntry]);

    console.log(`📊 [Page Load] ${pageName}: ${loadTime.toFixed(2)}ms`);

    // 警告しきい値チェック
    if (loadTime > 3000) {
      console.warn(
        `⚠️ [Performance Warning] ${pageName} の読み込みが遅いです (${loadTime.toFixed(
          2
        )}ms)`
      );
    }
  };

  const trackUserAction = (
    action: string,
    details?: Record<string, unknown>
  ) => {
    if (!isMonitoring) return;

    const timestamp = new Date().toISOString();
    const actionTime = performance.now();

    const logEntry: PerformanceLog = {
      type: 'user_action',
      action,
      details,
      timestamp,
      actionTime,
      metrics: { ...metrics },
    };

    setPerformanceLog((prev) => [...prev, logEntry]);

    console.log(`👆 [User Action] ${action}`, details);
  };

  const getPerformanceReport = () => {
    return {
      summary: {
        totalActions: performanceLog.filter((log) => log.type === 'user_action')
          .length,
        totalPages: performanceLog.filter((log) => log.type === 'page_load')
          .length,
        averageLoadTime: performanceLog
          .filter(
            (log) => log.type === 'page_load' && log.loadTime !== undefined
          )
          .reduce(
            (acc, log, _, arr) => acc + (log.loadTime || 0) / arr.length,
            0
          ),
        currentMetrics: metrics,
      },
      logs: performanceLog,
      recommendations: generateRecommendations(),
    };
  };

  const generateRecommendations = () => {
    const recommendations: string[] = [];

    const pageLoads = performanceLog.filter((log) => log.type === 'page_load');
    const slowPages = pageLoads.filter(
      (log) => log.loadTime && log.loadTime > 2000
    );

    if (slowPages.length > 0) {
      recommendations.push(
        `${slowPages.length}個のページで読み込み時間が2秒を超えています`
      );
    }

    if (metrics.lcp && metrics.lcp > 2500) {
      recommendations.push('LCP (Largest Contentful Paint) の改善が必要です');
    }

    if (metrics.cls && metrics.cls > 0.1) {
      recommendations.push('CLS (Cumulative Layout Shift) の改善が必要です');
    }

    if (metrics.networkType === 'slow-2g' || metrics.networkType === '2g') {
      recommendations.push('低速ネットワーク用の最適化を検討してください');
    }

    return recommendations;
  };

  const value: PerformanceContextType = {
    metrics,
    monitor,
    isMonitoring,
    getPerformanceReport,
    trackPageLoad,
    trackUserAction,
  };

  return (
    <PerformanceContext.Provider value={value}>
      {children}
      {/* 開発環境でのパフォーマンスオーバーレイ */}
      {process.env.NODE_ENV === 'development' && isMonitoring && (
        <PerformanceDevOverlay />
      )}
    </PerformanceContext.Provider>
  );
}

/**
 * パフォーマンスコンテキストを使用するフック
 */
export function usePerformance() {
  const context = useContext(PerformanceContext);
  if (context === undefined) {
    throw new Error('usePerformance must be used within a PerformanceProvider');
  }
  return context;
}

/**
 * ページ読み込み自動トラッキングフック
 */
export function usePageLoadTracking(pageName: string) {
  const { trackPageLoad, isMonitoring } = usePerformance();

  useEffect(() => {
    if (isMonitoring) {
      trackPageLoad(pageName);
    }
  }, [pageName, trackPageLoad, isMonitoring]);
}

/**
 * 開発者向けパフォーマンスオーバーレイ
 */
function PerformanceDevOverlay() {
  const { metrics, getPerformanceReport } = usePerformance();
  const [isVisible, setIsVisible] = useState(false);
  const [report, setReport] = useState<PerformanceReport | null>(null);

  const toggleOverlay = () => {
    setIsVisible(!isVisible);
    if (!isVisible) {
      setReport(getPerformanceReport());
    }
  };

  return (
    <>
      {/* トグルボタン */}
      <button
        onClick={toggleOverlay}
        className="fixed top-4 left-4 z-50 bg-purple-600 text-white p-2 rounded-full text-xs font-bold shadow-lg hover:bg-purple-700 transition-colors"
        title="パフォーマンス情報を表示"
      >
        📊
      </button>

      {/* オーバーレイ */}
      {isVisible && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">パフォーマンス情報</h3>
              <button
                onClick={() => setIsVisible(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {/* リアルタイムメトリクス */}
            <div className="mb-6">
              <h4 className="font-semibold mb-2">リアルタイムメトリクス</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">FCP:</span>
                  <span
                    className={
                      metrics.fcp && metrics.fcp > 1800
                        ? 'text-red-600'
                        : 'text-green-600'
                    }
                  >
                    {metrics.fcp ? `${metrics.fcp.toFixed(0)}ms` : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">LCP:</span>
                  <span
                    className={
                      metrics.lcp && metrics.lcp > 2500
                        ? 'text-red-600'
                        : 'text-green-600'
                    }
                  >
                    {metrics.lcp ? `${metrics.lcp.toFixed(0)}ms` : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Network:</span>
                  <span className="text-blue-600">
                    {metrics.networkType || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Device:</span>
                  <span className="text-blue-600">
                    {metrics.deviceType || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* レポート */}
            {report && (
              <div>
                <h4 className="font-semibold mb-2">セッション統計</h4>
                <div className="bg-gray-50 p-3 rounded text-sm">
                  <p>ページ読み込み: {report.summary.totalPages}回</p>
                  <p>ユーザーアクション: {report.summary.totalActions}回</p>
                  <p>
                    平均読み込み時間:{' '}
                    {report.summary.averageLoadTime.toFixed(0)}ms
                  </p>
                </div>

                {report.recommendations.length > 0 && (
                  <div className="mt-4">
                    <h5 className="font-semibold mb-2 text-orange-600">
                      推奨事項
                    </h5>
                    <ul className="text-sm text-orange-700 space-y-1">
                      {report.recommendations.map((rec: string, i: number) => (
                        <li key={i}>• {rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* 詳細ログボタン */}
            <button
              onClick={() => {
                console.table(report?.logs || []);
                console.log('📊 Full Performance Report:', report);
              }}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              詳細ログをコンソールに出力
            </button>
          </div>
        </div>
      )}
    </>
  );
}
