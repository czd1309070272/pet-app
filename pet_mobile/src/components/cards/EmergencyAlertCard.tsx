/**
 * 緊急情況警示卡 - 紅色嚴重度（最高）
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import type { EmergencyAlertCardData } from './types';
import { SEVERITY_COLORS, SEVERITY_BG } from './severityConfig';
import { spacing } from '../../theme/tokens';

interface EmergencyAlertCardProps extends EmergencyAlertCardData {
  dark?: boolean;
}

export function EmergencyAlertCard({
  title = '🚨 緊急情況警示',
  content,
  dark = false,
}: EmergencyAlertCardProps) {
  const color = SEVERITY_COLORS.urgent;
  const bg = dark ? SEVERITY_BG.urgent.dark : SEVERITY_BG.urgent.light;
  const textColor = dark ? '#f8fafc' : '#1f2937';
  const subColor = dark ? '#9ca3af' : '#6b7280';

  return (
    <View style={[styles.wrap, { backgroundColor: bg }]}>
      <View style={styles.header}>
        <AlertTriangle size={20} color={color} strokeWidth={2.5} />
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
    borderColor: 'rgba(220, 38, 38, 0.35)',
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
