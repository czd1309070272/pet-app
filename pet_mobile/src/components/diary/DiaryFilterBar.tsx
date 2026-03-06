import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '../../theme/tokens';

const styles = StyleSheet.create({
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    marginBottom: spacing.xl,
  },
  filterBarText: { fontSize: 12, fontWeight: '700', color: colors.orange[600] },
  filterBarLink: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
});

export function DiaryFilterBar({
  filterDate,
  subColor,
  onReplaceDate,
}: {
  filterDate: string;
  subColor: string;
  onReplaceDate: () => void;
}) {
  return (
    <View
      style={[
        styles.filterBar,
        {
          backgroundColor: 'rgba(249, 115, 22, 0.1)',
          borderColor: 'rgba(249, 115, 22, 0.2)',
        },
      ]}
    >
      <Text style={styles.filterBarText}>正在回味: {filterDate}</Text>
      <Pressable onPress={onReplaceDate}>
        <Text style={[styles.filterBarLink, { color: subColor }]}>更換日期</Text>
      </Pressable>
    </View>
  );
}
