/**
 * 品種/年齡特殊風險卡 - 個性化警示，橙色或黃色
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Dog } from 'lucide-react-native';
import type { BreedAgeRiskCardData } from './types';
import { SEVERITY_COLORS, SEVERITY_BG } from './severityConfig';
import { spacing } from '../../theme/tokens';

type SeverityLevel = 'urgent' | 'medication' | 'disclaimer' | 'info';

interface BreedAgeRiskCardProps extends BreedAgeRiskCardData {
  dark?: boolean;
}

export function BreedAgeRiskCard({
  title,
  content,
  petInfo,
  severity = 'medication',
  dark = false,
}: BreedAgeRiskCardProps) {
  const color = SEVERITY_COLORS[severity as SeverityLevel] ?? SEVERITY_COLORS.medication;
  const bgKey = severity as SeverityLevel;
  const bg = dark ? SEVERITY_BG[bgKey]?.dark ?? SEVERITY_BG.medication.dark : SEVERITY_BG[bgKey]?.light ?? SEVERITY_BG.medication.light;
  const textColor = dark ? '#f8fafc' : '#1f2937';
  const subColor = dark ? '#9ca3af' : '#6b7280';

  const displayTitle = title ?? `🐾 ${petInfo ? `${petInfo} 特殊風險提醒` : '個性化風險警示'}`;

  return (
    <View style={[styles.wrap, { backgroundColor: bg }]}>
      <View style={styles.header}>
        <Dog size={18} color={color} strokeWidth={2.5} />
        <Text style={[styles.title, { color: textColor }]}>{displayTitle}</Text>
      </View>
      {petInfo && (
        <Text style={[styles.petInfo, { color: subColor }]}>{petInfo}</Text>
      )}
      <Text style={[styles.content, { color: subColor }]}>{content}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(234, 88, 12, 0.2)',
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
  },
  petInfo: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: spacing.sm,
    fontStyle: 'italic',
  },
  content: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },
});
