import { useMemo } from 'react';
import { colors, borderRadius, spacing, shadowGlass } from './tokens';

export type ColorScheme = 'light' | 'dark';

export function useTheme(isDark: boolean) {
  return useMemo(() => {
    const scheme: ColorScheme = isDark ? 'dark' : 'light';
    return {
      scheme,
      colors: {
        ...colors,
        background: isDark ? colors.slate[950] : '#fff9f5',
        backgroundSecondary: isDark ? colors.slate[900] : '#f3f7ff',
        text: isDark ? '#f8fafc' : '#1e293b',
        textSecondary: isDark ? colors.gray[400] : colors.gray[600],
        glass: isDark
          ? 'rgba(30, 41, 59, 0.85)'
          : 'rgba(255, 255, 255, 0.7)',
        glassBorder: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.45)',
        shadowGlass: isDark ? shadowGlass.dark : shadowGlass.light,
      },
      borderRadius,
      spacing,
    };
  }, [isDark]);
}

export type AppTheme = ReturnType<typeof useTheme>;
