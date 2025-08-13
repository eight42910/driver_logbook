'use client';

import React, { useState, useEffect } from 'react';
import { useResponsive } from '@/contexts/LayoutContext';
import { MobilePageWrapper } from './BottomNavigationBar';
import { Sidebar } from '../layout/Sidebar';

/**
 * モバイルレイアウト移行管理
 * 段階的にトグルメニューから下部メニューバーへ移行
 */

interface MobileLayoutTransitionProps {
  children: React.ReactNode;
  enableBottomNav?: boolean; // 下部ナビの有効/無効切り替え
}

export function MobileLayoutTransition({
  children,
  enableBottomNav = true,
}: MobileLayoutTransitionProps) {
  const { isMobile } = useResponsive();
  const [showMigrationPrompt, setShowMigrationPrompt] = useState(false);
  const [userPreference, setUserPreference] = useState<
    'sidebar' | 'bottom' | null
  >(null);

  useEffect(() => {
    // ユーザーの設定を確認
    const savedPreference = localStorage.getItem('mobile-nav-preference') as
      | 'sidebar'
      | 'bottom'
      | null;
    setUserPreference(savedPreference);

    // 初回モバイルアクセス時にプロンプト表示
    if (isMobile && !savedPreference && enableBottomNav) {
      const hasSeenPrompt = localStorage.getItem('mobile-nav-prompt-shown');
      if (!hasSeenPrompt) {
        setShowMigrationPrompt(true);
        localStorage.setItem('mobile-nav-prompt-shown', 'true');
      }
    }
  }, [isMobile, enableBottomNav]);

  const handleNavPreference = (preference: 'sidebar' | 'bottom') => {
    setUserPreference(preference);
    localStorage.setItem('mobile-nav-preference', preference);
    setShowMigrationPrompt(false);
  };

  // デスクトップ・タブレットは従来のサイドバー
  if (!isMobile) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1">{children}</main>
      </div>
    );
  }

  // モバイルでの表示制御
  const shouldUseBottomNav =
    enableBottomNav &&
    (userPreference === 'bottom' || (!userPreference && enableBottomNav));

  return (
    <>
      {/* ナビゲーション選択プロンプト */}
      {showMigrationPrompt && (
        <MobileNavMigrationPrompt
          onSelect={handleNavPreference}
          onClose={() => setShowMigrationPrompt(false)}
        />
      )}

      {/* レイアウト表示 */}
      {shouldUseBottomNav ? (
        <MobilePageWrapper>{children}</MobilePageWrapper>
      ) : (
        <div className="min-h-screen">
          <Sidebar />
          <main className="min-h-screen">{children}</main>
        </div>
      )}

      {/* 設定変更用フローティングボタン（開発・テスト用） */}
      {process.env.NODE_ENV === 'development' && (
        <MobileNavToggleButton
          currentNav={shouldUseBottomNav ? 'bottom' : 'sidebar'}
          onToggle={(newNav) => handleNavPreference(newNav)}
        />
      )}
    </>
  );
}

/**
 * ナビゲーション移行プロンプト
 */
interface MobileNavMigrationPromptProps {
  onSelect: (preference: 'sidebar' | 'bottom') => void;
  onClose: () => void;
}

function MobileNavMigrationPrompt({
  onSelect,
  onClose,
}: MobileNavMigrationPromptProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-sm mx-auto shadow-xl">
        <h3 className="text-lg font-semibold mb-4 text-center">
          📱 モバイル体験を改善しました！
        </h3>

        <p className="text-gray-600 text-sm mb-6 text-center">
          より使いやすいナビゲーションをお選びください
        </p>

        <div className="space-y-3">
          {/* 下部メニューバー */}
          <button
            onClick={() => onSelect('bottom')}
            className="w-full p-4 border-2 border-blue-200 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">NEW</span>
              </div>
              <div className="text-left">
                <div className="font-medium text-blue-900">
                  下部メニューバー
                </div>
                <div className="text-xs text-blue-700">
                  親指で簡単操作・モダンデザイン
                </div>
              </div>
            </div>
          </button>

          {/* 従来のサイドバー */}
          <button
            onClick={() => onSelect('sidebar')}
            className="w-full p-4 border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">従来</span>
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-900">
                  サイドバーメニュー
                </div>
                <div className="text-xs text-gray-600">
                  従来のハンバーガーメニュー
                </div>
              </div>
            </div>
          </button>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            後で決める
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * 開発用ナビゲーショントグルボタン
 */
interface MobileNavToggleButtonProps {
  currentNav: 'sidebar' | 'bottom';
  onToggle: (newNav: 'sidebar' | 'bottom') => void;
}

function MobileNavToggleButton({
  currentNav,
  onToggle,
}: MobileNavToggleButtonProps) {
  return (
    <button
      onClick={() => onToggle(currentNav === 'bottom' ? 'sidebar' : 'bottom')}
      className="fixed top-4 right-4 z-50 bg-yellow-500 text-black p-2 rounded-full text-xs font-bold shadow-lg"
      title="ナビゲーション切り替え（開発用）"
    >
      {currentNav === 'bottom' ? '📱' : '🍔'}
    </button>
  );
}

/**
 * モバイル最適化レイアウトフック
 */
export function useMobileLayoutOptimization() {
  const { isMobile } = useResponsive();
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    'portrait'
  );
  const [viewportHeight, setViewportHeight] = useState(0);

  useEffect(() => {
    if (!isMobile) return;

    const updateViewport = () => {
      setViewportHeight(window.innerHeight);
      setOrientation(
        window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
      );
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    window.addEventListener('orientationchange', updateViewport);

    return () => {
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('orientationchange', updateViewport);
    };
  }, [isMobile]);

  return {
    isMobile,
    orientation,
    viewportHeight,
    isLandscape: orientation === 'landscape',
    // 100vh問題の解決
    dynamicViewportHeight: `${viewportHeight}px`,
  };
}

/**
 * モバイルジェスチャー対応
 */
export function useMobileGestures() {
  const [gestureState, setGestureState] = useState({
    isPinching: false,
    isSwipingBack: false,
    swipeDirection: null as 'left' | 'right' | 'up' | 'down' | null,
  });

  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let startDistance = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        startDistance = Math.sqrt(dx * dx + dy * dy);
        setGestureState((prev) => ({ ...prev, isPinching: true }));
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // ピンチジェスチャーの検出
        if (Math.abs(distance - startDistance) > 10) {
          e.preventDefault(); // ズームを防ぐ
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length === 1) {
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const deltaX = endX - startX;
        const deltaY = endY - startY;

        // スワイプ判定
        if (Math.abs(deltaX) > 50 || Math.abs(deltaY) > 50) {
          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            setGestureState((prev) => ({
              ...prev,
              swipeDirection: deltaX > 0 ? 'right' : 'left',
            }));
          } else {
            setGestureState((prev) => ({
              ...prev,
              swipeDirection: deltaY > 0 ? 'down' : 'up',
            }));
          }
        }
      }

      setGestureState((prev) => ({
        ...prev,
        isPinching: false,
        swipeDirection: null,
      }));
    };

    document.addEventListener('touchstart', handleTouchStart, {
      passive: false,
    });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  return gestureState;
}
