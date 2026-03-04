import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  StyleSheet,
  Modal,
  Platform,
  Vibration,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronRight,
  FileText,
  Calendar,
  Trash2,
  CheckCircle2,
  AlertCircle,
  User,
  Stars,
  AlertTriangle,
  XCircle,
  CheckCircle,
  Sparkles,
} from 'lucide-react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../navigation/types';
import type { PetProfile } from '../types';
import { ViewHeader } from '../components/shared/CommonUI';
import { HealthReportResult } from '../components/HealthReportResult';
import { colors, spacing } from '../theme/tokens';
import { detectReportStyles } from '../styles/detectReportStyles';
import { ensureImageUri } from '../utils/imageUri';
import { useApp } from '../context/AppContext';
import * as mockApi from '../api/mock';
import * as frontApi from '../front_api';

export type HistoryReportType = 'HEALTH' | 'SCANNER' | 'TRANSLATOR';

interface ReportItem {
  id: string;
  date: string;
  thumbnail: string;
  title: string;
  summary: string;
  fullReport: string;
  petName: string;
  status?: 'HEALTHY' | 'WARNING' | 'DANGER' | 'NORMAL';
  riskIngredients?: string[];
  safeIngredients?: string[];
  /** 健康檢測與檢測結果 UI 一致時使用 */
  reportNo?: string;
  visualSummary?: string;
  diagnosis?: string;
  suggestions?: string[];
  /** 檢測類型：糞便檢測 | 皮膚掃描 */
  detectType?: 'STOOL' | 'SKIN';
}

type Nav = NativeStackNavigationProp<HomeStackParamList, 'HistoryReport'>;

const MOCK_REPORTS = (type: HistoryReportType): ReportItem[] => [
  {
    id: '1',
    date: '2025-03-20 14:30',
    thumbnail: `https://picsum.photos/seed/${type}1/300/300`,
    petName: '麻薯',
    title: type === 'HEALTH' ? '糞便常規檢測' : type === 'SCANNER' ? '貓糧成分掃描' : '肝功能化驗單解讀',
    summary: type === 'HEALTH' ? '一切指標正常，繼續保持。' : type === 'SCANNER' ? '含肉量高，無有害添加。' : 'ALT 指標略高，建議清淡飲食。',
    status: type === 'HEALTH' ? 'HEALTHY' : 'NORMAL',
    fullReport: '根據 AI 深度分析：\n\n1. 視覺特徵：形態飽滿，顏色正常。\n2. 潛在風險：未發現明顯異常。\n3. 專家建議：最近氣候乾燥，可以適當增加飲水量，觀察 48 小時。',
    riskIngredients: type === 'SCANNER' ? ['不明來源動物油脂', '人造誘食劑'] : undefined,
    safeIngredients: type === 'SCANNER' ? ['新鮮雞肉 (40%)', '脫水三文魚', '豌豆纖維', '益生菌', '牛磺酸'] : undefined,
    reportNo: type === 'HEALTH' ? 'HK20250320-143000' : undefined,
    visualSummary: type === 'HEALTH' ? '樣本形態飽滿，色澤正常，質地均勻。未見明顯異物、寄生蟲卵或異常色素。水分含量在正常範圍內。' : undefined,
    diagnosis: type === 'HEALTH' ? '綜合圖像分析與特徵比對，本次糞便樣本各項指標均在正常參考範圍內，暫未發現需進一步就醫的異常徵象。' : undefined,
    suggestions: type === 'HEALTH' ? ['每日飲水充足', '可適量補充纖維', '若持續異常請就醫'] : undefined,
    detectType: type === 'HEALTH' ? 'STOOL' : undefined,
  },
  {
    id: '2',
    date: '2025-03-15 09:15',
    thumbnail: `https://picsum.photos/seed/${type}2/300/300`,
    petName: '豆腐',
    title: type === 'HEALTH' ? '皮膚局部掃描' : type === 'SCANNER' ? '進口凍乾零食' : '血常規報告翻譯',
    summary: type === 'HEALTH' ? '發現真菌感染跡象，請及時處理。' : type === 'SCANNER' ? '發現潛在致敏原：大豆。' : '白血球升高，疑似炎症感染。',
    status: 'WARNING',
    fullReport: '詳細解讀結果：\n\n- 指標分析：數據顯示異常偏移，可能存在初期病理變化。\n- 健康警示：請密切注意寵物是否有瘙癢或精神不振等情況。\n- 醫囑翻譯：建議帶到線下診所進行更深入的臨床檢查，避免延誤病情。',
    riskIngredients: type === 'SCANNER' ? ['大豆蛋白', '山梨酸鉀 (防腐劑)'] : undefined,
    safeIngredients: type === 'SCANNER' ? ['純牛肉凍乾', '牛心', '牛肝'] : undefined,
    reportNo: type === 'HEALTH' ? 'HK20250315-091500' : undefined,
    visualSummary: type === 'HEALTH' ? '掃描區域可見輕度紅斑與皮屑，局部毛髮稀疏，建議結合臨床進一步確診。' : undefined,
    diagnosis: type === 'HEALTH' ? '圖像特徵提示存在真菌或細菌感染跡象，建議保持患處乾燥並就醫用藥。' : undefined,
    suggestions: type === 'HEALTH' ? ['保持患處清潔乾燥', '避免寵物抓撓', '及時就醫用藥'] : undefined,
    detectType: type === 'HEALTH' ? 'SKIN' : undefined,
  },
  {
    id: '3',
    date: '2024-01-10 11:20',
    thumbnail: `https://picsum.photos/seed/${type}3/300/300`,
    petName: '糯米',
    title: type === 'HEALTH' ? '常規糞便檢查' : type === 'SCANNER' ? '老齡犬糧掃描' : '關節報告解讀',
    summary: '記錄已存入星空檔案。',
    status: 'NORMAL',
    fullReport: '這是糯米在去往星空前的健康記錄。所有數據已永久保存。',
    riskIngredients: type === 'SCANNER' ? [] : undefined,
    safeIngredients: type === 'SCANNER' ? ['雞肉', '糙米'] : undefined,
    reportNo: type === 'HEALTH' ? 'HK20240110-112000' : undefined,
    visualSummary: type === 'HEALTH' ? '歷史樣本記錄，形態與色澤正常。' : undefined,
    diagnosis: type === 'HEALTH' ? '各項指標在當時均在正常範圍內，記錄已永久保存。' : undefined,
    suggestions: type === 'HEALTH' ? ['記錄已存入星空檔案'] : undefined,
    detectType: type === 'HEALTH' ? 'STOOL' : undefined,
  },
];

function getTitle(type: HistoryReportType): string {
  switch (type) {
    case 'HEALTH': return '歷史健康檢測';
    case 'SCANNER': return '歷史成分分析';
    case 'TRANSLATOR': return '歷史報告翻譯官';
  }
}

function StatusBadge({ status, dark }: { status?: string; dark: boolean }) {
  if (!status) return null;
  if (status === 'HEALTHY') {
    return (
      <View style={[detectReportStyles.statusBadge, { backgroundColor: dark ? 'rgba(16,185,129,0.2)' : '#ecfdf5' }]}>
        <CheckCircle2 size={10} color="#10b981" />
        <Text style={[detectReportStyles.statusBadgeText, { color: '#10b981' }]}>健康</Text>
      </View>
    );
  }
  if (status === 'WARNING') {
    return (
      <View style={[detectReportStyles.statusBadge, { backgroundColor: dark ? 'rgba(249,115,22,0.2)' : '#fff7ed' }]}>
        <AlertCircle size={10} color="#f97316" />
        <Text style={[detectReportStyles.statusBadgeText, { color: '#f97316' }]}>注意</Text>
      </View>
    );
  }
  return (
    <View style={[detectReportStyles.statusBadge, { backgroundColor: dark ? 'rgba(59,130,246,0.2)' : '#eff6ff' }]}>
      <Text style={[detectReportStyles.statusBadgeText, { color: '#2563eb' }]}>常規</Text>
    </View>
  );
}

export default function HistoryReportScreen({
  navigation,
  route,
}: {
  navigation: Nav;
  route: { params: { type: HistoryReportType } };
}) {
  const type = route.params?.type ?? 'HEALTH';
  const { isDarkMode } = useApp();
  const dark = isDarkMode;
  const insets = useSafeAreaInsets();

  const [pets, setPets] = useState<PetProfile[]>([]);
  const [reports, setReports] = useState<ReportItem[]>(() => MOCK_REPORTS(type));
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [filterPetName, setFilterPetName] = useState<string>('ALL');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    frontApi.fetchPets().then(setPets);
  }, []);

  const executeDelete = async (id: string) => {
    setIsDeleting(true);
    await new Promise((r) => setTimeout(r, 600));
    setReports((prev) => prev.filter((r) => r.id !== id));
    setSelectedReport(null);
    setShowDeleteConfirm(false);
    setIsDeleting(false);
    if (Platform.OS !== 'web' && Vibration.vibrate) Vibration.vibrate(50);
  };

  const filteredData =
    type === 'SCANNER' || filterPetName === 'ALL'
      ? reports
      : reports.filter((item) => item.petName === filterPetName);

  const textColor = dark ? '#f8fafc' : colors.gray[800];
  const subColor = dark ? colors.gray[400] : colors.gray[500];
  const glassBg = dark ? 'rgba(30,41,59,0.85)' : 'rgba(255,255,255,0.7)';
  const glassBorder = dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.5)';
  const padH = spacing.xl + Math.max(insets.left, insets.right);

  const headerTitle = selectedReport ? '報告詳情' : getTitle(type);

  const handleBack = () => {
    if (selectedReport) {
      setSelectedReport(null);
      setShowDeleteConfirm(false);
      return;
    }
    navigation.goBack();
  };

  return (
    <View style={[detectReportStyles.container, { backgroundColor: dark ? colors.slate[950] : '#f8fafc', paddingTop: insets.top }]}>
      <ViewHeader
        title={headerTitle}
        onBack={handleBack}
      />

      {!selectedReport && type !== 'SCANNER' && (
        <View style={detectReportStyles.filterWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={[detectReportStyles.filterScroll, { paddingLeft: padH, paddingRight: padH }]}
            contentContainerStyle={detectReportStyles.filterContent}
            bounces={false}
          >
            <Pressable
            onPress={() => setFilterPetName('ALL')}
            style={[
              detectReportStyles.filterChip,
              { backgroundColor: filterPetName === 'ALL' ? colors.orange[500] : (dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)') },
              filterPetName === 'ALL' && detectReportStyles.filterChipActive,
            ]}
          >
            <Text style={[detectReportStyles.filterChipText, { color: filterPetName === 'ALL' ? '#fff' : subColor }]}>全部</Text>
          </Pressable>
          {pets.map((pet) => (
            <Pressable
              key={pet.id}
              onPress={() => setFilterPetName(pet.name)}
              style={[
                detectReportStyles.filterChip,
                filterPetName !== pet.name && { backgroundColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
                filterPetName === pet.name && !pet.isMemorial && { backgroundColor: colors.orange[500] },
                filterPetName === pet.name && pet.isMemorial && { backgroundColor: colors.slate[800], borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)' },
              ]}
            >
              {pet.isMemorial && <Stars size={10} color="#f59e0b" style={{ marginRight: 4 }} />}
              <Text
                style={[
                  detectReportStyles.filterChipText,
                  { color: filterPetName === pet.name ? (pet.isMemorial ? '#fbbf24' : '#fff') : subColor },
                ]}
              >
                {pet.name}
              </Text>
            </Pressable>
          ))}
          </ScrollView>
        </View>
      )}

      <ScrollView
        style={detectReportStyles.scroll}
        contentContainerStyle={[detectReportStyles.scrollContentHistory, { paddingHorizontal: padH, paddingBottom: 24 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {!selectedReport ? (
          <>
            {filteredData.length === 0 ? (
              <View style={detectReportStyles.emptyWrap}>
                <FileText size={64} color={subColor} strokeWidth={1} />
                <Text style={[detectReportStyles.emptyText, { color: subColor }]}>尚無相關歷史記錄</Text>
              </View>
            ) : (
              filteredData.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => setSelectedReport(item)}
                  style={[detectReportStyles.card, { backgroundColor: glassBg, borderColor: glassBorder }]}
                >
                  <Image source={{ uri: ensureImageUri(item.thumbnail) }} style={detectReportStyles.cardThumb} />
                  <View style={detectReportStyles.cardBody}>
                    <Text style={[detectReportStyles.cardTitle, { color: textColor }]} numberOfLines={1}>{item.title}</Text>
                    <Text style={[detectReportStyles.cardSummary, { color: subColor }]} numberOfLines={1}>{item.summary}</Text>
                    <View style={detectReportStyles.cardFooter}>
                      <View style={detectReportStyles.cardDateRow}>
                        <Calendar size={12} color={subColor} />
                        <Text style={[detectReportStyles.cardDate, { color: subColor }]}>{item.date}</Text>
                      </View>
                      <StatusBadge status={item.status} dark={dark} />
                    </View>
                  </View>
                </Pressable>
              ))
            )}
          </>
        ) : (
          <View style={detectReportStyles.detail}>
            {type === 'HEALTH' ? (
              <HealthReportResult
                petName={selectedReport.petName}
                subtitle={selectedReport.date}
                status={selectedReport.status ?? 'NORMAL'}
                resultImageUrl={selectedReport.thumbnail}
                reportNo={selectedReport.reportNo}
                detectType={selectedReport.detectType ?? 'STOOL'}
                visualSummary={selectedReport.visualSummary ?? selectedReport.summary ?? selectedReport.fullReport}
                diagnosis={selectedReport.diagnosis ?? selectedReport.fullReport}
                suggestions={
                  selectedReport.suggestions && selectedReport.suggestions.length > 0
                    ? selectedReport.suggestions
                    : [selectedReport.fullReport || selectedReport.summary || '—']
                }
                dark={dark}
              />
            ) : type === 'SCANNER' ? (
              <>
                <View style={detectReportStyles.detailImageContainer}>
                  <View style={detectReportStyles.detailImageWrap}>
                    <Image source={{ uri: ensureImageUri(selectedReport.thumbnail) }} style={detectReportStyles.detailImage} resizeMode="cover" />
                    <View style={StyleSheet.absoluteFill} pointerEvents="none">
                      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)' }]} />
                    </View>
                    <View style={detectReportStyles.detailImageOverlay}>
                      <View style={detectReportStyles.reportAvatarWrap}>
                        <User size={14} color="#fff" />
                      </View>
                      <Text style={detectReportStyles.detailImageLabel}>{selectedReport.petName} 的歷史報告</Text>
                    </View>
                  </View>
                </View>
                <View style={detectReportStyles.scannerDetail}>
                  {/* 1. AI 結論 */}
                  <View style={[detectReportStyles.aiConclusionBlock, { backgroundColor: dark ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.06)', borderColor: dark ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.2)', marginBottom: 20 }]}>
                    <View style={detectReportStyles.aiConclusionHeader}>
                      <View style={[detectReportStyles.aiConclusionIconWrap, { backgroundColor: '#3b82f6' }]}>
                        <Sparkles size={18} color="#fff" />
                      </View>
                      <Text style={[detectReportStyles.aiConclusionLabel, { color: textColor }]}>AI 結論</Text>
                    </View>
                    <Text style={[detectReportStyles.aiConclusionText, { color: textColor }]}>{selectedReport.summary}</Text>
                  </View>

                  {/* 2. 有風險的成分 */}
                  <View style={detectReportStyles.scannerSection}>
                    <View style={[detectReportStyles.scannerSectionHeader, detectReportStyles.riskSectionHeader]}>
                      <XCircle size={20} color="#b91c1c" />
                      <Text style={[detectReportStyles.scannerSectionTitle, detectReportStyles.riskSectionTitle]}>有風險的成分</Text>
                      <View style={[detectReportStyles.scannerSectionBadge, detectReportStyles.riskSectionBadge]}>
                        <Text style={detectReportStyles.scannerSectionBadgeText}>{(selectedReport.riskIngredients || []).length} 項</Text>
                      </View>
                    </View>
                    <View style={[detectReportStyles.scannerSectionBody, dark ? detectReportStyles.riskSectionBodyDark : detectReportStyles.riskSectionBody]}>
                      {(selectedReport.riskIngredients || []).length > 0 ? (
                        (selectedReport.riskIngredients || []).map((ing) => (
                          <View key={ing} style={[detectReportStyles.riskItemRow, dark ? detectReportStyles.riskItemRowBgDark : detectReportStyles.riskItemRowBg]}>
                            <View style={detectReportStyles.riskItemBullet} />
                            <Text style={[detectReportStyles.riskItemText, dark && detectReportStyles.riskItemTextDark]}>{ing}</Text>
                          </View>
                        ))
                      ) : (
                        <View style={detectReportStyles.riskEmptyWrap}>
                          <Text style={detectReportStyles.riskEmptyText}>暫未發現風險成分 ✨</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* 3. 無風險的成分 */}
                  <View style={detectReportStyles.scannerSection}>
                    <View style={[detectReportStyles.scannerSectionHeader, detectReportStyles.safeSectionHeader]}>
                      <CheckCircle size={20} color="#047857" />
                      <Text style={[detectReportStyles.scannerSectionTitle, detectReportStyles.safeSectionTitle]}>無風險的成分</Text>
                      <View style={[detectReportStyles.scannerSectionBadge, detectReportStyles.safeSectionBadge]}>
                        <Text style={detectReportStyles.scannerSectionBadgeText}>{(selectedReport.safeIngredients || []).length} 項</Text>
                      </View>
                    </View>
                    <View style={[detectReportStyles.scannerSectionBody, dark ? detectReportStyles.safeSectionBodyDark : detectReportStyles.safeSectionBody]}>
                      {(selectedReport.safeIngredients || []).map((ing) => (
                        <View key={ing} style={[detectReportStyles.safeItemRow, dark ? detectReportStyles.safeItemRowBgDark : detectReportStyles.safeItemRowBg]}>
                          <View style={detectReportStyles.safeItemBullet} />
                          <Text style={[detectReportStyles.safeItemText, dark && detectReportStyles.safeItemTextDark]}>{ing}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              </>
            ) : (
              <>
                <View style={detectReportStyles.detailImageContainer}>
                  <View style={detectReportStyles.detailImageWrap}>
                    <Image source={{ uri: ensureImageUri(selectedReport.thumbnail) }} style={detectReportStyles.detailImage} resizeMode="cover" />
                    <View style={StyleSheet.absoluteFill} pointerEvents="none">
                      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)' }]} />
                    </View>
                    <View style={detectReportStyles.detailImageOverlay}>
                      <View style={detectReportStyles.reportAvatarWrap}>
                        <User size={14} color="#fff" />
                      </View>
                      <Text style={detectReportStyles.detailImageLabel}>{selectedReport.petName} 的歷史報告</Text>
                    </View>
                  </View>
                </View>
                <View style={detectReportStyles.reportHead}>
                  <View style={[detectReportStyles.reportIconWrap, { backgroundColor: '#059669' }]}>
                    <FileText size={20} color="#fff" />
                  </View>
                  <View style={detectReportStyles.reportHeadBody}>
                    <Text style={[detectReportStyles.reportHeadTitle, { color: textColor }]} numberOfLines={2}>{selectedReport.title}</Text>
                    <Text style={[detectReportStyles.reportHeadDate, { color: subColor }]}>{selectedReport.date}</Text>
                  </View>
                  <StatusBadge status={selectedReport.status} dark={dark} />
                </View>
                <Text style={[detectReportStyles.translatorSectionTitle, { color: '#047857' }]}>大白話翻譯解釋 + 建議</Text>
                <View style={detectReportStyles.translatorExplainBlocksWrap}>
                  <View style={[detectReportStyles.translatorExplainBlockCard, { backgroundColor: dark ? 'rgba(16,185,129,0.06)' : 'rgba(236,253,245,0.6)', borderColor: dark ? 'rgba(16,185,129,0.2)' : 'rgba(5,150,105,0.15)' }]}>
                    <Text style={[detectReportStyles.translatorExplainBlockLabel, { color: '#047857' }]}>解讀內容</Text>
                    <Text style={[detectReportStyles.translatorExplainBlockText, { color: textColor, marginBottom: 0 }]}>{selectedReport.fullReport}</Text>
                    {selectedReport.suggestions && selectedReport.suggestions.length > 0 && (
                      <>
                        <Text style={[detectReportStyles.translatorExplainBlockLabel, { color: '#047857', marginTop: 12 }]}>建議</Text>
                        <View style={detectReportStyles.translatorSuggestionsList}>
                          {selectedReport.suggestions.map((s, j) => (
                            <Text key={j} style={[detectReportStyles.translatorSuggestionItem, { color: textColor }]}>· {s}</Text>
                          ))}
                        </View>
                      </>
                    )}
                  </View>
                </View>
              </>
            )}

            <View style={[detectReportStyles.actionsRow, { backgroundColor: dark ? colors.slate[900] : '#fff', borderColor: glassBorder }]}>
              <Pressable
                disabled={isDeleting}
                onPress={() => setShowDeleteConfirm(true)}
                style={[detectReportStyles.actionBtn, detectReportStyles.actionBtnSecondary]}
              >
                <Trash2 size={16} color="#e11d48" />
                <Text style={detectReportStyles.actionBtnSecondaryText}>刪除記錄</Text>
              </Pressable>
              <Pressable style={[detectReportStyles.actionBtn, detectReportStyles.actionBtnPrimary]}>
                <ChevronRight size={18} color="#fff" />
                <Text style={detectReportStyles.actionBtnPrimaryText}>諮詢專家</Text>
              </Pressable>
            </View>

            {showDeleteConfirm && (
              <Modal visible transparent animationType="fade">
                <View style={detectReportStyles.modalRoot}>
                  <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowDeleteConfirm(false)} />
                  <View style={[detectReportStyles.deleteConfirmCard, { backgroundColor: dark ? colors.slate[800] : '#fff' }]}>
                    <View style={detectReportStyles.deleteConfirmHead}>
                      <AlertTriangle size={16} color="#e11d48" />
                      <Text style={detectReportStyles.deleteConfirmTitle}>確定要永久刪除嗎？</Text>
                    </View>
                    <View style={detectReportStyles.deleteConfirmActions}>
                      <Pressable
                        onPress={() => executeDelete(selectedReport.id)}
                        disabled={isDeleting}
                        style={[detectReportStyles.deleteConfirmBtn, detectReportStyles.deleteConfirmBtnPrimary]}
                      >
                        {isDeleting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={detectReportStyles.deleteConfirmBtnPrimaryText}>確認刪除</Text>}
                      </Pressable>
                      <Pressable
                        disabled={isDeleting}
                        onPress={() => setShowDeleteConfirm(false)}
                        style={[detectReportStyles.deleteConfirmBtn, detectReportStyles.deleteConfirmBtnCancel]}
                      >
                        <Text style={[detectReportStyles.deleteConfirmBtnCancelText, { color: subColor }]}>取消</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              </Modal>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
