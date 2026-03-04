/**
 * 设计 token - 与 Web 端 index.html tailwind.config 与全局样式一致
 */
export const colors = {
  orange: {
    50: '#fff7ed',
    100: '#ffedd5',
    500: '#f97316',
    600: '#ea580c',
  },
  gray: {
    50: '#f9fafb',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    800: '#1f2937',
  },
  slate: {
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },
  /** 衬托毛玻璃效果的页面背景：可爱温暖色调，适配宠物 app */
  glassBg: {
    light: '#fdf2e9',
    dark: '#1c1814',
  },
  /** 毛玻璃卡片色：暖色叠加与描边，替代单调透明白 */
  glassCard: {
    tintLight: 'rgba(255, 242, 230, 0.5)',
    tintDark: 'rgba(40, 32, 28, 0.4)',
    borderLight: 'rgba(255, 235, 215, 0.7)',
    borderDark: 'rgba(255, 235, 215, 0.12)',
  },
  white: '#ffffff',
  black: '#000000',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
};

/** 玻璃卡片阴影 - 暖色系强层次感，适配宠物 app */
export const shadowGlass = {
  light: {
    shadowColor: '#c47b4a',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.35,
    shadowRadius: 40,
    elevation: 18,
  },
  dark: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.78,
    shadowRadius: 44,
    elevation: 22,
  },
};
