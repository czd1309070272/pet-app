import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import type { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';

type TabBarVisibilityContextValue = {
  isTabBarVisible: boolean;
  setTabBarVisible: (visible: boolean) => void;
  reportScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  reportActivity: () => void;
};

const TabBarVisibilityContext = createContext<TabBarVisibilityContextValue | null>(null);

/** 向下滑动超过该像素视为「意图隐藏」，收起导航栏 */
const SCROLL_THRESHOLD_HIDE = 12;
/** 单次向上滑动超过该像素且未到底部时立即显示导航栏 */
const SCROLL_THRESHOLD_SHOW_AT_ONCE = 28;
/** 缓慢向上滑动时，累计超过该像素后显示导航栏（解决慢滑不出现的问题） */
const SCROLL_ACCUMULATE_SHOW = 22;
const BOTTOM_THRESHOLD = 30;
/** 无操作超过该时长（毫秒）后自动隐藏导航栏 */
const IDLE_HIDE_MS = 3000;

export function TabBarVisibilityProvider({ children }: { children: React.ReactNode }) {
  const [isTabBarVisible, setTabBarVisibleRaw] = useState(true);
  const lastScrollY = useRef(0);
  const accumulatedUpRef = useRef(0);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, []);

  const resetIdleTimer = useCallback(() => {
    clearIdleTimer();
    idleTimerRef.current = setTimeout(() => {
      idleTimerRef.current = null;
      setTabBarVisibleRaw(false);
    }, IDLE_HIDE_MS);
  }, [clearIdleTimer]);

  const setTabBarVisible = useCallback(
    (visible: boolean) => {
      setTabBarVisibleRaw(visible);
      if (visible) resetIdleTimer();
      else clearIdleTimer();
    },
    [resetIdleTimer, clearIdleTimer]
  );

  const reportActivity = useCallback(() => {
    setTabBarVisible(true);
  }, [setTabBarVisible]);

  const reportScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
      const y = contentOffset.y;
      const contentHeight = contentSize.height;
      const layoutHeight = layoutMeasurement.height;
      const atBottom = y + layoutHeight >= contentHeight - BOTTOM_THRESHOLD;
      const delta = y - lastScrollY.current;
      lastScrollY.current = y;

      if (delta > SCROLL_THRESHOLD_HIDE) {
        setTabBarVisible(false);
        accumulatedUpRef.current = 0;
      } else if (!atBottom && delta < 0) {
        const up = Math.abs(delta);
        if (up >= SCROLL_THRESHOLD_SHOW_AT_ONCE) {
          setTabBarVisible(true);
          accumulatedUpRef.current = 0;
        } else {
          accumulatedUpRef.current += up;
          if (accumulatedUpRef.current >= SCROLL_ACCUMULATE_SHOW) {
            setTabBarVisible(true);
            accumulatedUpRef.current = 0;
          }
        }
      } else if (delta > 0) {
        accumulatedUpRef.current = 0;
      }

      if (delta >= -SCROLL_THRESHOLD_SHOW_AT_ONCE && delta <= SCROLL_THRESHOLD_HIDE && isTabBarVisible) {
        resetIdleTimer();
      }
    },
    [setTabBarVisible, isTabBarVisible, resetIdleTimer]
  );

  useEffect(() => {
    resetIdleTimer();
    return () => clearIdleTimer();
  }, [resetIdleTimer, clearIdleTimer]);

  const value: TabBarVisibilityContextValue = { isTabBarVisible, setTabBarVisible, reportScroll, reportActivity };
  return (
    <TabBarVisibilityContext.Provider value={value}>
      {children}
    </TabBarVisibilityContext.Provider>
  );
}

export function useTabBarVisibility() {
  const ctx = useContext(TabBarVisibilityContext);
  if (!ctx) throw new Error('useTabBarVisibility must be used within TabBarVisibilityProvider');
  return ctx;
}
