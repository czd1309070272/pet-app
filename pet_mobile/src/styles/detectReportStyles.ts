/**
 * 檢測與報告相關共用 UI 樣式
 * DetectScreen、HistoryReportScreen 共用
 */
import { StyleSheet, Platform } from 'react-native';
import { colors, borderRadius, spacing } from '../theme/tokens';

export const detectReportStyles = StyleSheet.create({
  // ---------- 報告圖片（居中） ----------
  reportImageContainer: {
    width: '100%',
    alignItems: 'center' as const,
    marginBottom: spacing.lg,
  },
  reportImageWrap: {
    width: '92%',
    maxWidth: 360,
    borderRadius: 24,
    overflow: 'hidden' as const,
    aspectRatio: 16 / 9,
  },
  reportImage: {
    width: '100%',
    height: '100%',
  },
  reportImageOverlay: {
    position: 'absolute' as const,
    bottom: spacing.lg,
    left: spacing.lg,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  reportImageLabel: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: '#fff',
    letterSpacing: 1,
  },
  reportAvatarWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },

  // ---------- 歷史報告詳情圖片（帶 overlay，圓角 40） ----------
  detailImageContainer: {
    width: '100%',
    alignItems: 'center' as const,
    marginBottom: 24,
  },
  detailImageWrap: {
    width: '100%',
    maxWidth: 360,
    aspectRatio: 16 / 9,
    borderRadius: 40,
    overflow: 'hidden' as const,
  },
  detailImage: {
    width: '100%',
    height: '100%',
  },
  detailImageOverlay: {
    position: 'absolute' as const,
    bottom: 16,
    left: 24,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  detailImageLabel: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: '#fff',
    letterSpacing: 1,
  },

  // ---------- 成分分析：評測結論 ----------
  scannerDetail: {
    marginBottom: 24,
    width: '100%',
  },
  /** GlassCard 包裝用（DetectScreen） */
  summaryBlockWrap: {
    padding: spacing.xl,
    marginBottom: spacing.lg,
    width: '100%',
  },
  /** 普通區塊用（HistoryReportScreen） */
  summaryBlock: {
    padding: 24,
    borderRadius: 32,
    borderWidth: 1,
    marginBottom: 20,
    width: '100%',
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '800' as const,
    letterSpacing: 1,
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '700' as const,
    fontStyle: 'italic' as const,
    lineHeight: 22,
  },

  // ---------- 成分紅榜 ----------
  /** GlassCard 包裝用（DetectScreen） */
  riskBlockWrap: {
    padding: spacing.xl,
    marginBottom: spacing.lg,
    width: '100%',
    
  },
  /** 普通區塊用（HistoryReportScreen） */
  riskBlock: {
    padding: 24,
    borderRadius: 32,
    borderWidth: 1,
    marginBottom: 20,
  },
  riskHead: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
    gap: 8,
    flexWrap: 'wrap' as const,
  },
  riskTitleWrap: {
    flex: 1,
    minWidth: 0,
  },
  riskTitle: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#e11d48',
  },
  riskBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  riskBadgeText: {
    fontSize: 9,
    fontWeight: '800' as const,
    color: '#fff',
  },
  tagWrap: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  riskTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    maxWidth: '100%',
  },
  riskTagText: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: '#dc2626',
  },
  riskEmpty: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#f43f5e',
  },

  // ---------- 成分綠榜 ----------
  /** GlassCard 包裝用（DetectScreen） */
  safeBlockWrap: {
    padding: spacing.xl,
    marginBottom: spacing.lg,
    width: '100%',
  },
  /** 普通區塊用（HistoryReportScreen） */
  safeBlock: {
    padding: 24,
    borderRadius: 32,
    borderWidth: 1,
    marginBottom: 20,
  },
  safeHead: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
    gap: 8,
    flexWrap: 'wrap' as const,
  },
  safeTitleWrap: {
    flex: 1,
    minWidth: 0,
  },
  safeTitle: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#059669',
  },
  safeBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  safeBadgeText: {
    fontSize: 9,
    fontWeight: '800' as const,
    color: '#fff',
  },
  safeTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    maxWidth: '100%',
  },
  safeTagText: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: '#059669',
  },

  // ---------- 成分分析結果新佈局：AI 結論 / 有風險 / 無風險 ----------
  scannerSection: {
    marginBottom: spacing.lg,
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden' as const,
  },
  scannerSectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: 10,
  },
  scannerSectionTitle: {
    fontSize: 15,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
  },
  scannerSectionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  scannerSectionBadgeText: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: '#fff',
  },
  scannerSectionBody: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: 8,
  },
  aiConclusionWrap: {
    padding: spacing.xl,
    marginBottom: spacing.lg,
    width: '100%',
  },
  aiConclusionBlock: {
    padding: spacing.xl,
    borderRadius: 20,
    borderWidth: 1,
    width: '100%',
  },
  aiConclusionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.md,
    gap: 8,
  },
  aiConclusionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  aiConclusionLabel: {
    fontSize: 13,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
  },
  aiConclusionText: {
    fontSize: 15,
    fontWeight: '600' as const,
    lineHeight: 24,
    letterSpacing: 0.2,
  },
  riskSectionHeader: {
    backgroundColor: 'rgba(225, 29, 72, 0.12)',
  },
  riskSectionBody: {
    backgroundColor: 'rgba(254, 226, 226, 0.6)',
  },
  riskSectionBodyDark: {
    backgroundColor: 'rgba(190, 18, 60, 0.08)',
  },
  riskSectionTitle: {
    color: '#b91c1c',
  },
  riskSectionBadge: {
    backgroundColor: '#dc2626',
  },
  riskItemRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    marginBottom: 6,
    gap: 10,
  },
  riskItemRowBg: {
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  riskItemRowBgDark: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
  },
  riskItemBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e11d48',
  },
  riskItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#991b1b',
  },
  riskItemTextDark: {
    color: '#fca5a5',
  },
  riskEmptyWrap: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center' as const,
  },
  riskEmptyText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#b91c1c',
  },
  safeSectionHeader: {
    backgroundColor: 'rgba(5, 150, 105, 0.12)',
  },
  safeSectionBody: {
    backgroundColor: 'rgba(209, 250, 229, 0.5)',
  },
  safeSectionBodyDark: {
    backgroundColor: 'rgba(5, 150, 105, 0.08)',
  },
  safeSectionTitle: {
    color: '#047857',
  },
  safeSectionBadge: {
    backgroundColor: '#059669',
  },
  safeItemRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    marginBottom: 6,
    gap: 10,
  },
  safeItemRowBg: {
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  safeItemRowBgDark: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
  },
  safeItemBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  safeItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#065f46',
  },
  safeItemTextDark: {
    color: '#6ee7b7',
  },

  // ---------- 重新掃描按鈕 ----------
  rescanBtn: {
    paddingVertical: 20,
    borderRadius: 24,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    width: '100%',
  },
  rescanBtnText: {
    fontSize: 14,
    fontWeight: '800' as const,
  },

  // ---------- DetectScreen：佈局與 Tab ----------
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.xl, paddingBottom: spacing.xl * 2, paddingHorizontal: spacing.xl },
  historyBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center' as const, justifyContent: 'center' as const },
  tabCard: { marginBottom: spacing.xl },
  tabRow: { flexDirection: 'row' as const, padding: 4 },
  tabItem: { flex: 1, paddingVertical: 12, borderRadius: borderRadius.xl, alignItems: 'center' as const },
  tabItemActive: {
    backgroundColor: '#fff',
    ...(Platform.OS === 'ios' ? { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 } : { elevation: 2 }),
  },
  tabItemActiveDark: { backgroundColor: colors.slate[800] },
  tabText: { fontSize: 13, fontWeight: '800' as const },

  // ---------- 寵物選擇器 ----------
  label: { fontSize: 10, fontWeight: '800' as const, letterSpacing: 1, marginBottom: spacing.sm, paddingHorizontal: 4 },
  petPicker: { flexDirection: 'row' as const, alignItems: 'center' as const, padding: spacing.lg, borderRadius: 32, borderWidth: 1, marginBottom: spacing.md },
  petAvatar: { width: 64, height: 64, borderRadius: 16, marginRight: spacing.lg },
  petPickerBody: { flex: 1 },
  petName: { fontSize: 18, fontWeight: '800' as const },
  petMeta: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8, marginTop: 4 },
  breedTag: { backgroundColor: 'rgba(59, 130, 246, 0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  breedTagText: { fontSize: 9, fontWeight: '800' as const, color: '#3b82f6' },
  petGender: { fontSize: 9, fontWeight: '700' as const },
  petBody: { flex: 1 },
  petPlaceholder: { flex: 1, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8 },
  petPlaceholderText: { fontSize: 14, fontWeight: '700' as const },
  petDropdown: { borderRadius: 32, borderWidth: 1, padding: 8, marginBottom: spacing.xl, maxHeight: 260 },
  petOption: { flexDirection: 'row' as const, alignItems: 'center' as const, padding: 12, borderRadius: 16, gap: 12 },
  petOptionActive: { backgroundColor: 'rgba(59, 130, 246, 0.2)' },
  petOptionAvatar: { width: 40, height: 40, borderRadius: 12 },
  petOptionName: { flex: 1, fontSize: 12, fontWeight: '800' as const },
  petOptionBreed: { fontSize: 8, fontWeight: '700' as const },

  // ---------- 檢測模式切換 ----------
  modeTabs: { flexDirection: 'row' as const, padding: 4, borderRadius: 16, marginBottom: spacing.xl },
  modeTab: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' as const },
  modeTabActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  modeTabActiveDark: { backgroundColor: colors.slate[800] },
  modeTabText: { fontSize: 12, fontWeight: '800' as const },

  // ---------- 上傳區與操作按鈕 ----------
  uploadZoneTextOnly: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  uploadTitle: { fontSize: 16, fontWeight: '800' as const, marginBottom: 4, textAlign: 'center' as const, paddingHorizontal: spacing.xs },
  uploadSub: { fontSize: 12, fontWeight: '700' as const, textAlign: 'center' as const, paddingHorizontal: spacing.xs },
  actionRow: { flexDirection: 'row' as const, gap: spacing.lg },
  actionCard: { flex: 1, padding: spacing.xl, borderRadius: 28, borderWidth: 1, alignItems: 'center' as const, gap: 12 },
  actionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#3b82f6',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  actionCardText: { fontSize: 14, fontWeight: '800' as const },

  // ---------- 掃描中 / 分析中 ----------
  scanningWrap: { alignItems: 'center' as const, paddingVertical: 48, gap: spacing.lg },
  scanningIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 32,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  scanningTitle: { fontSize: 18, fontWeight: '800' as const },
  scanningSub: { fontSize: 12, fontWeight: '700' as const, letterSpacing: 1 },
  analyzingText: { fontSize: 14, fontWeight: '800' as const },

  // ---------- 翻譯報告結果（與歷史翻譯報告詳情共用） ----------
  resultHead: { flexDirection: 'row' as const, alignItems: 'center' as const, marginBottom: spacing.lg, gap: 12 },
  resultPetAvatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: '#3b82f6' },
  resultHeadBody: { flex: 1 },
  resultHeadTitle: { fontSize: 14, fontWeight: '800' as const },
  resultHeadMeta: { fontSize: 10, fontWeight: '700' as const },
  resultActionBtn: { flex: 1 },
  resultActionText: { fontSize: 14, fontWeight: '800' as const },
  resultActionPrimary: {
    backgroundColor: '#3b82f6',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 16,
    borderRadius: borderRadius['2xl'],
  },
  resultActionPrimaryText: { color: '#fff', fontWeight: '800' as const, fontSize: 14 },
  /** 底部操作按鈕行（重新檢測 + 存入檔案） */
  resultActionsRow: {
    flexDirection: 'row' as const,
    gap: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    width: '100%',
  },
  /** 翻譯官區塊標題（原文片段 / 大白話翻譯） */
  translatorSectionTitle: {
    fontSize: 12,
    fontWeight: '800' as const,
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  /** 原文片段列表容器 */
  translatorFragmentsWrap: { marginBottom: spacing.xl, gap: spacing.md },
  /** 單條原文片段卡片（報告結果頁與歷史詳情共用） */
  translatorFragmentCard: {
    padding: spacing.lg,
    borderRadius: 20,
    borderWidth: 1,
  },
  translatorFragmentText: { fontSize: 14, fontStyle: 'italic' as const, fontWeight: '600' as const, lineHeight: 22 },
  /** 大白話解釋+建議列表容器 */
  translatorExplainBlocksWrap: { marginBottom: spacing.xl, gap: spacing.lg },
  /** 單組大白話解釋+建議卡片（報告結果頁與歷史詳情共用） */
  translatorExplainBlockCard: {
    padding: spacing.xl,
    borderRadius: 24,
    borderWidth: 1,
  },
  translatorExplainBlockLabel: { fontSize: 10, fontWeight: '800' as const, letterSpacing: 1, marginBottom: 8 },
  translatorExplainBlockText: { fontSize: 14, fontWeight: '600' as const, lineHeight: 22, marginBottom: spacing.md },
  translatorSuggestionsList: { gap: 4 },
  translatorSuggestionItem: { fontSize: 12, fontWeight: '700' as const },
  termBlockWrap: { padding: spacing.lg, marginBottom: spacing.lg },
  termLabel: { fontSize: 10, fontWeight: '800' as const, letterSpacing: 1, marginBottom: 8 },
  termText: { fontSize: 12, fontStyle: 'italic' as const, fontWeight: '600' as const },
  arrowWrap: { alignItems: 'center' as const, marginBottom: spacing.lg },
  explainBlockWrap: { padding: spacing.xl, marginBottom: spacing.xl },
  explainHead: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8, marginBottom: spacing.lg },
  explainTitle: { fontSize: 14, fontWeight: '800' as const },
  explainContent: { padding: spacing.lg, borderRadius: 24, borderWidth: 1, marginBottom: spacing.md },
  explainLabel: { fontSize: 10, fontWeight: '800' as const, letterSpacing: 1, marginBottom: 8 },
  explainText: { fontSize: 14, fontWeight: '600' as const, lineHeight: 22 },
  suggestionItem: { fontSize: 12, fontWeight: '700' as const, marginBottom: 4 },

  // ---------- HistoryReportScreen：篩選、列表、詳情 ----------
  filterWrap: { marginTop: -12, marginBottom: 6 },
  filterScroll: { height: 32 },
  filterContent: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8, paddingRight: spacing.xl },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10, justifyContent: 'center' as const },
  filterChipActive: {},
  filterChipMemorial: {},
  filterChipText: { fontSize: 10, fontWeight: '800' as const, color: colors.gray[500] },
  scrollContentHistory: { paddingTop: spacing.md },
  emptyWrap: { alignItems: 'center' as const, justifyContent: 'center' as const, paddingVertical: 80, opacity: 0.6 },
  emptyText: { fontSize: 14, fontWeight: '800' as const, marginTop: 16 },
  card: {
    flexDirection: 'row' as const,
    padding: 16,
    borderRadius: 32,
    borderWidth: 1,
    marginBottom: 12,
  },
  cardThumb: { width: 80, height: 80, borderRadius: 16, marginRight: 16, backgroundColor: colors.gray[50] },
  cardBody: { flex: 1, minWidth: 0, justifyContent: 'space-between' as const },
  cardTitle: { fontSize: 14, fontWeight: '800' as const },
  cardSummary: { fontSize: 11, marginTop: 4 },
  cardFooter: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, marginTop: 8 },
  cardDateRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4 },
  cardDate: { fontSize: 10, fontWeight: '700' as const },
  statusBadge: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  statusBadgeText: { fontSize: 9, fontWeight: '800' as const },
  detail: { paddingBottom: 24 },

  // ---------- 報告詳情塊（翻譯官） ----------
  reportBlock: { padding: 24, borderRadius: 32, borderWidth: 1, marginBottom: 24 },
  reportHead: { flexDirection: 'row' as const, alignItems: 'center' as const, marginBottom: 20, gap: 12 },
  reportIconWrap: { width: 48, height: 48, borderRadius: 16, alignItems: 'center' as const, justifyContent: 'center' as const },
  reportHeadBody: { flex: 1, minWidth: 0 },
  reportHeadTitle: { fontSize: 18, fontWeight: '800' as const },
  reportHeadDate: { fontSize: 10, fontWeight: '800' as const, marginTop: 4 },
  reportContent: { padding: 24, borderRadius: 32, borderWidth: 1, marginBottom: 0 },
  reportContentLabel: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6, marginBottom: 12 },
  reportContentLabelText: { fontSize: 10, fontWeight: '800' as const, letterSpacing: 1 },
  reportContentText: { fontSize: 14, fontWeight: '600' as const, lineHeight: 24, letterSpacing: 0.3 },

  // ---------- 詳情頁操作按鈕 ----------
  actionsRow: { flexDirection: 'row' as const, gap: 12, padding: 24, borderRadius: 40, borderWidth: 1 },
  actionBtn: { flex: 1, flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 8, paddingVertical: 16, borderRadius: 16 },
  actionBtnSecondary: { backgroundColor: 'rgba(225,29,72,0.08)' },
  actionBtnSecondaryText: { fontSize: 12, fontWeight: '800' as const, color: '#e11d48' },
  actionBtnPrimary: { backgroundColor: colors.orange[500] },
  actionBtnPrimaryText: { fontSize: 12, fontWeight: '800' as const, color: '#fff' },

  // ---------- 刪除確認 Modal ----------
  modalRoot: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' as const, paddingHorizontal: 24, paddingBottom: 120 },
  deleteConfirmCard: { borderRadius: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(244,63,94,0.2)' },
  deleteConfirmHead: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8, marginBottom: 16 },
  deleteConfirmTitle: { fontSize: 10, fontWeight: '800' as const, color: '#e11d48', textTransform: 'uppercase' as const },
  deleteConfirmActions: { flexDirection: 'row' as const, gap: 8 },
  deleteConfirmBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' as const, justifyContent: 'center' as const },
  deleteConfirmBtnPrimary: { backgroundColor: '#e11d48' },
  deleteConfirmBtnPrimaryText: { fontSize: 10, fontWeight: '800' as const, color: '#fff' },
  deleteConfirmBtnCancel: { backgroundColor: colors.gray[50] },
  deleteConfirmBtnCancelText: { fontSize: 10, fontWeight: '800' as const },
});
