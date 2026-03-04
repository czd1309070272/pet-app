import { useCallback, useRef, useState, useMemo } from 'react';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { DiscoveryStackParamList } from '../../navigation/types';
import { useFocusEffect } from '@react-navigation/native';
import { FlatList, NativeSyntheticEvent, NativeScrollEvent, ViewToken } from 'react-native';
import { PanResponder } from 'react-native';
import { useTabBarVisibility } from '../../context/TabBarVisibilityContext';
import type { VideoFeedItem } from './types';
import { MOCK_VIDEOS } from './constants';
import {
  PULL_TRIGGER_DY,
  PULL_CANCEL_DY,
  SWIPE_RIGHT_DX,
  SWIPE_RIGHT_MIN_RELEASE,
  REFRESH_DURATION_MS,
} from './constants';

export type Nav = NativeStackNavigationProp<DiscoveryStackParamList, 'VideoFeed'>;

export function useVideoFeedList(navigation: Nav) {
  const { setTabBarVisible } = useTabBarVisibility();
  const [videos, setVideos] = useState<VideoFeedItem[]>(MOCK_VIDEOS);
  const listRef = useRef<FlatList>(null);
  const [feedMountKey, setFeedMountKey] = useState(0);
  const [isScreenFocused, setIsScreenFocused] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPullPrompt, setShowPullPrompt] = useState(false);
  const [listScrollEnabled, setListScrollEnabled] = useState(true);
  const scrollYRef = useRef(0);
  const pullCancelledRef = useRef(false);
  const gestureTypeRef = useRef<'pull-refresh' | 'go-home' | null>(null);

  useFocusEffect(
    useCallback(() => {
      setTabBarVisible(false);
      setIsScreenFocused(true);
      return () => {
        setTabBarVisible(true);
        setIsScreenFocused(false);
      };
    }, [setTabBarVisible])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setVideos([...MOCK_VIDEOS]);
      setFeedMountKey((k) => k + 1);
      setRefreshing(false);
    }, REFRESH_DURATION_MS);
  }, []);

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollYRef.current = e.nativeEvent.contentOffset.y;
  }, []);

  const goToHome = useCallback(() => {
    setTabBarVisible(true);
    const parent = navigation.getParent();
    if (parent) (parent as { navigate: (name: string) => void }).navigate('HomeTab');
  }, [navigation, setTabBarVisible]);

  const pullRefreshResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          const atTop = scrollYRef.current <= 20;
          const pullingDown = gestureState.dy > PULL_TRIGGER_DY;
          const swipingRight =
            gestureState.dx > SWIPE_RIGHT_DX && gestureState.dx > Math.abs(gestureState.dy);
          if (atTop && pullingDown) {
            gestureTypeRef.current = 'pull-refresh';
            return true;
          }
          if (swipingRight) {
            gestureTypeRef.current = 'go-home';
            return true;
          }
          return false;
        },
        onPanResponderGrant: () => {
          pullCancelledRef.current = false;
          setListScrollEnabled(false);
        },
        onPanResponderMove: (_, gestureState) => {
          if (gestureTypeRef.current !== 'pull-refresh') return;
          if (gestureState.dy < PULL_CANCEL_DY) {
            pullCancelledRef.current = true;
            setShowPullPrompt(false);
          } else {
            setShowPullPrompt(true);
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          const type = gestureTypeRef.current;
          gestureTypeRef.current = null;
          setShowPullPrompt(false);
          setListScrollEnabled(true);
          if (type === 'pull-refresh') {
            const cancelled = pullCancelledRef.current;
            if (!refreshing && !cancelled) onRefresh();
          } else if (type === 'go-home' && gestureState.dx > SWIPE_RIGHT_MIN_RELEASE) {
            goToHome();
          }
        },
        onPanResponderTerminate: () => {
          gestureTypeRef.current = null;
          setShowPullPrompt(false);
          setListScrollEnabled(true);
        },
        onPanResponderTerminationRequest: () => false,
      }),
    [onRefresh, refreshing, goToHome]
  );

  const handleLike = useCallback((id: string) => {
    setVideos((prev) =>
      prev.map((v) =>
        v.id === id ? { ...v, isLiked: !v.isLiked, likes: v.likes + (v.isLiked ? -1 : 1) } : v
      )
    );
  }, []);

  const handleCollect = useCallback((id: string) => {
    setVideos((prev) =>
      prev.map((v) => (v.id === id ? { ...v, isCollected: !v.isCollected } : v))
    );
  }, []);

  const handleComment = useCallback((_id: string) => {
    // 可導航到評論頁或彈出評論框
  }, []);

  const handleShare = useCallback((_id: string) => {
    // 可觸發分享
  }, []);

  const [viewableIndex, setViewableIndex] = useState(0);
  const viewableIndexRef = useRef(0);
  const onViewableItemsChanged = useRef(
    (info: { viewableItems: ViewToken[] }) => {
      const first = info.viewableItems[0];
      const nextIndex = first?.index;
      if (nextIndex != null && nextIndex !== viewableIndexRef.current) {
        viewableIndexRef.current = nextIndex;
        setViewableIndex(nextIndex);
      }
    }
  ).current;
  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 90,
    minimumViewTime: 100,
  }).current;

  const goToMall = useCallback(() => {
    navigation.navigate('Discovery');
  }, [navigation]);

  const [showSettingsSheet, setShowSettingsSheet] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [quality, setQuality] = useState<string>('高清');
  const [autoPlayNext, setAutoPlayNext] = useState(true);

  return {
    listRef,
    videos,
    feedMountKey,
    isScreenFocused,
    refreshing,
    showPullPrompt,
    listScrollEnabled,
    viewableIndex,
    showSettingsSheet,
    setShowSettingsSheet,
    playbackSpeed,
    setPlaybackSpeed,
    quality,
    setQuality,
    autoPlayNext,
    setAutoPlayNext,
    onRefresh,
    handleScroll,
    goToHome,
    goToMall,
    pullRefreshResponder,
    handleLike,
    handleCollect,
    handleComment,
    handleShare,
    onViewableItemsChanged,
    viewabilityConfig,
  };
}
