/**
 * 隱私與數據使用卡 - 可選，合規推薦，藍色信息性
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Shield } from 'lucide-react-native';
import type { PrivacyDataCardData } from './types';
import { SEVERITY_COLORS, SEVERITY_BG } from './severityConfig';
import { spacing } from '../../theme/tokens';

interface PrivacyDataCardProps extends PrivacyDataCardData {
  dark?: boolean;
}

export function PrivacyDataCard({
  title = '🔒 隱私與數據使用',
  content,
  dark = false,
}: PrivacyDataCardProps) {
  const color = SEVERITY_COLORS.info;
  const bg = dark ? SEVERITY_BG.info.dark : SEVERITY_BG.info.light;
  const textColor = dark ? '#f8fafc' : '#1f2937';
  const subColor = dark ? '#9ca3af' : '#6b7280';

  return (
    <View style={[styles.wrap, { backgroundColor: bg }]}>
      <View style={styles.header}>
        <Shield size={18} color={color} strokeWidth={2.5} />
        <Text style={[styles.title, { color: textColor }]}>{title}</Text>
      </View>
      <Text style={[styles.content, { color: subColor }]}>{content}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.2)',
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
  },
  content: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },
});
