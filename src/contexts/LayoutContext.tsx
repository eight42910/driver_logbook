'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * レイアウト関連の状態管理
 * サイドバーの表示状態とモバイル/デスクトップの切り替えを管理
 */

interface LayoutContextType {
  // サイドバー関連
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  // 画面サイズ関連
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;

  // レイアウト設定
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

/**
 * ブラウザの画面サイズを検出するフック
 */
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const media = window.matchMedia(query);

    // 初期値設定
    setMatches(media.matches);

    // リスナー登録
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener('change', listener);

    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

/**
 * レイアウトコンテキストプロバイダー
 */
export function LayoutProvider({ children }: { children: React.ReactNode }) {
  // 画面サイズ検出
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  // サイドバーの状態管理
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // モバイルでは自動的にサイドバーを閉じる
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  // デスクトップでは自動的にサイドバーを開く（コラップス状態に応じて）
  useEffect(() => {
    if (isDesktop && !sidebarCollapsed) {
      setSidebarOpen(true);
    }
  }, [isDesktop, sidebarCollapsed]);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const value: LayoutContextType = {
    sidebarOpen,
    setSidebarOpen,
    toggleSidebar,
    isMobile,
    isTablet,
    isDesktop,
    sidebarCollapsed,
    setSidebarCollapsed,
  };

  return (
    <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>
  );
}

/**
 * レイアウトコンテキストを使用するカスタムフック
 */
export function useLayout() {
  const context = useContext(LayoutContext);

  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }

  return context;
}

/**
 * サイドバー専用のフック（便利関数）
 */
export function useSidebar() {
  const {
    sidebarOpen,
    setSidebarOpen,
    toggleSidebar,
    sidebarCollapsed,
    setSidebarCollapsed,
    isMobile,
  } = useLayout();

  return {
    isOpen: sidebarOpen,
    setOpen: setSidebarOpen,
    toggle: toggleSidebar,
    isCollapsed: sidebarCollapsed,
    setCollapsed: setSidebarCollapsed,
    isMobile,
  };
}

/**
 * レスポンシブ情報専用のフック
 */
export function useResponsive() {
  const { isMobile, isTablet, isDesktop } = useLayout();

  return {
    isMobile,
    isTablet,
    isDesktop,
    // 便利な組み合わせ
    isMobileOrTablet: isMobile || isTablet,
    isTabletOrDesktop: isTablet || isDesktop,
  };
}
