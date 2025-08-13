'use client';

/**
 * スマートプリロード戦略
 * ユーザーの行動パターンを学習し、次に必要なリソースを予測してプリロードする
 */

// ユーザーナビゲーション履歴の型定義
interface NavigationRecord {
  id: string;
  fromPath: string;
  toPath: string;
  timestamp: number;
  duration: number; // 滞在時間（ms）
  deviceType: 'mobile' | 'tablet' | 'desktop';
  networkType?: string;
}

// プリロード対象リソースの型定義
interface PreloadResource {
  url: string;
  type: 'route' | 'image' | 'css' | 'js' | 'font';
  priority: 'high' | 'medium' | 'low';
  size?: number; // バイト数
  lastUsed: number;
}

// ナビゲーションパターンの型定義
interface NavigationPattern {
  fromPath: string;
  toPath: string;
  confidence: number; // 0-1の確信度
  averageDuration: number;
  frequency: number;
  lastSeen: number;
}

// ネットワーク条件の型定義
interface NetworkConditions {
  effectiveType: '2g' | '3g' | '4g' | 'slow-2g';
  downlink: number; // Mbps
  rtt: number; // ms
  saveData: boolean;
}

export class SmartPreloadStrategy {
  private patterns: Map<string, NavigationPattern> = new Map();
  private navigationHistory: NavigationRecord[] = [];
  private preloadedResources: Set<string> = new Set();
  private resourceRegistry: Map<string, PreloadResource> = new Map();
  private maxHistorySize = 1000;
  private minConfidenceThreshold = 0.3;
  private storageKey = 'smart-preload-data';

  constructor() {
    this.loadPersistedData();
    this.initializeDefaultPatterns();
    this.startPeriodicCleanup();
  }

  /**
   * ナビゲーション記録を追加し、パターンを学習
   */
  recordNavigation(fromPath: string, toPath: string, duration: number): void {
    const record: NavigationRecord = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fromPath,
      toPath,
      timestamp: Date.now(),
      duration,
      deviceType: this.detectDeviceType(),
      networkType: this.getNetworkType(),
    };

    this.navigationHistory.push(record);
    this.updatePatterns(record);
    this.triggerIntelligentPreload(toPath);
    
    // 履歴サイズを制限
    if (this.navigationHistory.length > this.maxHistorySize) {
      this.navigationHistory = this.navigationHistory.slice(-this.maxHistorySize);
    }

    this.persistData();
  }

  /**
   * 現在のページから次に訪問しそうなリソースをプリロード
   */
  preloadForCurrentPage(currentPath: string): void {
    const predictions = this.predictNextPages(currentPath);
    const networkConditions = this.getNetworkConditions();
    
    // ネットワーク条件に基づいてプリロード戦略を調整
    const shouldPreload = this.shouldPreloadBasedOnNetwork(networkConditions);
    if (!shouldPreload) {
      console.log('Network conditions not suitable for preloading');
      return;
    }

    predictions.forEach(prediction => {
      if (prediction.confidence >= this.minConfidenceThreshold) {
        this.preloadRoute(prediction.toPath, prediction.confidence);
      }
    });

    // 関連リソースもプリロード
    this.preloadRelatedResources(currentPath, networkConditions);
  }

  /**
   * 特定ルートのプリロード実行
   */
  private preloadRoute(path: string, confidence: number): void {
    if (this.preloadedResources.has(path)) {
      return; // 既にプリロード済み
    }

    // Next.js のルートプリロード
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        this.executeRoutePreload(path, confidence);
      });
    } else {
      setTimeout(() => {
        this.executeRoutePreload(path, confidence);
      }, 100);
    }
  }

  /**
   * 実際のルートプリロード実行
   */
  private executeRoutePreload(path: string, confidence: number): void {
    try {
      // Next.js Router prefetch
      if (typeof window !== 'undefined') {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = path;
        link.setAttribute('data-confidence', confidence.toString());
        document.head.appendChild(link);

        this.preloadedResources.add(path);
        
        console.log(`Preloaded route: ${path} (confidence: ${confidence.toFixed(2)})`);
        
        // 10分後にリンクを削除
        setTimeout(() => {
          if (link.parentNode) {
            link.parentNode.removeChild(link);
            this.preloadedResources.delete(path);
          }
        }, 600000);
      }
    } catch (error) {
      console.warn(`Failed to preload route ${path}:`, error);
    }
  }

  /**
   * 関連リソースのプリロード
   */
  private preloadRelatedResources(currentPath: string, networkConditions: NetworkConditions): void {
    const resources = this.getRelatedResources(currentPath);
    
    resources.forEach(resource => {
      if (this.shouldPreloadResource(resource, networkConditions)) {
        this.preloadResource(resource);
      }
    });
  }

  /**
   * リソースプリロードの実行
   */
  private preloadResource(resource: PreloadResource): void {
    if (this.preloadedResources.has(resource.url)) {
      return;
    }

    try {
      const link = document.createElement('link');
      
      switch (resource.type) {
        case 'image':
          link.rel = 'preload';
          link.as = 'image';
          break;
        case 'css':
          link.rel = 'preload';
          link.as = 'style';
          break;
        case 'js':
          link.rel = 'preload';
          link.as = 'script';
          break;
        case 'font':
          link.rel = 'preload';
          link.as = 'font';
          link.crossOrigin = 'anonymous';
          break;
        default:
          link.rel = 'prefetch';
      }
      
      link.href = resource.url;
      document.head.appendChild(link);
      this.preloadedResources.add(resource.url);
      
      console.log(`Preloaded ${resource.type}: ${resource.url}`);
    } catch (error) {
      console.warn(`Failed to preload resource ${resource.url}:`, error);
    }
  }

  /**
   * 次のページを予測
   */
  private predictNextPages(currentPath: string): NavigationPattern[] {
    const relevantPatterns = Array.from(this.patterns.values())
      .filter(pattern => pattern.fromPath === currentPath)
      .sort((a, b) => b.confidence - a.confidence);

    return relevantPatterns.slice(0, 3); // 上位3つの予測
  }

  /**
   * パターン学習の更新
   */
  private updatePatterns(record: NavigationRecord): void {
    const patternKey = `${record.fromPath}→${record.toPath}`;
    const existing = this.patterns.get(patternKey);

    if (existing) {
      // 既存パターンの更新
      existing.frequency += 1;
      existing.averageDuration = (existing.averageDuration + record.duration) / 2;
      existing.lastSeen = record.timestamp;
      existing.confidence = this.calculateConfidence(existing);
    } else {
      // 新規パターンの作成
      const newPattern: NavigationPattern = {
        fromPath: record.fromPath,
        toPath: record.toPath,
        confidence: 0.1, // 初期値
        averageDuration: record.duration,
        frequency: 1,
        lastSeen: record.timestamp,
      };
      newPattern.confidence = this.calculateConfidence(newPattern);
      this.patterns.set(patternKey, newPattern);
    }
  }

  /**
   * 確信度の計算
   */
  private calculateConfidence(pattern: NavigationPattern): number {
    const timeFactor = this.calculateTimeFactor(pattern.lastSeen);
    const frequencyFactor = Math.min(pattern.frequency / 10, 1); // 10回で最大
    const durationFactor = this.calculateDurationFactor(pattern.averageDuration);
    
    return (frequencyFactor * 0.5) + (timeFactor * 0.3) + (durationFactor * 0.2);
  }

  /**
   * 時間による減衰計算
   */
  private calculateTimeFactor(lastSeen: number): number {
    const daysSinceLastSeen = (Date.now() - lastSeen) / (1000 * 60 * 60 * 24);
    return Math.max(0, 1 - (daysSinceLastSeen / 30)); // 30日で0に
  }

  /**
   * 滞在時間による重み計算
   */
  private calculateDurationFactor(duration: number): number {
    // 3秒以上の滞在は有意義とみなす
    if (duration < 3000) return 0.1;
    if (duration < 10000) return 0.5;
    if (duration < 30000) return 0.8;
    return 1.0;
  }

  /**
   * ネットワーク条件の取得
   */
  private getNetworkConditions(): NetworkConditions {
    const defaultConditions: NetworkConditions = {
      effectiveType: '4g',
      downlink: 10,
      rtt: 100,
      saveData: false,
    };

    if (typeof navigator === 'undefined') {
      return defaultConditions;
    }

    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    if (connection) {
      return {
        effectiveType: connection.effectiveType || '4g',
        downlink: connection.downlink || 10,
        rtt: connection.rtt || 100,
        saveData: connection.saveData || false,
      };
    }

    return defaultConditions;
  }

  /**
   * ネットワーク条件に基づくプリロード判定
   */
  private shouldPreloadBasedOnNetwork(conditions: NetworkConditions): boolean {
    // データセーバーモードの場合はプリロードしない
    if (conditions.saveData) {
      return false;
    }

    // 低速ネットワークの場合は制限的
    if (conditions.effectiveType === 'slow-2g' || conditions.effectiveType === '2g') {
      return false;
    }

    // 3Gの場合は高信頼度のみ
    if (conditions.effectiveType === '3g') {
      this.minConfidenceThreshold = 0.7;
    } else {
      this.minConfidenceThreshold = 0.3;
    }

    return true;
  }

  /**
   * リソースプリロード判定
   */
  private shouldPreloadResource(resource: PreloadResource, conditions: NetworkConditions): boolean {
    // ファイルサイズ制限
    const maxSize = this.getMaxResourceSize(conditions);
    if (resource.size && resource.size > maxSize) {
      return false;
    }

    // 最近使用されたリソースを優先
    const daysSinceUsed = (Date.now() - resource.lastUsed) / (1000 * 60 * 60 * 24);
    if (daysSinceUsed > 7) {
      return false;
    }

    return true;
  }

  /**
   * ネットワーク条件に基づく最大リソースサイズ
   */
  private getMaxResourceSize(conditions: NetworkConditions): number {
    switch (conditions.effectiveType) {
      case '4g':
        return 1024 * 1024 * 2; // 2MB
      case '3g':
        return 1024 * 512; // 512KB
      case '2g':
      case 'slow-2g':
        return 1024 * 100; // 100KB
      default:
        return 1024 * 1024; // 1MB
    }
  }

  /**
   * 関連リソースの取得
   */
  private getRelatedResources(currentPath: string): PreloadResource[] {
    // パスに基づいて関連するリソースを特定
    const resources: PreloadResource[] = [];

    // 共通フォント
    resources.push({
      url: 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap',
      type: 'font',
      priority: 'high',
      lastUsed: Date.now(),
    });

    // ページ固有のリソース
    switch (currentPath) {
      case '/dashboard':
        resources.push({
          url: '/api/daily-reports/recent',
          type: 'js',
          priority: 'high',
          lastUsed: Date.now(),
        });
        break;
      case '/reports':
        resources.push({
          url: '/api/daily-reports',
          type: 'js',
          priority: 'medium',
          lastUsed: Date.now(),
        });
        break;
      case '/reports/monthly':
        resources.push({
          url: '/api/daily-reports/monthly',
          type: 'js',
          priority: 'medium',
          lastUsed: Date.now(),
        });
        break;
    }

    return resources.filter(resource => !this.preloadedResources.has(resource.url));
  }

  /**
   * デバイスタイプの検出
   */
  private detectDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    if (typeof window === 'undefined') return 'desktop';
    
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  /**
   * ネットワークタイプの取得
   */
  private getNetworkType(): string {
    if (typeof navigator === 'undefined') return 'unknown';
    
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    return connection?.effectiveType || 'unknown';
  }

  /**
   * デフォルトパターンの初期化
   */
  private initializeDefaultPatterns(): void {
    // よくある遷移パターンを事前定義
    const defaultPatterns = [
      { from: '/dashboard', to: '/reports', confidence: 0.6 },
      { from: '/reports', to: '/reports/monthly', confidence: 0.4 },
      { from: '/dashboard', to: '/reports/list', confidence: 0.3 },
      { from: '/reports/list', to: '/reports/edit', confidence: 0.5 },
    ];

    defaultPatterns.forEach(pattern => {
      const patternKey = `${pattern.from}→${pattern.to}`;
      if (!this.patterns.has(patternKey)) {
        this.patterns.set(patternKey, {
          fromPath: pattern.from,
          toPath: pattern.to,
          confidence: pattern.confidence,
          averageDuration: 15000, // 15秒のデフォルト
          frequency: 1,
          lastSeen: Date.now(),
        });
      }
    });
  }

  /**
   * データの永続化
   */
  private persistData(): void {
    try {
      const data = {
        patterns: Array.from(this.patterns.entries()),
        navigationHistory: this.navigationHistory.slice(-100), // 最新100件のみ保存
        timestamp: Date.now(),
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to persist preload data:', error);
    }
  }

  /**
   * 永続化データの読み込み
   */
  private loadPersistedData(): void {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        
        // データの有効性チェック（7日以内）
        if (Date.now() - parsed.timestamp < 7 * 24 * 60 * 60 * 1000) {
          this.patterns = new Map(parsed.patterns);
          this.navigationHistory = parsed.navigationHistory || [];
        }
      }
    } catch (error) {
      console.warn('Failed to load persisted preload data:', error);
    }
  }

  /**
   * 定期的なクリーンアップ
   */
  private startPeriodicCleanup(): void {
    setInterval(() => {
      this.cleanupOldPatterns();
      this.cleanupOldResources();
    }, 60 * 60 * 1000); // 1時間ごと
  }

  /**
   * 古いパターンのクリーンアップ
   */
  private cleanupOldPatterns(): void {
    const cutoffTime = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30日前
    
    for (const [key, pattern] of this.patterns.entries()) {
      if (pattern.lastSeen < cutoffTime || pattern.confidence < 0.1) {
        this.patterns.delete(key);
      }
    }
  }

  /**
   * 古いリソースのクリーンアップ
   */
  private cleanupOldResources(): void {
    // プリロードされたリソースの参照をクリア
    this.preloadedResources.clear();
    
    // 古いリンクタグを削除
    const preloadLinks = document.querySelectorAll('link[rel="prefetch"], link[rel="preload"]');
    preloadLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href && !this.isRecentlyUsed(href)) {
        link.remove();
      }
    });
  }

  /**
   * 最近使用されたかチェック
   */
  private isRecentlyUsed(url: string): boolean {
    const recentThreshold = Date.now() - (10 * 60 * 1000); // 10分以内
    return this.navigationHistory.some(record => 
      record.timestamp > recentThreshold && 
      (record.fromPath.includes(url) || record.toPath.includes(url))
    );
  }

  /**
   * パフォーマンス統計の取得
   */
  getPerformanceStats() {
    return {
      totalPatterns: this.patterns.size,
      totalHistory: this.navigationHistory.length,
      preloadedResources: this.preloadedResources.size,
      averageConfidence: Array.from(this.patterns.values())
        .reduce((sum, pattern) => sum + pattern.confidence, 0) / this.patterns.size,
      mostFrequentPatterns: Array.from(this.patterns.values())
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 5),
    };
  }
}

// シングルトンインスタンス
export const smartPreloadStrategy = new SmartPreloadStrategy();
