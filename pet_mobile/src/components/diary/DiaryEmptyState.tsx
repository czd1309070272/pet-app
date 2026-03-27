import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Heart } from 'lucide-react-native';
import { colors, spacing } from '../../theme/tokens';

const styles = StyleSheet.create({
  empty: { alignItems: 'center', paddingVertical: 48, gap: spacing.lg },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: 14, fontWeight: '800' },
  emptySub: { fontSize: 12, fontWeight: '600' },
});

export function DiaryEmptyState({
  dark,
  glassBg,
}: {
  dark: boolean;
  glassBg: string;
}) {
  const subColor = dark ? colors.gray[400] : colors.gray[500];
  const textColor = dark ? '#f8fafc' : colors.gray[800];

  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIconWrap, { backgroundColor: glassBg }]}>
        <Heart size={32} color={subColor} />
      </View>
      <Text style={[styles.emptyTitle, { color: textColor }]}>
        這天還沒有記錄喔
      </Text>
      <Text style={[styles.emptySub, { color: subColor }]}>
        試著寫下今天發生的趣事吧...
      </Text>
    </View>
  );
}
