import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Share2,
  Camera,
  Edit2,
  X,
  Check,
  Save,
  Loader2,
  Scale,
  Heart,
  Calendar,
  Bone,
  TrendingUp,
} from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../navigation/types';
import type { PetProfile, WeightEntry } from '../types';
import { url_base } from '../types';
import * as mockApi from '../api/mock';
import * as frontApi from '../front_api';
import { useApp } from '../context/AppContext';
import { colors, spacing, borderRadius, shadowGlass } from '../theme/tokens';
import { API_BASE_URL } from '../front_api';

type Props = NativeStackScreenProps<HomeStackParamList, 'PetProfile'>;

const PAD = 24;
const TAB_LABELS = { INFO: '基礎', HEALTH: '履歷', TREND: '生長' } as const;

const AVATAR_PLACEHOLDER = 'https://picsum.photos/seed/pet/200';

function resolveAvatar(avatar: string): string {
  // const s = (avatar ?? '').trim();
  // if (s === '') return AVATAR_PLACEHOLDER;
  // return s.startsWith('http') ? s : `${url_base}${s}`;

  const s = avatar != null ? String(avatar).trim() : '';

  if (s === '') return AVATAR_PLACEHOLDER;
  const normalizedPath = s.startsWith('/') ? s : `/${s}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export default function PetProfileScreen({ navigation, route }: Props) {
  const { pet: initialPet } = route.params;
  const insets = useSafeAreaInsets();
  const { isDarkMode } = useApp();
  const dark = isDarkMode;
  const [activeTab, setActiveTab] = useState<'INFO' | 'HEALTH' | 'TREND'>('INFO');

  const headerPaddingTop = Math.max(12, insets.top);
  const scrollPaddingBottom = 24 + insets.bottom;
  const horizontalPad = Math.max(PAD, insets.left + 16);

  const [isEditingWeight, setIsEditingWeight] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [isSavingWeight, setIsSavingWeight] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [isSavingInfo, setIsSavingInfo] = useState(false);
  const [petInfo, setPetInfo] = useState<PetProfile | null>(initialPet ?? null);
  const [editForm, setEditForm] = useState<Partial<PetProfile>>(initialPet ?? {});
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);

  const loadProfile = useCallback(async () => {
    if (!initialPet?.id) return;
    try {
      const profile = await frontApi.fetchPetProfile(initialPet.id);
      setPetInfo(profile ?? initialPet ?? null);
      setEditForm(profile ?? initialPet ?? {});
    } catch {
      setPetInfo(initialPet ?? null);
      setEditForm(initialPet ?? {});
    }
  }, [initialPet]);

  const loadWeight = useCallback(async () => {
    if (!initialPet?.id) return;
    try {
      const history = await frontApi.fetchWeightHistory(initialPet.id);
      setWeightHistory(history);
    } catch {
      setWeightHistory([]);
    }
  }, [initialPet?.id]);

  useEffect(() => {
    if (initialPet) {
      loadProfile();
      loadWeight();
    } else {
      setPetInfo(null);
      setEditForm({});
    }
  }, [initialPet, loadProfile, loadWeight]);

  const currentWeight = weightHistory.length > 0 ? weightHistory[weightHistory.length - 1].weight : 0;

  const handleUpdateWeight = async () => {
    const newWeight = parseFloat(weightInput);
    if (isNaN(newWeight) || newWeight <= 0 || !initialPet?.id) return;
    setIsSavingWeight(true);
    try {
      const updated = await frontApi.updatePetWeight(newWeight, initialPet.id);
      setWeightHistory(updated);
      const now = new Date();
      setLastUpdated(
        `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
      );
      setIsEditingWeight(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingWeight(false);
    }
  };

  const handleSaveInfo = async () => {
    if (!editForm.id || !petInfo) return;
    setIsSavingInfo(true);
    try {
      const payload: PetProfile = { ...petInfo, ...editForm };
      const updated = await frontApi.updatePetProfile(payload);
      if (updated) {
        setPetInfo(updated);
        setEditForm(updated);
        setIsEditingInfo(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingInfo(false);
    }
  };

  const toggleEditMode = () => {
    if (isEditingInfo) setEditForm(petInfo || {});
    setIsEditingInfo(!isEditingInfo);
    if (!isEditingInfo) setActiveTab('INFO');
  };

  const healthData = [
    { label: '體重', value: `${currentWeight} kg`, color: colors.orange[500], editable: true },
    { label: '步數', value: '5,240', color: '#2563eb' },
    { label: '飲水量', value: '180 ml', color: '#10b981' },
  ];

  const textPrimary = dark ? '#f8fafc' : colors.gray[800];
  const textSecondary = dark ? colors.gray[500] : colors.gray[400];
  const glassBg = dark ? 'rgba(30,41,59,0.85)' : 'rgba(255,255,255,0.7)';
  const glassBorder = dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.5)';
  const cardBg = dark ? colors.slate[900] : '#fff';
  const cardBorder = dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
  const rowBorderColor = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';

  const renderWeightChart = () => {
    if (weightHistory.length < 2) {
      return (
        <View style={[styles.chartPlaceholder, { backgroundColor: dark ? colors.slate[900] : 'rgba(255,255,255,0.5)', borderColor: cardBorder }]}>
          <Text style={[styles.chartPlaceholderText, { color: textSecondary }]}>數據不足，請持續記錄體重</Text>
        </View>
      );
    }
    const maxW = Math.max(...weightHistory.map((w) => w.weight)) + 0.5;
    const minW = Math.min(...weightHistory.map((w) => w.weight)) - 0.5;
    const range = maxW - minW || 1;
    return (
      <View style={[styles.chartCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <View style={styles.chartHeader}>
          <View style={styles.chartTitleRow}>
            <Scale size={18} color={colors.orange[500]} style={{ marginRight: 8 }} />
            <Text style={[styles.chartTitle, { color: textPrimary }]}>體重生長曲線</Text>
          </View>
          <View style={styles.chartBadge}>
            <Text style={styles.chartBadgeText}>+12% 標準穩定</Text>
          </View>
        </View>
        <View style={styles.barChart}>
          {weightHistory.map((w, i) => {
            const barHeight = Math.max(16, ((w.weight - minW) / range) * 100);
            return (
              <View key={i} style={styles.barCol}>
                <Text style={[styles.barLabel, { color: textSecondary }]}>{w.weight}kg</Text>
                <View
                  style={[
                    styles.bar,
                    { height: barHeight, backgroundColor: colors.orange[500] },
                  ]}
                />
                <Text style={[styles.barDate, { color: textSecondary }]} numberOfLines={1}>{w.date}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  if (!petInfo) {
    return (
      <View style={[styles.container, { backgroundColor: dark ? colors.slate[950] : '#f8fafc' }]}>
        <View style={[styles.header, { paddingTop: headerPaddingTop, paddingHorizontal: horizontalPad }]}>
          <Pressable onPress={() => navigation.goBack()} style={styles.headerBtn}>
            <ChevronLeft size={22} color={dark ? '#fff' : colors.gray[600]} />
          </Pressable>
          <ActivityIndicator color={colors.orange[500]} style={{ flex: 1 }} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: dark ? colors.slate[950] : '#f8fafc' }]}>
      {/* Sticky Header - 适配 iPhone 安全区 */}
      <View style={[
        styles.header,
        {
          paddingTop: headerPaddingTop,
          paddingHorizontal: horizontalPad,
          paddingBottom: 14,
          backgroundColor: dark ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.92)',
          borderBottomColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        },
      ]}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [
            styles.headerBtn,
            { backgroundColor: glassBg, borderColor: glassBorder, opacity: pressed ? 0.9 : 1 },
          ]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft size={22} color={dark ? '#fff' : colors.gray[600]} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: textPrimary }]} numberOfLines={1}>
          {petInfo.name} 的檔案
        </Text>
        <Pressable
          style={[styles.headerBtn, { backgroundColor: glassBg, borderColor: glassBorder }]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Share2 size={20} color={textSecondary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: horizontalPad, paddingBottom: scrollPaddingBottom }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={styles.profileRow}>
            <View style={styles.avatarWrap}>
              <Image source={{ uri: resolveAvatar(petInfo.avatar) }} style={styles.avatar} />
              <View style={styles.cameraBtn}>
                <Camera size={14} color="#fff" />
              </View>
            </View>
            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={[styles.petName, { color: textPrimary }]}>{petInfo.name}</Text>
                <View style={[styles.breedTag, { backgroundColor: dark ? 'rgba(249,115,22,0.2)' : '#ffedd5' }]}>
                  <Text style={[styles.breedTagText, { color: colors.orange[600] }]}>{petInfo.breed}</Text>
                </View>
              </View>
              <Text style={[styles.profileSub, { color: textSecondary }]}>陪伴萌寵時光</Text>
              <View style={styles.editRow}>
                {!isEditingInfo ? (
                  <Pressable onPress={toggleEditMode} style={styles.editBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Edit2 size={12} color="#3b82f6" />
                    <Text style={styles.editBtnText}>編輯資料</Text>
                  </Pressable>
                ) : (
                  <>
                    <Pressable
                      onPress={handleSaveInfo}
                      disabled={isSavingInfo}
                      style={[styles.saveBtn, isSavingInfo && { opacity: 0.6 }]}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      {isSavingInfo ? <Loader2 size={12} color="#fff" /> : <Check size={12} color="#fff" />}
                      <Text style={styles.saveBtnText}>保存</Text>
                    </Pressable>
                    <Pressable onPress={toggleEditMode} style={styles.cancelBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <X size={12} color={colors.gray[500]} />
                      <Text style={styles.cancelBtnText}>取消</Text>
                    </Pressable>
                  </>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={[styles.tabs, { backgroundColor: dark ? colors.slate[900] : colors.gray[50] }]}>
          {(['INFO', 'HEALTH', 'TREND'] as const).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[
                styles.tab,
                activeTab === tab && [styles.tabActive, { backgroundColor: dark ? colors.slate[800] : '#fff' }],
              ]}
            >
              <Text style={[styles.tabText, { color: activeTab === tab ? textPrimary : textSecondary }]}>
                {TAB_LABELS[tab]}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* TREND - Weight Chart */}
        {activeTab === 'TREND' && renderWeightChart()}

        {/* HEALTH */}
        {activeTab === 'HEALTH' && (
          <View style={styles.healthBlock}>
            <View style={styles.healthGrid}>
              {healthData.map((item, i) => (
                <Pressable
                  key={i}
                  onPress={() => {
                    if (item.editable) {
                      setWeightInput(currentWeight.toString());
                      setIsEditingWeight(true);
                    }
                  }}
                  style={[styles.healthCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
                >
                  <Text style={[styles.healthLabel, { color: textSecondary }]}>{item.label}</Text>
                  <Text style={[styles.healthValue, { color: item.color }]}>{item.value}</Text>
                  {item.editable && (
                    <View style={styles.healthEditIcon}>
                      <Edit2 size={10} color={colors.orange[400]} />
                    </View>
                  )}
                  {item.editable && lastUpdated && (
                    <Text style={styles.healthUpdated}>更新於 {lastUpdated}</Text>
                  )}
                </Pressable>
              ))}
            </View>

            {isEditingWeight && (
              <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={styles.weightEditCard}>
                  <View style={styles.weightEditHeader}>
                    <View style={styles.weightEditTitleRow}>
                      <Scale size={14} color={colors.orange[600]} style={{ marginRight: 6 }} />
                      <Text style={styles.weightEditTitle}>修改當前體重</Text>
                    </View>
                    <Pressable onPress={() => setIsEditingWeight(false)}>
                      <X size={16} color={textSecondary} />
                    </Pressable>
                  </View>
                  <View style={styles.weightEditRow}>
                    <TextInput
                      value={weightInput}
                      onChangeText={setWeightInput}
                      placeholder="輸入 kg..."
                      placeholderTextColor={textSecondary}
                      keyboardType="decimal-pad"
                      style={[styles.weightInput, { color: textPrimary, backgroundColor: dark ? colors.slate[800] : '#fff' }]}
                    />
                    <Text style={[styles.kgHint, { color: textSecondary }]}>kg</Text>
                    <Pressable
                      onPress={handleUpdateWeight}
                      disabled={isSavingWeight || !weightInput}
                      style={[styles.weightSaveBtn, (isSavingWeight || !weightInput) && { opacity: 0.5 }]}
                    >
                      {isSavingWeight ? (
                        <Loader2 size={20} color="#fff" />
                      ) : (
                        <Save size={20} color="#fff" />
                      )}
                    </Pressable>
                  </View>
                </View>
              </KeyboardAvoidingView>
            )}

            <View style={[styles.insightCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Text style={[styles.insightTitle, { color: textSecondary }]}>近期健康洞察</Text>
              <View style={styles.insightContent}>
                <TrendingUp size={18} color={colors.orange[500]} style={{ marginRight: 12 }} />
                <Text style={[styles.insightText, { color: dark ? '#fef3c7' : colors.gray[800] }]}>
                  {petInfo.name} 目前的體重增長符合品種生理特徵，但飲水量略低於平均值，建議增加濕糧比例。
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* INFO */}
        {activeTab === 'INFO' && (
          <View style={[styles.infoCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            {isEditingInfo && (
              <View style={[styles.infoRow, { borderBottomColor: rowBorderColor }]}>
                <Text style={[styles.infoLabel, { color: textSecondary }]}>寵物姓名</Text>
                <TextInput
                  value={editForm.name ?? ''}
                  onChangeText={(t) => setEditForm((f) => ({ ...f, name: t }))}
                  style={[styles.infoInput, { color: textPrimary, backgroundColor: dark ? colors.slate[800] : colors.gray[50] }]}
                />
              </View>
            )}

            <View style={[styles.infoRow, { borderBottomColor: rowBorderColor }]}>
              <View style={styles.infoRowLeft}>
                <View style={[styles.infoIconWrap, { backgroundColor: dark ? colors.slate[800] : colors.gray[50] }]}>
                  <Heart size={16} color="#f43f5e" />
                </View>
                <Text style={[styles.infoLabel, { color: textSecondary }]}>性別</Text>
              </View>
              {!isEditingInfo && <Text style={[styles.infoValue, { color: textPrimary }]}>{petInfo.gender}</Text>}
              {isEditingInfo && (
                <TextInput
                  value={editForm.gender ?? ''}
                  onChangeText={(t) => setEditForm((f) => ({ ...f, gender: t }))}
                  style={[styles.infoInput, { color: textPrimary, backgroundColor: dark ? colors.slate[800] : colors.gray[50] }]}
                />
              )}
            </View>

            <View style={[styles.infoRow, { borderBottomColor: rowBorderColor }]}>
              <View style={styles.infoRowLeft}>
                <View style={[styles.infoIconWrap, { backgroundColor: dark ? colors.slate[800] : colors.gray[50] }]}>
                  <Calendar size={16} color="#3b82f6" />
                </View>
                <Text style={[styles.infoLabel, { color: textSecondary }]}>生日</Text>
              </View>
              {!isEditingInfo && <Text style={[styles.infoValue, { color: textPrimary }]}>{petInfo.birthday}</Text>}
              {isEditingInfo && (
                <TextInput
                  value={editForm.birthday ?? ''}
                  onChangeText={(t) => setEditForm((f) => ({ ...f, birthday: t }))}
                  style={[styles.infoInput, { color: textPrimary, backgroundColor: dark ? colors.slate[800] : colors.gray[50] }]}
                />
              )}
            </View>

            <View style={[styles.infoRow, styles.infoRowLast]}>
              <View style={styles.infoRowLeft}>
                <View style={[styles.infoIconWrap, { backgroundColor: dark ? colors.slate[800] : colors.gray[50] }]}>
                  <Bone size={16} color={colors.orange[500]} />
                </View>
                <Text style={[styles.infoLabel, { color: textSecondary }]}>愛好</Text>
              </View>
              {!isEditingInfo && (
                <Text style={[styles.infoValue, { color: textPrimary }]} numberOfLines={3}>{petInfo.hobbies || '-'}</Text>
              )}
              {isEditingInfo && (
                <TextInput
                  value={editForm.hobbies ?? ''}
                  onChangeText={(t) => setEditForm((f) => ({ ...f, hobbies: t }))}
                  placeholder="請輸入寵物的愛好，用逗號分隔..."
                  placeholderTextColor={textSecondary}
                  multiline
                  style={[styles.infoInput, styles.infoTextArea, { color: textPrimary, backgroundColor: dark ? colors.slate[800] : colors.gray[50] }]}
                />
              )}
            </View>
          </View>
        )}

        {/* 成長相冊 */}
        <View style={styles.gallerySection}>
          <View style={styles.galleryHead}>
            <Text style={[styles.galleryTitle, { color: textPrimary }]}>成長相冊</Text>
            <Pressable><Text style={[styles.galleryLink, { color: textSecondary }]}>查看更多</Text></Pressable>
          </View>
          <View style={styles.galleryGrid}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={[styles.galleryItem, { backgroundColor: glassBg, borderColor: glassBorder }]}>
                <Image source={{ uri: `https://picsum.photos/seed/mochi${i}/300` }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '800', flex: 1, textAlign: 'center', marginHorizontal: 10 },
  scrollContent: { paddingTop: PAD },
  profileCard: {
    borderRadius: 40,
    padding: spacing.xl,
    borderWidth: 1,
    marginBottom: spacing.xl,
    ...(Platform.OS === 'ios' ? shadowGlass.light : {}),
  },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  avatarWrap: { position: 'relative', marginRight: 20 },
  avatar: { width: 96, height: 96, borderRadius: 32, borderWidth: 4, borderColor: '#fff' },
  cameraBtn: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: colors.orange[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  petName: { fontSize: 22, fontWeight: '800', maxWidth: '100%' },
  breedTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  breedTagText: { fontSize: 10, fontWeight: '800' },
  profileSub: { fontSize: 12, marginBottom: 8 },
  editRow: { flexDirection: 'row', gap: 8 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: 'rgba(59,130,246,0.15)' },
  editBtnText: { fontSize: 10, fontWeight: '800', color: '#3b82f6' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#10b981' },
  saveBtnText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  cancelBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: colors.gray[50] },
  cancelBtnText: { fontSize: 10, fontWeight: '800', color: colors.gray[500] },
  tabs: { flexDirection: 'row', padding: 4, borderRadius: 16, marginBottom: spacing.xl },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tabActive: { shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  tabText: { fontSize: 12, fontWeight: '800' },
  chartPlaceholder: {
    borderRadius: 32,
    padding: 40,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  chartPlaceholderText: { fontSize: 14, fontWeight: '800' },
  chartCard: { borderRadius: 32, padding: spacing.xl, borderWidth: 1, marginBottom: spacing.xl },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  chartTitleRow: { flexDirection: 'row', alignItems: 'center' },
  chartTitle: { fontSize: 14, fontWeight: '800' },
  chartBadge: { backgroundColor: 'rgba(16,185,129,0.15)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
  chartBadgeText: { fontSize: 10, fontWeight: '800', color: '#10b981' },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', height: 150, gap: 8 },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
  barLabel: { fontSize: 10, fontWeight: '700', marginBottom: 4 },
  bar: { width: '80%', minHeight: 16, borderRadius: 6 },
  barDate: { fontSize: 8, marginTop: 4, maxWidth: 48 },
  healthBlock: { marginBottom: spacing.xl },
  healthGrid: { flexDirection: 'row', gap: 12, marginBottom: spacing.lg },
  healthCard: {
    flex: 1,
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    minHeight: 80,
  },
  healthLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  healthValue: { fontSize: 14, fontWeight: '800' },
  healthEditIcon: { position: 'absolute', top: 8, right: 8 },
  healthUpdated: { fontSize: 8, fontWeight: '700', color: '#10b981', marginTop: 4 },
  weightEditCard: {
    backgroundColor: 'rgba(255,237,213,0.5)',
    borderRadius: 32,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.3)',
    marginBottom: spacing.lg,
  },
  weightEditHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  weightEditTitleRow: { flexDirection: 'row', alignItems: 'center' },
  weightEditTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 1, color: colors.orange[600] },
  weightEditRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  weightInput: { flex: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, fontWeight: '700' },
  kgHint: { fontSize: 12, fontWeight: '800' },
  weightSaveBtn: { width: 48, height: 48, borderRadius: 12, backgroundColor: colors.orange[500], alignItems: 'center', justifyContent: 'center' },
  insightCard: { borderRadius: 24, padding: spacing.xl, borderWidth: 1 },
  insightTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 2, marginBottom: 12 },
  insightContent: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: 'rgba(255,237,213,0.3)', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(249,115,22,0.2)' },
  insightText: { fontSize: 12, fontWeight: '700', flex: 1 },
  infoCard: { borderRadius: 24, padding: 20, borderWidth: 1, marginBottom: spacing.xl },
  infoRow: { paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  infoRowLast: { borderBottomWidth: 0 },
  infoRowLeft: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoIconWrap: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  infoLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  infoValue: { fontSize: 14, fontWeight: '800' },
  infoInput: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, fontWeight: '700' },
  infoTextArea: { minHeight: 72, textAlignVertical: 'top' },
  gallerySection: { marginTop: spacing.lg },
  galleryHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  galleryTitle: { fontSize: 16, fontWeight: '800' },
  galleryLink: { fontSize: 10, fontWeight: '800' },
  galleryGrid: { flexDirection: 'row', gap: 8 },
  galleryItem: { flex: 1, aspectRatio: 1, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
});
