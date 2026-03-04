import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { RotateCw } from 'lucide-react-native';
import { REFRESH_PROMPT_HEIGHT } from './constants';

/** TikTok 式下拉刷新：用戶有下拉動作時頂部彈出提示，松手即刷新（無需下拉視頻） */
export function RefreshPromptOverlay({
  visible,
  refreshing,
  insetsTop,
}: {
  visible: boolean;
  refreshing: boolean;
  insetsTop: number;
}) {
  const spinValue = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const targetOpacity = visible || refreshing ? 1 : 0;
  useEffect(() => {
    Animated.timing(opacityAnim, {
      toValue: targetOpacity,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [targetOpacity, opacityAnim]);
  useEffect(() => {
    if (refreshing) {
      const loop = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        })
      );
      loop.start();
      return () => loop.stop();
    }
    spinValue.setValue(0);
  }, [refreshing, spinValue]);
  const spin = spinValue.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <Animated.View
      style={[
        refreshPromptStyles.overlay,
        { top: 0, paddingTop: insetsTop + 80, opacity: opacityAnim },
      ]}
      pointerEvents="none"
    >
      <View style={refreshPromptStyles.inner}>
        {refreshing ? (
          <>
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <RotateCw size={28} color="#fff" strokeWidth={2.5} />
            </Animated.View>
            <View style={refreshPromptStyles.labelWrap}>
              <Text
                numberOfLines={1}
                style={{
                  color: '#ffffff',
                  fontSize: 15,
                  lineHeight: 20,
                  fontWeight: '700',
                  textAlign: 'center',
                }}
              >
                刷新中...
              </Text>
            </View>
          </>
        ) : (
          <View style={refreshPromptStyles.labelWrap}>
            <Text
              numberOfLines={1}
              style={{
                color: '#ffffff',
                fontSize: 15,
                lineHeight: 20,
                fontWeight: '700',
                textAlign: 'center',
              }}
            >
              下拉刷新推荐
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const refreshPromptStyles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: REFRESH_PROMPT_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    elevation: 100,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  labelWrap: {
    marginLeft: 10,
    width: 110,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    ...(Platform.OS === 'android' && { elevation: 10 }),
  },
  label: {
    color: '#ffffff',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700' as const,
    textAlign: 'center',
    backgroundColor: 'transparent',
    ...(Platform.OS === 'android' && { fontFamily: 'sans-serif' }),
  },
});
