/**
 * 用藥/喂食風險卡 - 橙色嚴重度
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Pill } from 'lucide-react-native';
import type { MedicationFeedingRiskCardData } from './types';
import { SEVERITY_COLORS, SEVERITY_BG } from './severityConfig';
import { spacing } from '../../theme/tokens';

interface MedicationFeedingRiskCardProps extends MedicationFeedingRiskCardData {
  dark?: boolean;
}

export function MedicationFeedingRiskCard({
  title = '⚠️ 用藥/喂食風險提醒',
  content,
  dark = false,
}: MedicationFeedingRiskCardProps) {
  const color = SEVERITY_COLORS.medication;
  const bg = dark ? SEVERITY_BG.medication.dark : SEVERITY_BG.medication.light;
  const textColor = dark ? '#f8fafc' : '#1f2937';
  const subColor = dark ? '#9ca3af' : '#6b7280';

  return (
    <View style={[styles.wrap, { backgroundColor: bg }]}>
      <View style={styles.header}>
        <Pill size={18} color={color} strokeWidth={2.5} />
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
    borderColor: 'rgba(234, 88, 12, 0.25)',
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
