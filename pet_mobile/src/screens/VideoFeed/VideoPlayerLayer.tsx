import React, { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useEvent, useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Play } from 'lucide-react-native';
import { PanResponder, Animated } from 'react-native';
import {
  VIDEO_LOAD_TIMEOUT_MS,
  PROGRESS_BAR_FADE_DURATION_MS,
  PROGRESS_BAR_PAD,
  PROGRESS_BAR_WIDTH,
  HIDE_PROGRESS_DELAY_MS,
} from './constants';
import { videoFeedStyles } from './styles';

/** 使用 expo-video 的單個視頻視圖（僅在 hasVideo 時掛載，以滿足 hooks 規則） */
export function VideoPlayerLayer({
  videoUrl,
  isActive,
  onRetry,
}: {
  videoUrl: string;
  coverUrl: string;
  isActive: boolean;
  onRetry?: () => void;
}) {
  const player = useVideoPlayer(videoUrl, (p) => {
    p.loop = true;
    p.timeUpdateEventInterval = 0.5;
  });
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
  const { status } = useEvent(player, 'statusChange', { status: player.status });
  const timeUpdatePayload = useEvent(player, 'timeUpdate', {
    currentTime: player.currentTime,
    currentLiveTimestamp: null,
    currentOffsetFromLive: null,
    bufferedPosition: 0,
  });
  const currentTime = timeUpdatePayload?.currentTime ?? player.currentTime;

  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState<number | null>(null);
  const [isUserPaused, setIsUserPaused] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideProgressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressBarOpacity = useRef(new Animated.Value(0)).current;
  const loadingBarBlink = useRef(new Animated.Value(0.4)).current;
  const isActiveRef = useRef(isActive);
  isActiveRef.current = isActive;

  const isLoading = isActive && status !== 'readyToPlay';

  // 加載超時或錯誤：TikTok 式判定，顯示「加載失敗，點擊重試」
  useEffect(() => {
    if (status === 'readyToPlay') {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
      setLoadFailed(false);
      return;
    }
    if (String(status) === 'error') {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
      setLoadFailed(true);
      return;
    }
    if (!isActive) {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
      return;
    }
    loadTimeoutRef.current = setTimeout(() => {
      loadTimeoutRef.current = null;
      setLoadFailed(true);
    }, VIDEO_LOAD_TIMEOUT_MS);
    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
    };
  }, [isActive, status]);

  useEffect(() => {
    if (status === 'readyToPlay' && player.duration > 0) {
      setDuration(player.duration);
    }
  }, [status, player.duration]);

  // status 變為 readyToPlay 時立即嘗試播放，不依賴 effect 時序，減少進入頁面偶爾不自動播放
  useEventListener(player, 'statusChange', ({ status: nextStatus }) => {
    if (nextStatus === 'readyToPlay' && isActiveRef.current) {
      player.play();
      setIsUserPaused(false);
    }
  });

  // 當前項且播放器已就緒時自動播放；非當前項暫停
  useEffect(() => {
    if (!isActive) {
      player.pause();
      return;
    }
    if (status === 'readyToPlay') {
      player.play();
      setIsUserPaused(false); // 自動播放時不顯示暫停態，避免循環時閃爍
    }
  }, [isActive, status, player]);

  // 播放時緩緩隱藏進度條；暫停或拖動時顯示；拖動結束後播放中則 1 秒後淡出
  useEffect(() => {
    // 當前條目失焦時，直接隱藏進度條並清理定時器
    if (!isActive) {
      if (hideProgressTimerRef.current) {
        clearTimeout(hideProgressTimerRef.current);
        hideProgressTimerRef.current = null;
      }
      Animated.timing(progressBarOpacity, {
        toValue: 0,
        duration: PROGRESS_BAR_FADE_DURATION_MS,
        useNativeDriver: true,
      }).start();
      return;
    }

    if (isDragging) {
      if (hideProgressTimerRef.current) {
        clearTimeout(hideProgressTimerRef.current);
        hideProgressTimerRef.current = null;
      }
      Animated.timing(progressBarOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
      return;
    }
    if (isUserPaused) {
      Animated.timing(progressBarOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
      return;
    }
    if (hideProgressTimerRef.current) {
      clearTimeout(hideProgressTimerRef.current);
      hideProgressTimerRef.current = null;
    }
    hideProgressTimerRef.current = setTimeout(() => {
      hideProgressTimerRef.current = null;
      Animated.timing(progressBarOpacity, {
        toValue: 0,
        duration: PROGRESS_BAR_FADE_DURATION_MS,
        useNativeDriver: true,
      }).start();
    }, HIDE_PROGRESS_DELAY_MS);
    return () => {
      if (hideProgressTimerRef.current) {
        clearTimeout(hideProgressTimerRef.current);
        hideProgressTimerRef.current = null;
      }
    };
  }, [isActive, isUserPaused, isDragging, progressBarOpacity]);

  // 加載中（黑屏/網絡加載）時底部進度條一閃一閃提示用戶
  useEffect(() => {
    if (!isLoading) {
      loadingBarBlink.stopAnimation();
      loadingBarBlink.setValue(0);
      return;
    }
    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(loadingBarBlink, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.timing(loadingBarBlink, {
          toValue: 0.35,
          duration: 450,
          useNativeDriver: true,
        }),
      ])
    );
    blink.start();
    return () => blink.stop();
  }, [isLoading, loadingBarBlink]);

  const togglePlay = useCallback(() => {
    if (player.playing) {
      player.pause();
      setIsUserPaused(true);
    } else {
      player.play();
      setIsUserPaused(false);
    }
  }, [player]);

  const totalDuration = duration > 0 ? duration : 1;
  const displayTime = isDragging && dragProgress != null ? dragProgress * totalDuration : currentTime;
  const progress = totalDuration > 0 ? Math.min(1, Math.max(0, displayTime / totalDuration)) : 0;

  const seekTo = useCallback(
    (ratio: number) => {
      const t = ratio * totalDuration;
      player.currentTime = t;
      setDragProgress(ratio);
    },
    [player, totalDuration]
  );

  const progressBarRef = useRef<View>(null);
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          setIsDragging(true);
          const ratio = Math.max(0, Math.min(1, (evt.nativeEvent.pageX - PROGRESS_BAR_PAD) / PROGRESS_BAR_WIDTH));
          seekTo(ratio);
        },
        onPanResponderMove: (evt) => {
          const ratio = Math.max(0, Math.min(1, (evt.nativeEvent.pageX - PROGRESS_BAR_PAD) / PROGRESS_BAR_WIDTH));
          seekTo(ratio);
        },
        onPanResponderRelease: () => {
          setIsDragging(false);
          setDragProgress(null);
        },
        onPanResponderTerminate: () => {
          setIsDragging(false);
          setDragProgress(null);
        },
        onPanResponderTerminationRequest: () => true,
      }),
    [seekTo]
  );

  return (
    <>
      <VideoView
        style={videoFeedStyles.video}
        player={player}
        contentFit="cover"
        nativeControls={false}
        surfaceType="textureView"
      />
      <View style={videoFeedStyles.coverOverlay} />
      <Pressable style={StyleSheet.absoluteFill} onPress={togglePlay}>
        {/* 僅在用戶手動暫停時顯示播放按鈕，避免循環切頭時 isPlaying 短暫為 false 導致閃爍 */}
        {isUserPaused && (
          <View style={videoFeedStyles.playIconWrap}>
            <Play size={72} color="rgba(255,255,255,0.95)" fill="rgba(255,255,255,0.95)" strokeWidth={1} />
          </View>
        )}
      </Pressable>

      {/* 加載中（黑屏）：底部進度條一閃一閃提示加載中 */}
      {isLoading && (
        <View style={videoFeedStyles.progressBarWrap} pointerEvents="none">
          <Animated.View style={[videoFeedStyles.progressBarTrack, { opacity: loadingBarBlink }]}>
            <View style={[videoFeedStyles.progressBarFill, { width: '100%' }]} />
          </Animated.View>
        </View>
      )}
      {/* 進度條：可拖動，暫停或拖動時顯示，播放且未拖動時緩緩淡出（拖動結束後 1 秒淡出） */}
      {!isLoading && (
        <View
          ref={progressBarRef}
          style={videoFeedStyles.progressBarWrap}
          {...panResponder.panHandlers}
          pointerEvents="box-only"
        >
          <Animated.View style={[videoFeedStyles.progressBarTrack, { opacity: progressBarOpacity }]}>
            <View style={[videoFeedStyles.progressBarFill, { width: `${progress * 100}%` }]} />
          </Animated.View>
        </View>
      )}

      {/* 加載失敗 / 超時：TikTok 式提示，點擊重試 */}
      {loadFailed && onRetry && (
        <Pressable
          style={videoFeedStyles.loadFailedOverlay}
          onPress={onRetry}
        >
          <View style={videoFeedStyles.loadFailedCard}>
            <Text style={videoFeedStyles.loadFailedTitle}>加载失败</Text>
            <Text style={videoFeedStyles.loadFailedHint}>点击重试</Text>
          </View>
        </Pressable>
      )}
    </>
  );
}
