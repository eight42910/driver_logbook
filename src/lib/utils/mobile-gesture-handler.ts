'use client';

/**
 * モバイルジェスチャーハンドリング
 * スワイプナビゲーション、ピンチ防止、100vh問題解決など
 */

// ジェスチャー設定の型定義
interface GestureConfig {
  enableSwipeNavigation: boolean;
  enablePinchPrevention: boolean;
  enablePullToRefresh: boolean;
  swipeThreshold: number; // スワイプとして認識する最小距離（px）
  velocityThreshold: number; // 最小速度（px/ms）
  maxSwipeTime: number; // 最大スワイプ時間（ms）
}

// タッチイベントの型定義
interface TouchPoint {
  x: number;
  y: number;
  time: number;
}

// スワイプ方向の型定義
type SwipeDirection = 'left' | 'right' | 'up' | 'down';

// ページナビゲーション情報
interface PageNavigation {
  currentPath: string;
  previousPath?: string;
  nextPath?: string;
  canGoBack: boolean;
  canGoForward: boolean;
}

// ジェスチャーイベントの型定義
interface GestureEvent {
  type: 'swipe' | 'pinch' | 'tap' | 'longPress';
  direction?: SwipeDirection;
  distance?: number;
  velocity?: number;
  scale?: number;
  touches: TouchPoint[];
  preventDefault: () => void;
  stopPropagation: () => void;
}

// ジェスチャーハンドラーのコールバック型
type GestureHandler = (event: GestureEvent) => void;

export class MobileGestureHandler {
  private config: GestureConfig;
  private startTouch: TouchPoint | null = null;
  private currentTouches: TouchPoint[] = [];
  private isSwipeEnabled = true;
  private isPinchActive = false;
  private swipeHandlers: Map<SwipeDirection, GestureHandler[]> = new Map();
  private otherHandlers: Map<string, GestureHandler[]> = new Map();
  private navigationInfo: PageNavigation;
  private element: HTMLElement;

  constructor(element: HTMLElement, config: Partial<GestureConfig> = {}) {
    this.element = element;
    this.config = {
      enableSwipeNavigation: true,
      enablePinchPrevention: true,
      enablePullToRefresh: false,
      swipeThreshold: 50,
      velocityThreshold: 0.3,
      maxSwipeTime: 500,
      ...config,
    };

    this.navigationInfo = {
      currentPath: window.location.pathname,
      canGoBack: window.history.length > 1,
      canGoForward: false,
    };

    this.initializeEventListeners();
    this.initializeViewportFixes();
  }

  /**
   * イベントリスナーの初期化
   */
  private initializeEventListeners(): void {
    // タッチイベント
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    this.element.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: false });

    // マウスイベント（デバッグ用）
    if (process.env.NODE_ENV === 'development') {
      this.element.addEventListener('mousedown', this.handleMouseDown.bind(this));
      this.element.addEventListener('mousemove', this.handleMouseMove.bind(this));
      this.element.addEventListener('mouseup', this.handleMouseUp.bind(this));
    }

    // ピンチ防止
    if (this.config.enablePinchPrevention) {
      this.element.addEventListener('gesturestart', this.preventGesture.bind(this), { passive: false });
      this.element.addEventListener('gesturechange', this.preventGesture.bind(this), { passive: false });
      this.element.addEventListener('gestureend', this.preventGesture.bind(this), { passive: false });
    }

    // キーボードイベント（アクセシビリティ）
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  /**
   * ビューポート関連の修正
   */
  private initializeViewportFixes(): void {
    // 100vh問題の解決
    this.fix100vhIssue();
    
    // オリエンテーション変更対応
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.fix100vhIssue();
        this.updateNavigationInfo();
      }, 100);
    });

    // リサイズ対応
    window.addEventListener('resize', () => {
      this.fix100vhIssue();
    });
  }

  /**
   * 100vh問題の修正
   * モバイルブラウザのアドレスバーを考慮した高さ設定
   */
  private fix100vhIssue(): void {
    // 実際のビューポート高さを計算
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    
    // CSSカスタムプロパティを使用してより正確な高さを設定
    const actualHeight = window.innerHeight;
    document.documentElement.style.setProperty('--actual-vh', `${actualHeight}px`);
    
    // スクロール可能な要素の高さ調整
    const scrollableElements = document.querySelectorAll('[data-scroll-fix]');
    scrollableElements.forEach(element => {
      const htmlElement = element as HTMLElement;
      htmlElement.style.height = `${actualHeight}px`;
    });

    console.log(`Updated viewport height: ${actualHeight}px (100vh fix applied)`);
  }

  /**
   * タッチ開始処理
   */
  private handleTouchStart(event: TouchEvent): void {
    const touch = event.touches[0];
    this.startTouch = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };

    this.currentTouches = Array.from(event.touches).map(t => ({
      x: t.clientX,
      y: t.clientY,
      time: Date.now(),
    }));

    // マルチタッチ検出
    if (event.touches.length > 1) {
      this.isPinchActive = true;
      if (this.config.enablePinchPrevention) {
        event.preventDefault();
      }
    } else {
      this.isPinchActive = false;
    }
  }

  /**
   * タッチ移動処理
   */
  private handleTouchMove(event: TouchEvent): void {
    if (!this.startTouch) return;

    const touch = event.touches[0];
    const deltaX = touch.clientX - this.startTouch.x;
    const deltaY = touch.clientY - this.startTouch.y;

    // ピンチ防止
    if (this.isPinchActive && this.config.enablePinchPrevention) {
      event.preventDefault();
      return;
    }

    // スワイプナビゲーション判定
    if (this.config.enableSwipeNavigation && Math.abs(deltaX) > 20) {
      const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY) * 2;
      
      if (isHorizontalSwipe) {
        // 水平スワイプの場合、縦スクロールを防止
        const shouldPreventDefault = this.shouldPreventHorizontalSwipe(deltaX);
        if (shouldPreventDefault) {
          event.preventDefault();
        }
      }
    }

    // プルトゥリフレッシュ
    if (this.config.enablePullToRefresh && window.scrollY === 0 && deltaY > 0) {
      this.handlePullToRefresh(deltaY, event);
    }
  }

  /**
   * タッチ終了処理
   */
  private handleTouchEnd(event: TouchEvent): void {
    if (!this.startTouch) return;

    const touch = event.changedTouches[0];
    const endTouch: TouchPoint = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };

    const deltaX = endTouch.x - this.startTouch.x;
    const deltaY = endTouch.y - this.startTouch.y;
    const deltaTime = endTouch.time - this.startTouch.time;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const velocity = distance / deltaTime;

    // スワイプ判定
    if (this.isValidSwipe(distance, velocity, deltaTime)) {
      const direction = this.getSwipeDirection(deltaX, deltaY);
      this.triggerSwipeEvent(direction, distance, velocity, event);
    }

    // タップ判定
    if (distance < 10 && deltaTime < 200) {
      this.triggerTapEvent(endTouch, event);
    }

    // ロングプレス判定
    if (distance < 10 && deltaTime > 500) {
      this.triggerLongPressEvent(endTouch, event);
    }

    this.cleanup();
  }

  /**
   * タッチキャンセル処理
   */
  private handleTouchCancel(): void {
    this.cleanup();
  }

  /**
   * 水平スワイプの防止判定
   */
  private shouldPreventHorizontalSwipe(deltaX: number): boolean {
    // 戻る/進むジェスチャーが利用可能かチェック
    if (deltaX > 0 && this.navigationInfo.canGoBack) {
      return true; // 右スワイプ（戻る）
    }
    if (deltaX < 0 && this.navigationInfo.canGoForward) {
      return true; // 左スワイプ（進む）
    }
    return false;
  }

  /**
   * プルトゥリフレッシュ処理
   */
  private handlePullToRefresh(deltaY: number, event: TouchEvent): void {
    const threshold = 80;
    if (deltaY > threshold) {
      event.preventDefault();
      // プルトゥリフレッシュのビジュアルフィードバック
      this.showPullToRefreshIndicator();
    }
  }

  /**
   * 有効なスワイプかどうかの判定
   */
  private isValidSwipe(distance: number, velocity: number, time: number): boolean {
    return (
      distance >= this.config.swipeThreshold &&
      velocity >= this.config.velocityThreshold &&
      time <= this.config.maxSwipeTime
    );
  }

  /**
   * スワイプ方向の判定
   */
  private getSwipeDirection(deltaX: number, deltaY: number): SwipeDirection {
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (absX > absY) {
      return deltaX > 0 ? 'right' : 'left';
    } else {
      return deltaY > 0 ? 'down' : 'up';
    }
  }

  /**
   * スワイプイベントの発火
   */
  private triggerSwipeEvent(direction: SwipeDirection, distance: number, velocity: number, originalEvent: TouchEvent): void {
    const handlers = this.swipeHandlers.get(direction) || [];
    
    const gestureEvent: GestureEvent = {
      type: 'swipe',
      direction,
      distance,
      velocity,
      touches: this.currentTouches,
      preventDefault: () => originalEvent.preventDefault(),
      stopPropagation: () => originalEvent.stopPropagation(),
    };

    handlers.forEach(handler => {
      try {
        handler(gestureEvent);
      } catch (error) {
        console.error('Error in swipe handler:', error);
      }
    });

    // デフォルトのスワイプナビゲーション
    if (this.config.enableSwipeNavigation && handlers.length === 0) {
      this.handleDefaultSwipeNavigation(direction);
    }
  }

  /**
   * デフォルトのスワイプナビゲーション
   */
  private handleDefaultSwipeNavigation(direction: SwipeDirection): void {
    switch (direction) {
      case 'right':
        if (this.navigationInfo.canGoBack) {
          window.history.back();
        }
        break;
      case 'left':
        if (this.navigationInfo.canGoForward) {
          window.history.forward();
        }
        break;
    }
  }

  /**
   * タップイベントの発火
   */
  private triggerTapEvent(touch: TouchPoint, originalEvent: TouchEvent): void {
    const handlers = this.otherHandlers.get('tap') || [];
    
    const gestureEvent: GestureEvent = {
      type: 'tap',
      touches: [touch],
      preventDefault: () => originalEvent.preventDefault(),
      stopPropagation: () => originalEvent.stopPropagation(),
    };

    handlers.forEach(handler => handler(gestureEvent));
  }

  /**
   * ロングプレスイベントの発火
   */
  private triggerLongPressEvent(touch: TouchPoint, originalEvent: TouchEvent): void {
    const handlers = this.otherHandlers.get('longPress') || [];
    
    const gestureEvent: GestureEvent = {
      type: 'longPress',
      touches: [touch],
      preventDefault: () => originalEvent.preventDefault(),
      stopPropagation: () => originalEvent.stopPropagation(),
    };

    handlers.forEach(handler => handler(gestureEvent));
  }

  /**
   * マウスイベント（デバッグ用）
   */
  private handleMouseDown(event: MouseEvent): void {
    this.startTouch = {
      x: event.clientX,
      y: event.clientY,
      time: Date.now(),
    };
  }

  private handleMouseMove(event: MouseEvent): void {
    if (!this.startTouch) return;
    // マウスムーブ時の処理（必要に応じて実装）
  }

  private handleMouseUp(event: MouseEvent): void {
    if (!this.startTouch) return;
    
    const endTouch: TouchPoint = {
      x: event.clientX,
      y: event.clientY,
      time: Date.now(),
    };

    const deltaX = endTouch.x - this.startTouch.x;
    const deltaY = endTouch.y - this.startTouch.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance > 50) {
      const direction = this.getSwipeDirection(deltaX, deltaY);
      console.log(`Debug swipe: ${direction} (distance: ${distance.toFixed(2)}px)`);
    }

    this.cleanup();
  }

  /**
   * キーボードイベント処理（アクセシビリティ）
   */
  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.isSwipeEnabled) return;

    switch (event.key) {
      case 'ArrowLeft':
        if (event.altKey && this.navigationInfo.canGoBack) {
          event.preventDefault();
          window.history.back();
        }
        break;
      case 'ArrowRight':
        if (event.altKey && this.navigationInfo.canGoForward) {
          event.preventDefault();
          window.history.forward();
        }
        break;
    }
  }

  /**
   * ジェスチャー防止（ピンチなど）
   */
  private preventGesture(event: Event): void {
    event.preventDefault();
  }

  /**
   * プルトゥリフレッシュインジケーター表示
   */
  private showPullToRefreshIndicator(): void {
    // 実装は必要に応じて
    console.log('Pull to refresh triggered');
  }

  /**
   * ナビゲーション情報の更新
   */
  private updateNavigationInfo(): void {
    this.navigationInfo = {
      currentPath: window.location.pathname,
      canGoBack: window.history.length > 1,
      canGoForward: false, // ブラウザAPIでは判定困難
    };
  }

  /**
   * クリーンアップ
   */
  private cleanup(): void {
    this.startTouch = null;
    this.currentTouches = [];
    this.isPinchActive = false;
  }

  /**
   * スワイプハンドラーの登録
   */
  public onSwipe(direction: SwipeDirection, handler: GestureHandler): void {
    if (!this.swipeHandlers.has(direction)) {
      this.swipeHandlers.set(direction, []);
    }
    this.swipeHandlers.get(direction)!.push(handler);
  }

  /**
   * その他のジェスチャーハンドラーの登録
   */
  public onGesture(type: 'tap' | 'longPress' | 'pinch', handler: GestureHandler): void {
    if (!this.otherHandlers.has(type)) {
      this.otherHandlers.set(type, []);
    }
    this.otherHandlers.get(type)!.push(handler);
  }

  /**
   * スワイプ機能の有効/無効切り替え
   */
  public setSwipeEnabled(enabled: boolean): void {
    this.isSwipeEnabled = enabled;
  }

  /**
   * 設定の更新
   */
  public updateConfig(newConfig: Partial<GestureConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * イベントリスナーの削除
   */
  public destroy(): void {
    this.element.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    this.element.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    this.element.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    this.element.removeEventListener('touchcancel', this.handleTouchCancel.bind(this));
    
    if (this.config.enablePinchPrevention) {
      this.element.removeEventListener('gesturestart', this.preventGesture.bind(this));
      this.element.removeEventListener('gesturechange', this.preventGesture.bind(this));
      this.element.removeEventListener('gestureend', this.preventGesture.bind(this));
    }

    window.removeEventListener('keydown', this.handleKeyDown.bind(this));
    
    this.swipeHandlers.clear();
    this.otherHandlers.clear();
  }

  /**
   * 現在の状態を取得
   */
  public getStatus() {
    return {
      isSwipeEnabled: this.isSwipeEnabled,
      isPinchActive: this.isPinchActive,
      config: this.config,
      navigationInfo: this.navigationInfo,
      registeredHandlers: {
        swipe: Object.fromEntries(this.swipeHandlers),
        other: Object.fromEntries(this.otherHandlers),
      },
    };
  }
}
