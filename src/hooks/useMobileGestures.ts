'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MobileGestureHandler } from '@/lib/utils/mobile-gesture-handler';

/**
 * モバイルジェスチャー機能を提供するカスタムフック
 */
export function useMobileGestures(options: {
  enableSwipeNavigation?: boolean;
  enablePinchPrevention?: boolean;
  enablePullToRefresh?: boolean;
  target?: React.RefObject<HTMLElement>;
} = {}) {
  const router = useRouter();
  const gestureHandlerRef = useRef<MobileGestureHandler | null>(null);
  const targetRef = useRef<HTMLElement | null>(null);

  const {
    enableSwipeNavigation = true,
    enablePinchPrevention = true,
    enablePullToRefresh = false,
    target,
  } = options;

  // ジェスチャーハンドラーの初期化
  useEffect(() => {
    const targetElement = target?.current || document.body;
    
    if (!targetElement) return;

    targetRef.current = targetElement;
    gestureHandlerRef.current = new MobileGestureHandler(targetElement, {
      enableSwipeNavigation,
      enablePinchPrevention,
      enablePullToRefresh,
    });

    // デフォルトのスワイプナビゲーションハンドラー
    if (enableSwipeNavigation) {
      gestureHandlerRef.current.onSwipe('right', () => {
        // 右スワイプで戻る
        if (window.history.length > 1) {
          router.back();
        }
      });

      gestureHandlerRef.current.onSwipe('left', () => {
        // 左スワイプで進む（実際にはブラウザAPI制限により困難）
        console.log('Left swipe detected - forward navigation');
      });
    }

    return () => {
      gestureHandlerRef.current?.destroy();
    };
  }, [enableSwipeNavigation, enablePinchPrevention, enablePullToRefresh, target, router]);

  // カスタムスワイプハンドラーの登録
  const onSwipe = useCallback((direction: 'left' | 'right' | 'up' | 'down', handler: () => void) => {
    gestureHandlerRef.current?.onSwipe(direction, handler);
  }, []);

  // カスタムジェスチャーハンドラーの登録
  const onGesture = useCallback((type: 'tap' | 'longPress' | 'pinch', handler: () => void) => {
    gestureHandlerRef.current?.onGesture(type, handler);
  }, []);

  // スワイプ機能の動的切り替え
  const setSwipeEnabled = useCallback((enabled: boolean) => {
    gestureHandlerRef.current?.setSwipeEnabled(enabled);
  }, []);

  // ジェスチャーの状態取得
  const getGestureStatus = useCallback(() => {
    return gestureHandlerRef.current?.getStatus();
  }, []);

  return {
    onSwipe,
    onGesture,
    setSwipeEnabled,
    getGestureStatus,
  };
}

/**
 * ページ固有のスワイプナビゲーション
 */
export function usePageSwipeNavigation(routes: {
  previous?: string;
  next?: string;
}) {
  const router = useRouter();
  const { onSwipe } = useMobileGestures();

  useEffect(() => {
    if (routes.previous) {
      onSwipe('right', () => {
        router.push(routes.previous!);
      });
    }

    if (routes.next) {
      onSwipe('left', () => {
        router.push(routes.next!);
      });
    }
  }, [routes.previous, routes.next, router, onSwipe]);
}

/**
 * フォーム入力時のジェスチャー制御
 */
export function useFormGestureControl() {
  const { setSwipeEnabled } = useMobileGestures();

  // フォーカス時にスワイプ無効、ブラー時に有効
  const handleInputFocus = useCallback(() => {
    setSwipeEnabled(false);
  }, [setSwipeEnabled]);

  const handleInputBlur = useCallback(() => {
    setSwipeEnabled(true);
  }, [setSwipeEnabled]);

  return {
    onInputFocus: handleInputFocus,
    onInputBlur: handleInputBlur,
  };
}

/**
 * 100vh問題修正のフック
 */
export function useViewportFix() {
  useEffect(() => {
    const updateViewportHeight = () => {
      // 実際のビューポート高さを取得
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
      
      // より正確な高さ
      document.documentElement.style.setProperty('--actual-vh', `${window.innerHeight}px`);
    };

    // 初期設定
    updateViewportHeight();

    // リサイズとオリエンテーション変更時に更新
    window.addEventListener('resize', updateViewportHeight);
    window.addEventListener('orientationchange', () => {
      // オリエンテーション変更後の遅延更新
      setTimeout(updateViewportHeight, 100);
    });

    return () => {
      window.removeEventListener('resize', updateViewportHeight);
      window.removeEventListener('orientationchange', updateViewportHeight);
    };
  }, []);
}

/**
 * スクロール可能エリアのジェスチャー制御
 */
export function useScrollGestureControl(scrollRef: React.RefObject<HTMLElement>) {
  const { setSwipeEnabled } = useMobileGestures();

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    let isScrolling = false;
    let scrollTimeout: NodeJS.Timeout;

    const handleScrollStart = () => {
      isScrolling = true;
      setSwipeEnabled(false);
      clearTimeout(scrollTimeout);
    };

    const handleScrollEnd = () => {
      scrollTimeout = setTimeout(() => {
        isScrolling = false;
        setSwipeEnabled(true);
      }, 150); // スクロール終了から150ms後に有効化
    };

    element.addEventListener('touchstart', handleScrollStart);
    element.addEventListener('scroll', handleScrollEnd);
    element.addEventListener('touchend', handleScrollEnd);

    return () => {
      element.removeEventListener('touchstart', handleScrollStart);
      element.removeEventListener('scroll', handleScrollEnd);
      element.removeEventListener('touchend', handleScrollEnd);
      clearTimeout(scrollTimeout);
    };
  }, [scrollRef, setSwipeEnabled]);
}

/**
 * カスタムスワイプアニメーション
 */
export function useSwipeAnimation() {
  const animationRef = useRef<HTMLElement | null>(null);

  const showSwipeIndicator = useCallback((direction: 'left' | 'right') => {
    if (!animationRef.current) {
      // インジケーター要素を作成
      const indicator = document.createElement('div');
      indicator.className = 'swipe-indicator';
      indicator.style.cssText = `
        position: fixed;
        top: 50%;
        ${direction === 'left' ? 'left: 20px' : 'right: 20px'};
        transform: translateY(-50%);
        background: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 8px 12px;
        border-radius: 20px;
        font-size: 14px;
        z-index: 9999;
        pointer-events: none;
        animation: swipeIndicatorFade 0.5s ease-out;
      `;
      indicator.textContent = direction === 'left' ? '← 戻る' : '進む →';
      document.body.appendChild(indicator);
      animationRef.current = indicator;

      // 0.5秒後に削除
      setTimeout(() => {
        if (animationRef.current) {
          document.body.removeChild(animationRef.current);
          animationRef.current = null;
        }
      }, 500);
    }
  }, []);

  // CSSアニメーションの追加
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes swipeIndicatorFade {
        0% { opacity: 0; transform: translateY(-50%) scale(0.8); }
        50% { opacity: 1; transform: translateY(-50%) scale(1); }
        100% { opacity: 0; transform: translateY(-50%) scale(0.8); }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return { showSwipeIndicator };
}

/**
 * ハプティックフィードバック
 */
export function useHapticFeedback() {
  const vibrate = useCallback((pattern: number | number[] = 50) => {
    if ('vibrate' in navigator && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }, []);

  const lightFeedback = useCallback(() => {
    vibrate(25);
  }, [vibrate]);

  const mediumFeedback = useCallback(() => {
    vibrate(50);
  }, [vibrate]);

  const heavyFeedback = useCallback(() => {
    vibrate([50, 25, 50]);
  }, [vibrate]);

  return {
    vibrate,
    lightFeedback,
    mediumFeedback,
    heavyFeedback,
  };
}

/**
 * ピンチズーム防止（特定要素）
 */
export function usePinchPrevention(elementRef: React.RefObject<HTMLElement>) {
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const preventPinch = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    const preventGesture = (e: Event) => {
      e.preventDefault();
    };

    element.addEventListener('touchmove', preventPinch, { passive: false });
    element.addEventListener('gesturestart', preventGesture, { passive: false });
    element.addEventListener('gesturechange', preventGesture, { passive: false });
    element.addEventListener('gestureend', preventGesture, { passive: false });

    return () => {
      element.removeEventListener('touchmove', preventPinch);
      element.removeEventListener('gesturestart', preventGesture);
      element.removeEventListener('gesturechange', preventGesture);
      element.removeEventListener('gestureend', preventGesture);
    };
  }, [elementRef]);
}
