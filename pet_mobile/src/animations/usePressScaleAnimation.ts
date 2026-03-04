import { useRef } from 'react';
import { Animated } from 'react-native';

const PRESS_SCALE = 0.96;
const ANIM_DURATION = 120;

/**
 * 按钮下压动画 Hook：按下时缩小，松开时恢复
 * @returns { scaleAnim, handlePressIn, handlePressOut } 供 Animated.View 的 transform 和 Pressable 事件使用
 */
export function usePressScaleAnimation() {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: PRESS_SCALE,
      duration: ANIM_DURATION,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 200,
      friction: 15,
    }).start();
  };

  return {
    scaleAnim,
    handlePressIn,
    handlePressOut,
  };
}
