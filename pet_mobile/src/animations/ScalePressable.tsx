import React from 'react';
import { Pressable, Animated, ViewStyle, StyleProp } from 'react-native';
import { usePressScaleAnimation } from './usePressScaleAnimation';

type ScalePressableProps = {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * 带下压动画的 Pressable：按下时缩小，松开时弹性恢复
 * 主页卡片等可点击区域可直接使用
 */
export function ScalePressable({ children, onPress, style }: ScalePressableProps) {
  const { scaleAnim, handlePressIn, handlePressOut } = usePressScaleAnimation();

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={style}
    >
      <Animated.View style={{ flex: 1, transform: [{ scale: scaleAnim }] }}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
