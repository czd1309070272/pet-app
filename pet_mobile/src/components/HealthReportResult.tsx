import React from 'react';
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  User,
} from 'lucide-react-native';
import { colors, borderRadius, spacing, shadowGlass } from '../theme/tokens';
import { ensureImageUri } from '../utils/imageUri';

/** 健康檢測結果狀態：檢測頁用 Healthy/Observation，歷史記錄用 HEALTHY/WARNING/DANGER/NORMAL */
export type HealthReportStatus =
  | 'Healthy'
  | 'Observation'
  | 'HEALTHY'
  | 'WARNING'
  | 'DANGER'
  | 'NORMAL';

export interface HealthReportResultProps {
  /** 受檢寵物名稱 */
  petName: string;
  /** 標題副標題，如 "檢測完成 · 剛剛" 或日期 */
  subtitle: string;
  /** 狀態 */
  status: HealthReportStatus;
  /** 結果/樣本圖片 URL */
  resultImageUrl: string;
  /** 報告編號 */
  reportNo?: string;
  /** 糞便檢測 | 皮膚掃描 */
  detectType: 'STOOL' | 'SKIN';
  /** 圖像分析摘要 */
  visualSummary: string;
  /** 診斷結論（可選） */
  diagnosis?: string;
  /** 專家建議列表 */
  suggestions: string[];
  /** 深色模式 */
  dark: boolean;
  /** 寵物頭像 URL，不傳則顯示圖標 */
  avatarUri?: string;
  /** 卡片下方操作區（如「重新檢測」「存入健康檔案」或由歷史頁自定義） */
  actions?: React.ReactNode;
}

function GlassCard({
  children,
  style,
  intensity = 64,
  dark,
}: {
  children: React.ReactNode;
  style?: object;
  intensity?: number;
  dark: boolean;
}) {
  const shadow = dark ? shadowGlass.dark : shadowGlass.light;
  const tintColor = dark ? colors.glassCard.tintDark : colors.glassCard.tintLight;
  const borderColor = dark ? colors.glassCard.borderDark : colors.glassCard.borderLight;
  return (
    <View style={[glassStyles.shadowWrap, shadow, style, { overflow: 'visible' }]}>
      <View style={glassStyles.outer}>
        <BlurView
          intensity={intensity}
          tint={dark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={[glassStyles.tintOverlay, { backgroundColor: tintColor }]} />
        <View style={[glassStyles.borderWrap, { borderColor }]}>
          {children}
        </View>
      </View>
    </View>
  );
}

const glassStyles = StyleSheet.create({
  shadowWrap: { borderRadius: borderRadius['3xl'] },
  outer: { flex: 1, borderRadius: borderRadius['3xl'], overflow: 'hidden' },
  tintOverlay: { ...StyleSheet.absoluteFillObject, borderRadius: borderRadius['3xl'] },
  borderWrap: { flex: 1, borderWidth: 1, borderRadius: borderRadius['3xl'], overflow: 'hidden' },
});

function getStatusDisplay(status: HealthReportStatus): { label: string; isHealthy: boolean } {
  switch (status) {
    case 'Healthy':
    case 'HEALTHY':
      return { label: '健康', isHealthy: true };
    case 'Observation':
    case 'WARNING':
    case 'DANGER':
      return { label: '需觀察', isHealthy: false };
    case 'NORMAL':
      return { label: '常規', isHealthy: false };
    default:
      return { label: '常規', isHealthy: false };
  }
}

export function HealthReportResult({
  petName,
  subtitle,
  status,
  resultImageUrl,
  reportNo,
  detectType,
  visualSummary,
  diagnosis,
  suggestions,
  dark,
  avatarUri,
  actions,
}: HealthReportResultProps) {
  const textColor = dark ? '#f8fafc' : colors.gray[800];
  const subColor = dark ? colors.gray[400] : colors.gray[500];
  const glassBorder = dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.45)';
  const { label: statusLabel, isHealthy } = getStatusDisplay(status);
  const detectTypeLabel = detectType === 'SKIN' ? '皮膚掃描' : '糞便檢測';
  const modeLabel = detectType === 'SKIN' ? '皮膚' : '糞便';

  return (
    <>
      <View style={styles.resultHead}>
        {avatarUri ? (
          <Image source={{ uri: ensureImageUri(avatarUri) }} style={styles.resultPetAvatar} />
        ) : (
          <View style={styles.resultPetAvatarWrap}>
            <User size={20} color="#3b82f6" />
          </View>
        )}
        <View style={styles.resultHeadBody}>
          <Text style={[styles.resultHeadTitle, { color: textColor }]}>
            {petName} 的{modeLabel}檢測報告
          </Text>
          <Text style={[styles.resultHeadMeta, { color: subColor }]}>{subtitle}</Text>
        </View>
        <View
          style={[
            styles.resultStatus,
            isHealthy ? { backgroundColor: '#10b981' } : { backgroundColor: colors.orange[500] },
          ]}
        >
          {isHealthy ? (
            <CheckCircle2 size={12} color="#fff" />
          ) : (
            <AlertCircle size={12} color="#fff" />
          )}
          <Text style={styles.resultStatusText}>{statusLabel}</Text>
        </View>
      </View>

      <View style={styles.resultImageContainer}>
        <View style={styles.resultImageWrap}>
          <Image source={{ uri: ensureImageUri(resultImageUrl) }} style={styles.resultImage} resizeMode="cover" />
        </View>
      </View>

      <GlassCard dark={dark} style={styles.reportCardWrap} intensity={64}>
        <View style={styles.reportHeader}>
          <View style={styles.reportHeaderLeft}>
            <FileText size={24} color="#3b82f6" />
            <Text style={[styles.reportTitle, { color: textColor }]}>AI 健康檢測報告書</Text>
          </View>
          {reportNo ? (
            <Text style={[styles.reportNo, { color: subColor }]}>{reportNo}</Text>
          ) : null}
        </View>
        <View style={[styles.reportDivider, { backgroundColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]} />
        <View style={styles.reportMetaRow}>
          <View style={[styles.reportMetaItem, { borderColor: glassBorder }]}>
            <Text style={[styles.reportMetaLabel, { color: subColor }]}>受檢寵物</Text>
            <Text style={[styles.reportMetaValue, { color: textColor }]}>{petName}</Text>
          </View>
          <View style={[styles.reportMetaItem, { borderColor: glassBorder }]}>
            <Text style={[styles.reportMetaLabel, { color: subColor }]}>檢測類型</Text>
            <Text style={[styles.reportMetaValue, { color: textColor }]}>{detectTypeLabel}</Text>
          </View>
          <View style={[styles.reportMetaItem, { borderColor: glassBorder }]}>
            <Text style={[styles.reportMetaLabel, { color: subColor }]}>綜合結論</Text>
            <View
              style={[
                styles.reportConclusionBadge,
                isHealthy ? styles.reportConclusionHealthy : styles.reportConclusionObserve,
              ]}
            >
              {isHealthy ? (
                <CheckCircle2 size={12} color="#fff" />
              ) : (
                <AlertCircle size={12} color="#fff" />
              )}
              <Text style={styles.reportConclusionText}>{statusLabel}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.reportSection, { borderColor: glassBorder }]}>
          <View style={styles.reportSectionHead}>
            <Sparkles size={16} color="#3b82f6" />
            <Text style={[styles.reportSectionTitle, { color: textColor }]}>圖像分析摘要</Text>
          </View>
          <Text style={[styles.reportSectionContent, { color: textColor }]}>{visualSummary}</Text>
        </View>

        {diagnosis ? (
          <View style={[styles.reportSection, { borderColor: glassBorder }]}>
            <Text style={[styles.reportSectionTitle, { color: textColor }]}>診斷結論</Text>
            <Text style={[styles.reportSectionContent, { color: textColor }]}>{diagnosis}</Text>
          </View>
        ) : null}

        <View style={[styles.reportSection, { borderColor: glassBorder }]}>
          <Text style={[styles.reportSectionTitle, { color: textColor }]}>專家建議與後續照護</Text>
          <View style={styles.reportSuggestions}>
            {suggestions.map((s, i) => (
              <View key={i} style={styles.reportSuggestionRow}>
                <View style={styles.reportSuggestionNum}>
                  <Text style={styles.reportSuggestionNumText}>{i + 1}</Text>
                </View>
                <Text style={[styles.reportSuggestionText, { color: textColor }]}>{s}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.reportFooter, { backgroundColor: dark ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.06)' }]}>
          <Text style={[styles.reportDisclaimer, { color: subColor }]}>
            本報告由 AI 輔助生成，僅供參考。如有異常或持續不適，請及時就醫。
          </Text>
        </View>
      </GlassCard>

      {actions ? <View style={styles.resultActions}>{actions}</View> : null}
    </>
  );
}

const styles = StyleSheet.create({
  resultHead: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg, gap: 12 },
  resultPetAvatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: '#3b82f6' },
  resultPetAvatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultHeadBody: { flex: 1 },
  resultHeadTitle: { fontSize: 14, fontWeight: '800' },
  resultHeadMeta: { fontSize: 10, fontWeight: '700' },
  resultStatus: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999 },
  resultStatusText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  resultImageContainer: { alignItems: 'center', width: '100%', marginBottom: spacing.lg },
  resultImageWrap: { width: '100%', maxWidth: 360, borderRadius: 24, overflow: 'hidden', aspectRatio: 16 / 9 },
  resultImage: { width: '100%', height: '100%' },
  reportCardWrap: {
    width: '100%',
    alignSelf: 'stretch',
    padding: spacing.sm - 10,
    marginBottom: spacing.xl,
  },
  reportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md, gap: spacing.sm },
  reportHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 ,marginTop:spacing.lg},
  reportTitle: { fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },
  reportNo: { fontSize: 10, fontWeight: '700', letterSpacing: 1 ,marginTop:spacing.lg,marginRight:spacing.xs},
  reportDivider: { height: 1, marginBottom: spacing.lg },
  reportMetaRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  reportMetaItem: { flex: 1, padding: spacing.md, borderRadius: 12, borderWidth: 1 },
  reportMetaLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  reportMetaValue: { fontSize: 12, fontWeight: '700' },
  reportConclusionBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  reportConclusionHealthy: { backgroundColor: '#10b981' },
  reportConclusionObserve: { backgroundColor: colors.orange[500] },
  reportConclusionText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  reportSection: { padding: spacing.lg, borderRadius: 16, borderWidth: 1, marginBottom: spacing.md },
  reportSectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.sm },
  reportSectionTitle: { fontSize: 13, fontWeight: '800', marginBottom: spacing.sm },
  reportSectionContent: { fontSize: 14, fontWeight: '500', lineHeight: 24 },
  reportSuggestions: { gap: spacing.sm },
  reportSuggestionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  reportSuggestionNum: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(59, 130, 246, 0.2)', alignItems: 'center', justifyContent: 'center' },
  reportSuggestionNumText: { fontSize: 11, fontWeight: '800', color: '#3b82f6' },
  reportSuggestionText: { flex: 1, fontSize: 14, fontWeight: '600', lineHeight: 22 },
  reportFooter: { padding: spacing.md, borderRadius: 12, marginTop: spacing.sm },
  reportDisclaimer: { fontSize: 11, fontWeight: '600', lineHeight: 18, textAlign: 'center' },
  resultActions: { flexDirection: 'row', gap: spacing.md },
});
