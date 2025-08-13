'use client';

/**
 * ネットワーク最適化機能
 * 低速接続時の軽量モード、画像最適化、アセット圧縮など
 */

// ネットワーク状態の型定義
export interface NetworkStatus {
  effectiveType: '2g' | '3g' | '4g' | 'slow-2g' | 'unknown';
  downlink: number; // Mbps
  rtt: number; // Round Trip Time (ms)
  saveData: boolean;
  isOnline: boolean;
  isLowData: boolean;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'offline';
}

// 最適化設定の型定義
export interface OptimizationConfig {
  enableLightMode: boolean;
  enableImageOptimization: boolean;
  enableAssetCompression: boolean;
  enableOfflineMode: boolean;
  imageQuality: number; // 0-100
  maxImageSize: number; // KB
  preloadStrategy: 'aggressive' | 'balanced' | 'conservative' | 'disabled';
}

// 画像最適化設定の型定義
export interface ImageOptimizationSettings {
  format: 'webp' | 'avif' | 'jpeg' | 'png' | 'auto';
  quality: number;
  sizes: string;
  loading: 'eager' | 'lazy';
  priority: boolean;
}

// リソース最適化の統計
export interface OptimizationStats {
  originalSize: number;
  optimizedSize: number;
  savedBytes: number;
  savedPercentage: number;
  loadTime: number;
  networkType: string;
}

export class NetworkOptimizer {
  private config: OptimizationConfig;
  private stats: Map<string, OptimizationStats> = new Map();
  private isLightModeActive = false;
  private networkStatus: NetworkStatus;
  private listeners: Array<(status: NetworkStatus) => void> = [];

  constructor(config: Partial<OptimizationConfig> = {}) {
    this.config = {
      enableLightMode: true,
      enableImageOptimization: true,
      enableAssetCompression: true,
      enableOfflineMode: false,
      imageQuality: 80,
      maxImageSize: 500, // KB
      preloadStrategy: 'balanced',
      ...config,
    };

    this.networkStatus = this.getCurrentNetworkStatus();
    this.initializeNetworkMonitoring();
    this.applyOptimizations();
  }

  /**
   * 現在のネットワーク状態を取得
   */
  private getCurrentNetworkStatus(): NetworkStatus {
    const defaultStatus: NetworkStatus = {
      effectiveType: '4g',
      downlink: 10,
      rtt: 100,
      saveData: false,
      isOnline: navigator.onLine,
      isLowData: false,
      connectionQuality: 'good',
    };

    if (typeof navigator === 'undefined') {
      return defaultStatus;
    }

    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;

    if (!connection) {
      return {
        ...defaultStatus,
        isOnline: navigator.onLine,
      };
    }

    const status: NetworkStatus = {
      effectiveType: connection.effectiveType || '4g',
      downlink: connection.downlink || 10,
      rtt: connection.rtt || 100,
      saveData: connection.saveData || false,
      isOnline: navigator.onLine,
      isLowData: connection.saveData || connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g',
      connectionQuality: this.calculateConnectionQuality(connection),
    };

    return status;
  }

  /**
   * 接続品質の計算
   */
  private calculateConnectionQuality(connection: any): NetworkStatus['connectionQuality'] {
    if (!navigator.onLine) return 'offline';

    const effectiveType = connection.effectiveType;
    const downlink = connection.downlink || 0;
    const rtt = connection.rtt || 1000;

    if (effectiveType === '4g' && downlink > 5 && rtt < 200) {
      return 'excellent';
    } else if (effectiveType === '4g' && downlink > 2) {
      return 'good';
    } else if (effectiveType === '3g') {
      return 'fair';
    } else {
      return 'poor';
    }
  }

  /**
   * ネットワーク監視の初期化
   */
  private initializeNetworkMonitoring(): void {
    // オンライン/オフライン状態の監視
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleNetworkChange.bind(this));
      window.addEventListener('offline', this.handleNetworkChange.bind(this));
    }

    // ネットワーク状態変化の監視
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', this.handleNetworkChange.bind(this));
    }

    // 定期的なネットワーク品質チェック
    setInterval(() => {
      this.measureNetworkQuality();
    }, 30000); // 30秒ごと
  }

  /**
   * ネットワーク変化の処理
   */
  private handleNetworkChange(): void {
    const previousStatus = { ...this.networkStatus };
    this.networkStatus = this.getCurrentNetworkStatus();

    // 状態が変化した場合の処理
    if (this.hasSignificantChange(previousStatus, this.networkStatus)) {
      this.applyOptimizations();
      this.notifyListeners();
      console.log('Network status changed:', this.networkStatus);
    }
  }

  /**
   * 重要な変化があったかチェック
   */
  private hasSignificantChange(prev: NetworkStatus, current: NetworkStatus): boolean {
    return (
      prev.effectiveType !== current.effectiveType ||
      prev.isOnline !== current.isOnline ||
      prev.saveData !== current.saveData ||
      Math.abs(prev.downlink - current.downlink) > 2
    );
  }

  /**
   * ネットワーク品質の測定
   */
  private async measureNetworkQuality(): Promise<void> {
    if (!navigator.onLine) return;

    try {
      const startTime = performance.now();
      const response = await fetch('/api/ping', { 
        method: 'HEAD',
        cache: 'no-cache' 
      });
      const endTime = performance.now();
      const rtt = endTime - startTime;

      // RTTに基づいて接続品質を更新
      if (rtt < 100) {
        this.networkStatus.connectionQuality = 'excellent';
      } else if (rtt < 300) {
        this.networkStatus.connectionQuality = 'good';
      } else if (rtt < 800) {
        this.networkStatus.connectionQuality = 'fair';
      } else {
        this.networkStatus.connectionQuality = 'poor';
      }

      this.networkStatus.rtt = rtt;
    } catch (error) {
      console.warn('Network quality measurement failed:', error);
      this.networkStatus.connectionQuality = 'poor';
    }
  }

  /**
   * 最適化の適用
   */
  private applyOptimizations(): void {
    if (this.shouldActivateLightMode()) {
      this.activateLightMode();
    } else {
      this.deactivateLightMode();
    }

    this.updateImageOptimization();
    this.updatePreloadStrategy();
  }

  /**
   * 軽量モードを有効にするべきかチェック
   */
  private shouldActivateLightMode(): boolean {
    if (!this.config.enableLightMode) return false;

    return (
      this.networkStatus.saveData ||
      this.networkStatus.effectiveType === 'slow-2g' ||
      this.networkStatus.effectiveType === '2g' ||
      this.networkStatus.connectionQuality === 'poor' ||
      this.networkStatus.downlink < 1
    );
  }

  /**
   * 軽量モードの有効化
   */
  private activateLightMode(): void {
    if (this.isLightModeActive) return;
    if (typeof document === 'undefined') return;

    this.isLightModeActive = true;
    document.documentElement.setAttribute('data-light-mode', 'true');

    // 軽量モード用のCSSクラスを追加
    document.body.classList.add('light-mode');

    // 不要なアニメーションを無効化
    this.disableAnimations();

    // 画像読み込みを遅延
    this.enableAggressiveLazyLoading();

    console.log('Light mode activated for better performance');
  }

  /**
   * 軽量モードの無効化
   */
  private deactivateLightMode(): void {
    if (!this.isLightModeActive) return;
    if (typeof document === 'undefined') return;

    this.isLightModeActive = false;
    document.documentElement.removeAttribute('data-light-mode');
    document.body.classList.remove('light-mode');

    this.enableAnimations();
    this.disableAggressiveLazyLoading();

    console.log('Light mode deactivated');
  }

  /**
   * アニメーションの無効化
   */
  private disableAnimations(): void {
    if (typeof document === 'undefined') return;
    
    const style = document.createElement('style');
    style.id = 'light-mode-animations';
    style.textContent = `
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * アニメーションの有効化
   */
  private enableAnimations(): void {
    if (typeof document === 'undefined') return;
    
    const style = document.getElementById('light-mode-animations');
    if (style) {
      style.remove();
    }
  }

  /**
   * 積極的な遅延読み込みの有効化
   */
  private enableAggressiveLazyLoading(): void {
    if (typeof document === 'undefined') return;
    
    const images = document.querySelectorAll('img[loading="eager"]');
    images.forEach(img => {
      img.setAttribute('loading', 'lazy');
    });
  }

  /**
   * 積極的な遅延読み込みの無効化
   */
  private disableAggressiveLazyLoading(): void {
    if (typeof document === 'undefined') return;
    
    const images = document.querySelectorAll('img[data-priority="true"]');
    images.forEach(img => {
      img.setAttribute('loading', 'eager');
    });
  }

  /**
   * 画像最適化の更新
   */
  private updateImageOptimization(): void {
    if (!this.config.enableImageOptimization) return;

    const quality = this.getOptimalImageQuality();
    const format = this.getOptimalImageFormat();

    // 既存の画像要素を更新
    this.optimizeExistingImages(quality, format);
  }

  /**
   * 最適な画像品質を取得
   */
  private getOptimalImageQuality(): number {
    switch (this.networkStatus.connectionQuality) {
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

  /**
   * 最適な画像形式を取得
   */
  private getOptimalImageFormat(): string {
    if (this.networkStatus.isLowData) {
      return 'webp'; // 軽量
    }
    
    // ブラウザサポートチェック
    if (this.supportsFormat('avif')) {
      return 'avif';
    } else if (this.supportsFormat('webp')) {
      return 'webp';
    } else {
      return 'jpeg';
    }
  }

  /**
   * 画像形式のサポートチェック
   */
  private supportsFormat(format: string): boolean {
    if (typeof document === 'undefined') return false;
    
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL(`image/${format}`).indexOf(`data:image/${format}`) === 0;
  }

  /**
   * 既存画像の最適化
   */
  private optimizeExistingImages(quality: number, format: string): void {
    if (typeof document === 'undefined') return;
    
    const images = document.querySelectorAll('img[data-optimizable="true"]');
    
    images.forEach((img: Element) => {
      const imgElement = img as HTMLImageElement;
      const src = imgElement.src;
      
      if (src && !src.includes('optimized=true')) {
        const optimizedSrc = this.generateOptimizedImageUrl(src, quality, format);
        imgElement.src = optimizedSrc;
      }
    });
  }

  /**
   * 最適化された画像URLの生成
   */
  private generateOptimizedImageUrl(originalSrc: string, quality: number, format: string): string {
    // Next.js Image Optimization APIを使用
    if (typeof window === 'undefined') {
      return originalSrc; // SSR時は元のURLを返す
    }
    const url = new URL('/_next/image', window.location.origin);
    url.searchParams.set('url', originalSrc);
    url.searchParams.set('q', quality.toString());
    url.searchParams.set('w', '800'); // デフォルト幅
    url.searchParams.set('optimized', 'true');
    
    return url.toString();
  }

  /**
   * プリロード戦略の更新
   */
  private updatePreloadStrategy(): void {
    const strategy = this.getOptimalPreloadStrategy();
    
    // 戦略に基づいてリソースのプリロードを調整
    this.adjustResourcePreloading(strategy);
  }

  /**
   * 最適なプリロード戦略を取得
   */
  private getOptimalPreloadStrategy(): OptimizationConfig['preloadStrategy'] {
    if (this.networkStatus.saveData || this.networkStatus.connectionQuality === 'poor') {
      return 'disabled';
    } else if (this.networkStatus.connectionQuality === 'fair') {
      return 'conservative';
    } else if (this.networkStatus.connectionQuality === 'good') {
      return 'balanced';
    } else {
      return 'aggressive';
    }
  }

  /**
   * リソースプリロードの調整
   */
  private adjustResourcePreloading(strategy: OptimizationConfig['preloadStrategy']): void {
    if (typeof document === 'undefined') return;
    
    const preloadLinks = document.querySelectorAll('link[rel="preload"], link[rel="prefetch"]');
    
    preloadLinks.forEach(link => {
      const linkElement = link as HTMLLinkElement;
      
      switch (strategy) {
        case 'disabled':
          linkElement.remove();
          break;
        case 'conservative':
          if (linkElement.getAttribute('data-priority') !== 'high') {
            linkElement.remove();
          }
          break;
        case 'balanced':
          if (linkElement.getAttribute('data-priority') === 'low') {
            linkElement.remove();
          }
          break;
        case 'aggressive':
          // すべてのプリロードを維持
          break;
      }
    });
  }

  /**
   * オフラインモードの切り替え
   */
  public toggleOfflineMode(enabled: boolean): void {
    if (enabled && 'serviceWorker' in navigator) {
      this.enableOfflineMode();
    } else {
      this.disableOfflineMode();
    }
  }

  /**
   * オフラインモードの有効化
   */
  private async enableOfflineMode(): Promise<void> {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  /**
   * オフラインモードの無効化
   */
  private async disableOfflineMode(): Promise<void> {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
      console.log('Service Workers unregistered');
    } catch (error) {
      console.error('Service Worker unregistration failed:', error);
    }
  }

  /**
   * 最適化統計の記録
   */
  public recordOptimization(resourceUrl: string, originalSize: number, optimizedSize: number, loadTime: number): void {
    const savedBytes = originalSize - optimizedSize;
    const savedPercentage = (savedBytes / originalSize) * 100;

    const stats: OptimizationStats = {
      originalSize,
      optimizedSize,
      savedBytes,
      savedPercentage,
      loadTime,
      networkType: this.networkStatus.effectiveType,
    };

    this.stats.set(resourceUrl, stats);
  }

  /**
   * ネットワーク状態変化のリスナー登録
   */
  public onNetworkChange(callback: (status: NetworkStatus) => void): void {
    this.listeners.push(callback);
  }

  /**
   * リスナーへの通知
   */
  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback(this.networkStatus);
      } catch (error) {
        console.error('Network status listener error:', error);
      }
    });
  }

  /**
   * 現在のネットワーク状態を取得
   */
  public getNetworkStatus(): NetworkStatus {
    return { ...this.networkStatus };
  }

  /**
   * 軽量モードの状態を取得
   */
  public getLightModeStatus(): boolean {
    return this.isLightModeActive;
  }

  /**
   * 最適化統計を取得
   */
  public getOptimizationStats(): Map<string, OptimizationStats> {
    return new Map(this.stats);
  }

  /**
   * 設定の更新
   */
  public updateConfig(newConfig: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.applyOptimizations();
  }

  /**
   * リソースのクリーンアップ
   */
  public destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleNetworkChange.bind(this));
      window.removeEventListener('offline', this.handleNetworkChange.bind(this));
    }
    
    const connection = (navigator as any).connection;
    if (connection) {
      connection.removeEventListener('change', this.handleNetworkChange.bind(this));
    }

    this.listeners = [];
    this.stats.clear();
  }
}

// シングルトンインスタンス
export const networkOptimizer = new NetworkOptimizer();
