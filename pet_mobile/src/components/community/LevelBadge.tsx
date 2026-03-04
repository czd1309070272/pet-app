import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const colorMap: Record<number, string> = {
  0: '#d1d5db',
  1: '#9ca3af',
  2: '#6b7280',
  3: '#60a5fa',
  4: '#3b82f6',
  5: '#f97316',
  6: '#f43f5e',
};

export function LevelBadge({ level = 3 }: { level?: number }) {
  const bg = colorMap[level] ?? colorMap[0];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={styles.text}>LV{level}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    minWidth: 28,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { color: '#fff', fontSize: 9, fontWeight: '800' },
});
