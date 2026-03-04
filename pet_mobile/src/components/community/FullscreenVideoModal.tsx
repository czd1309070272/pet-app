/**
 * 全屏视频观看弹窗 - 加载失败时提示用户，避免卡住
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, Modal, Pressable, StyleSheet, Text } from 'react-native';
import { X, AlertCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { spacing } from '../../theme/tokens';

const VIDEO_LOAD_TIMEOUT_MS = 12000;

export interface FullscreenVideoModalProps {
  videoUri: string;
  onClose: () => void;
}

export function FullscreenVideoModal({ videoUri, onClose }: FullscreenVideoModalProps) {
  const insets = useSafeAreaInsets();
  const [loadFailed, setLoadFailed] = useState(false);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const player = useVideoPlayer(videoUri, (p) => {
    p.muted = false;
    p.loop = false;
  });
  const { status } = useEvent(player, 'statusChange', { status: player.status });

  useEffect(() => {
    if (status === 'readyToPlay') {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
      setLoadFailed(false);
      return;
    }
    if (status === 'error') {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
      setLoadFailed(true);
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
  }, [status]);

  useEffect(() => {
    if (status === 'readyToPlay') player.play();
  }, [player, status]);

  return (
    <Modal visible={!!videoUri} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <VideoView style={StyleSheet.absoluteFill} player={player} contentFit="contain" nativeControls />
          {loadFailed && (
            <Pressable style={styles.loadFailedOverlay} onPress={onClose}>
              <View style={styles.loadFailedCard}>
                <AlertCircle size={48} color="rgba(255,255,255,0.8)" />
                <Text style={styles.loadFailedTitle}>視頻加載失敗</Text>
                <Text style={styles.loadFailedHint}>點擊關閉</Text>
              </View>
            </Pressable>
          )}
          <Pressable style={[styles.close, { top: insets.top + 8 }]} onPress={onClose}>
            <X size={28} color="#fff" />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#000' },
  content: { flex: 1, backgroundColor: '#000' },
  close: {
    position: 'absolute',
    right: spacing.xl,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadFailedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadFailedCard: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadFailedTitle: { fontSize: 18, fontWeight: '800', color: '#fff', marginTop: spacing.md },
  loadFailedHint: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.7)', marginTop: spacing.sm },
});
