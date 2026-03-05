/**
 * 長條形免責聲明/非醫療建議卡 - 黃色，置於最底部
 */
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { FileWarning } from 'lucide-react-native';
import type { DisclaimerCardData } from './types';
import { SEVERITY_COLORS, SEVERITY_BG } from './severityConfig';
import { spacing } from '../../theme/tokens';

interface DisclaimerCardProps extends DisclaimerCardData {
  dark?: boolean;
}

export function DisclaimerCard({
  content,
  dark = false,
}: DisclaimerCardProps) {
  const color = SEVERITY_COLORS.disclaimer;
  const bg = dark ? SEVERITY_BG.disclaimer.dark : SEVERITY_BG.disclaimer.light;
  const subColor = dark ? '#9ca3af' : '#6b7280';

  const defaultContent = '本服務僅供參考，不構成獸醫或醫療建議。如寵物出現異常，請及時就醫。';

  return (
    <View style={[styles.wrap, { backgroundColor: bg }]}>
      <View style={styles.barRow}>
        <FileWarning size={14} color={color} strokeWidth={2.5} />
        <View style={styles.textWrap}>
          <Text style={[styles.content, { color: subColor }]}>
            {content ?? defaultContent}
          </Text>
        </View>
      </View>
    </View>
  );
}

const MAX_CARD_WIDTH = Dimensions.get('window').width * 0.78;

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'stretch',
    maxWidth: MAX_CARD_WIDTH,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(202, 138, 4, 0.25)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textWrap: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    overflow: 'hidden',
  },
  content: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
  },
});
