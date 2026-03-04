/**
 * 图片查看器：左右滑动切换、双指缩放、点击退出
 */
import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Image,
  ScrollView,
  StyleSheet,
  Platform,
  TouchableWithoutFeedback,
  PanResponder,
  Animated,
  Dimensions,
} from 'react-native';
import { imageUri } from './utils';
import { COMMUNITY_LAYOUT } from './constants';

const { SCREEN_WIDTH, SCREEN_HEIGHT } = COMMUNITY_LAYOUT;
const MIN_PINCH_DISTANCE = 20;

function ImageViewerPage({
  uri,
  scaleAnim,
  onTap,
}: {
  uri: string;
  scaleAnim: Animated.Value;
  onTap: () => void;
}) {
  return (
    <TouchableWithoutFeedback onPress={onTap}>
      <View style={styles.pageInner}>
        <Animated.View style={[styles.pageInner, { transform: [{ scale: scaleAnim }] }]}>
          <Image source={{ uri: imageUri(uri) }} style={styles.img} resizeMode="contain" />
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
}

export interface ImageViewerModalProps {
  uris: string[];
  scrollRef: React.RefObject<ScrollView | null>;
  viewingImageIndex: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
}

export function ImageViewerModal({
  uris,
  scrollRef,
  viewingImageIndex,
  onIndexChange,
  onClose,
}: ImageViewerModalProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const savedScale = useRef(1);
  const initialDistance = useRef(0);

  const getDistance = useCallback((touches: { pageX: number; pageY: number }[]) => {
    if (touches.length < 2) return 0;
    const [a, b] = touches;
    return Math.hypot(b.pageX - a.pageX, b.pageY - a.pageY);
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt) => evt.nativeEvent.touches.length >= 2,
      onPanResponderGrant: (evt) => {
        if (evt.nativeEvent.touches.length >= 2) {
          const d = getDistance(evt.nativeEvent.touches);
          initialDistance.current = d >= MIN_PINCH_DISTANCE ? d : 0;
        }
      },
      onPanResponderMove: (evt) => {
        if (evt.nativeEvent.touches.length >= 2) {
          const dist = getDistance(evt.nativeEvent.touches);
          if (dist < MIN_PINCH_DISTANCE) return;
          if (initialDistance.current < MIN_PINCH_DISTANCE) {
            initialDistance.current = dist;
            return;
          }
          const newScale = (savedScale.current * dist) / initialDistance.current;
          const clamped = Math.min(Math.max(newScale, 1), 5);
          savedScale.current = clamped;
          scaleAnim.setValue(clamped);
        }
      },
      onPanResponderRelease: () => {
        initialDistance.current = 0;
      },
      onPanResponderTerminate: () => {
        initialDistance.current = 0;
      },
    })
  ).current;

  useEffect(() => {
    scaleAnim.setValue(1);
    savedScale.current = 1;
    initialDistance.current = 0;
  }, [viewingImageIndex, scaleAnim]);

  const isIOS = Platform.OS === 'ios';

  if (isIOS) {
    return (
      <View style={styles.pinchWrap}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const x = e.nativeEvent.contentOffset.x;
            const idx = Math.round(x / SCREEN_WIDTH);
            onIndexChange(Math.min(idx, uris.length - 1));
          }}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
        >
          {uris.map((uri, i) => (
            <View key={uri + i} style={styles.page}>
              <ScrollView
                style={styles.pageInner}
                contentContainerStyle={styles.zoomContent}
                maximumZoomScale={5}
                minimumZoomScale={1}
                pinchGestureEnabled
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
              >
                <TouchableWithoutFeedback onPress={onClose}>
                  <Image source={{ uri: imageUri(uri) }} style={styles.img} resizeMode="contain" />
                </TouchableWithoutFeedback>
              </ScrollView>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.pinchWrap} {...panResponder.panHandlers}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const x = e.nativeEvent.contentOffset.x;
          const idx = Math.round(x / SCREEN_WIDTH);
          onIndexChange(Math.min(idx, uris.length - 1));
        }}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {uris.map((uri, i) => (
          <View key={uri + i} style={styles.page}>
            <ImageViewerPage uri={uri} scaleAnim={scaleAnim} onTap={onClose} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pinchWrap: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  page: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageInner: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  zoomContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: SCREEN_WIDTH,
    minHeight: SCREEN_HEIGHT,
  },
  img: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
});
