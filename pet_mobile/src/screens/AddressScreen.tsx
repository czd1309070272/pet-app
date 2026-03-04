import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Plus,
  MapPin,
  Edit3,
  Trash2,
  Home,
  Briefcase,
  GraduationCap,
  Loader2,
  ChevronDown,
  X,
} from 'lucide-react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../navigation/types';
import type { Address } from '../types';
import { ViewHeader } from '../components/shared/CommonUI';
import { colors, spacing, borderRadius } from '../theme/tokens';
import { useApp } from '../context/AppContext';
import * as mockApi from '../api/mock';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'Address'>;

const HK_DISTRICTS = [
  '中西區', '灣仔區', '東區', '南區',
  '油尖旺區', '深水埗區', '九龍城區', '黃大仙區', '觀塘區',
  '葵青區', '荃灣區', '屯門區', '元朗區', '北區', '大埔區', '沙田區', '西貢區', '離島區',
];

const DEFAULT_FORM: Partial<Address> = {
  receiverName: '',
  phone: '',
  area: '中西區',
  detail: '',
  isDefault: false,
  label: 'HOME',
};

function LabelIcon({ label, isDefault }: { label?: string; isDefault?: boolean }) {
  const color = isDefault ? '#fff' : '#6b7280';
  switch (label) {
    case 'HOME': return <Home size={14} color={color} />;
    case 'WORK': return <Briefcase size={14} color={color} />;
    case 'SCHOOL': return <GraduationCap size={14} color={color} />;
    default: return <MapPin size={14} color={color} />;
  }
}

export default function AddressScreen({ navigation }: { navigation: Nav }) {
  const insets = useSafeAreaInsets();
  const { isDarkMode } = useApp();
  const dark = isDarkMode;

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState<Partial<Address>>(DEFAULT_FORM);
  const [showAreaPicker, setShowAreaPicker] = useState(false);

  const loadAddresses = useCallback(async () => {
    setIsLoading(true);
    const data = await mockApi.fetchAddresses();
    setAddresses(data);
    setIsLoading(false);
  }, []);

  React.useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const handleEdit = (addr: Address) => {
    setEditingAddress(addr);
    setFormData(addr);
    setShowAddModal(true);
    setShowAreaPicker(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert('確認刪除', '確定要刪除此地址嗎？', [
      { text: '取消', style: 'cancel' },
      { text: '刪除', style: 'destructive', onPress: async () => {
        await mockApi.deleteAddress(id);
        loadAddresses();
      }},
    ]);
  };

  const openAdd = () => {
    setEditingAddress(null);
    setFormData({ ...DEFAULT_FORM, area: '中西區' });
    setShowAddModal(true);
    setShowAreaPicker(false);
  };

  const handleSave = async () => {
    if (!formData.receiverName?.trim() || !formData.phone?.trim() || !formData.detail?.trim()) {
      Alert.alert('提示', '請填寫完整信息');
      return;
    }
    setIsSaving(true);
    try {
      await mockApi.saveAddress({
        id: editingAddress?.id ?? '',
        receiverName: formData.receiverName!,
        phone: formData.phone!,
        area: formData.area!,
        detail: formData.detail!,
        isDefault: formData.isDefault ?? false,
        label: formData.label ?? 'HOME',
      });
      setShowAddModal(false);
      loadAddresses();
      setFormData(DEFAULT_FORM);
      setEditingAddress(null);
    } finally {
      setIsSaving(false);
    }
  };

  const textPrimary = dark ? '#f8fafc' : colors.gray[800];
  const textSecondary = dark ? colors.slate[800] : colors.gray[400];
  const glassBg = dark ? 'rgba(30,41,59,0.85)' : 'rgba(255,255,255,0.7)';
  const glassBorder = dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.45)';

  return (
    <View style={[styles.container, { backgroundColor: dark ? colors.glassBg.dark : colors.glassBg.light, paddingTop: insets.top }]}>
      <View style={[styles.headerWrap, { paddingHorizontal: spacing.xl }]}>
        <ViewHeader
          title="收貨地址管理"
          onBack={() => navigation.goBack()}
          rightElement={
            <Pressable onPress={openAdd} style={({ pressed }) => [styles.addBtn, { opacity: pressed ? 0.9 : 1 }]}>
              <Plus size={20} color="#fff" />
            </Pressable>
          }
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: 120, paddingHorizontal: spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.emptyWrap}>
            <Loader2 size={32} color={colors.orange[500]} style={{ marginBottom: 16 }} />
            <Text style={[styles.emptyText, { color: textSecondary }]}>正在讀取地址...</Text>
          </View>
        ) : addresses.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={[styles.emptyIconWrap, { backgroundColor: dark ? 'rgba(249,115,22,0.15)' : '#fff7ed' }]}>
              <MapPin size={40} color={colors.orange[500]} />
            </View>
            <Text style={[styles.emptyTitle, { color: textSecondary }]}>尚未添加任何收貨地址</Text>
            <Pressable onPress={() => setShowAddModal(true)} style={styles.emptyBtn}>
              <Text style={styles.emptyBtnText}>立即添加</Text>
            </Pressable>
          </View>
        ) : (
          addresses.map((addr) => (
            <View
              key={addr.id}
              style={[styles.card, { backgroundColor: dark ? colors.slate[900] : '#fff', borderColor: glassBorder }]}
            >
              <View style={styles.cardTop}>
                <View style={styles.cardLeft}>
                  <View style={[styles.labelIconWrap, addr.isDefault ? styles.labelIconDefault : styles.labelIconNormal]}>
                    <LabelIcon label={addr.label} isDefault={addr.isDefault} />
                  </View>
                  <View>
                    <View style={styles.cardNameRow}>
                      <Text style={[styles.cardName, { color: textPrimary }]}>{addr.receiverName}</Text>
                      <Text style={[styles.cardPhone, { color: textSecondary }]}>{addr.phone}</Text>
                    </View>
                    {addr.isDefault && (
                      <View style={styles.defaultTag}>
                        <Text style={styles.defaultTagText}>默認地址</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.cardActions}>
                  <Pressable onPress={() => handleEdit(addr)} style={styles.actionBtn}>
                    <Edit3 size={16} color="#60a5fa" />
                  </Pressable>
                  <Pressable onPress={() => handleDelete(addr.id)} style={styles.actionBtn}>
                    <Trash2 size={16} color="#fda4af" />
                  </Pressable>
                </View>
              </View>
              <View style={styles.cardDetail}>
                <Text style={[styles.cardArea, { color: textSecondary }]}>{addr.area}</Text>
                <Text style={[styles.cardDetailText, { color: textPrimary }]}>{addr.detail}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* 添加/編輯 底部彈窗 */}
      <Modal visible={showAddModal} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => !isSaving && setShowAddModal(false)} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalKeyboard}
        >
          <View style={[styles.sheet, { backgroundColor: dark ? colors.slate[900] : '#fff', paddingBottom: insets.bottom + 24 }]}>
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: textPrimary }]}>{editingAddress ? '編輯地址' : '添加新地址'}</Text>
              <Pressable onPress={() => setShowAddModal(false)} style={styles.sheetClose}>
                <X size={24} color={textSecondary} />
              </Pressable>
            </View>

            <View style={styles.formRow}>
              <View style={styles.formHalf}>
                <Text style={[styles.formLabel, { color: textSecondary }]}>收貨人</Text>
                <TextInput
                  value={formData.receiverName ?? ''}
                  onChangeText={(v) => setFormData({ ...formData, receiverName: v })}
                  placeholder="姓名"
                  placeholderTextColor={textSecondary}
                  style={[styles.input, { backgroundColor: dark ? colors.slate[800] : colors.gray[50], color: textPrimary }]}
                />
              </View>
              <View style={styles.formHalf}>
                <Text style={[styles.formLabel, { color: textSecondary }]}>聯繫電話</Text>
                <TextInput
                  value={formData.phone ?? ''}
                  onChangeText={(v) => setFormData({ ...formData, phone: v })}
                  placeholder="手機號"
                  placeholderTextColor={textSecondary}
                  keyboardType="phone-pad"
                  style={[styles.input, { backgroundColor: dark ? colors.slate[800] : colors.gray[50], color: textPrimary }]}
                />
              </View>
            </View>

            <View style={styles.formBlock}>
              <Text style={[styles.formLabel, { color: textSecondary }]}>所在地區</Text>
              <Pressable
                onPress={() => setShowAreaPicker(!showAreaPicker)}
                style={[styles.selectTrigger, { backgroundColor: dark ? colors.slate[800] : colors.gray[50] }]}
              >
                <Text style={[styles.selectTriggerText, { color: textPrimary }]}>{formData.area ?? '中西區'}</Text>
                <ChevronDown size={18} color={textSecondary} />
              </Pressable>
              {showAreaPicker && (
                <ScrollView style={styles.pickerList} nestedScrollEnabled>
                  {HK_DISTRICTS.map((d) => (
                    <Pressable
                      key={d}
                      onPress={() => {
                        setFormData({ ...formData, area: d });
                        setShowAreaPicker(false);
                      }}
                      style={[styles.pickerItem, formData.area === d && styles.pickerItemActive]}
                    >
                      <Text style={[styles.pickerItemText, { color: formData.area === d ? colors.orange[600] : textPrimary }]}>{d}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            </View>

            <View style={styles.formBlock}>
              <Text style={[styles.formLabel, { color: textSecondary }]}>詳細地址</Text>
              <TextInput
                value={formData.detail ?? ''}
                onChangeText={(v) => setFormData({ ...formData, detail: v })}
                placeholder="樓層、門牌號等詳細資訊"
                placeholderTextColor={textSecondary}
                multiline
                numberOfLines={2}
                style={[styles.input, styles.textArea, { backgroundColor: dark ? colors.slate[800] : colors.gray[50], color: textPrimary }]}
              />
            </View>

            <View style={styles.formRowBetween}>
              <View style={styles.labelChips}>
                {(['HOME', 'WORK', 'SCHOOL'] as const).map((l) => (
                  <Pressable
                    key={l}
                    onPress={() => setFormData({ ...formData, label: l })}
                    style={[
                      styles.chip,
                      formData.label === l ? styles.chipActive : { backgroundColor: dark ? colors.slate[800] : '#fff', borderColor: glassBorder },
                    ]}
                  >
                    <Text style={[styles.chipText, formData.label === l ? styles.chipTextActive : { color: textSecondary }]}>
                      {l === 'HOME' ? '家' : l === 'WORK' ? '公司' : '學校'}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Pressable
                onPress={() => setFormData({ ...formData, isDefault: !formData.isDefault })}
                style={styles.defaultRow}
              >
                <View style={[styles.toggle, formData.isDefault && styles.toggleOn]}>
                  <View style={styles.toggleThumb} />
                </View>
                <Text style={[styles.defaultLabel, { color: textSecondary }]}>默認</Text>
              </Pressable>
            </View>

            <Pressable
              onPress={handleSave}
              disabled={isSaving}
              style={({ pressed }) => [styles.saveBtn, { opacity: isSaving ? 0.5 : pressed ? 0.9 : 1 }]}
            >
              {isSaving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>保存地址資訊</Text>}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerWrap: { marginBottom: spacing.sm },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.orange[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { flex: 1 },
  content: {},
  emptyWrap: { flex: 1, paddingVertical: 80, alignItems: 'center', justifyContent: 'center' },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  emptyText: { fontSize: 12, fontWeight: '800' },
  emptyTitle: { fontSize: 14, fontWeight: '800', marginBottom: 24 },
  emptyBtn: { backgroundColor: colors.orange[500], paddingHorizontal: 32, paddingVertical: 12, borderRadius: 20 },
  emptyBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },

  card: {
    borderRadius: borderRadius['3xl'],
    padding: spacing.xl,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  labelIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  labelIconDefault: { backgroundColor: colors.orange[500] },
  labelIconNormal: { backgroundColor: colors.gray[400] },
  cardNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardName: { fontSize: 16, fontWeight: '800' },
  cardPhone: { fontSize: 12, fontWeight: '700' },
  defaultTag: { backgroundColor: '#fff7ed', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start', marginTop: 4 },
  defaultTagText: { fontSize: 9, fontWeight: '800', color: colors.orange[600], letterSpacing: -0.3 },
  cardActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { padding: 8 },
  cardDetail: { marginTop: 12 },
  cardArea: { fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 4 },
  cardDetailText: { fontSize: 14, fontWeight: '700', lineHeight: 20 },

  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalKeyboard: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing['2xl'],
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xl },
  sheetTitle: { fontSize: 20, fontWeight: '800' },
  sheetClose: { padding: 8 },

  formRow: { flexDirection: 'row', gap: 12, marginBottom: spacing.lg },
  formHalf: { flex: 1 },
  formBlock: { marginBottom: spacing.lg },
  formLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 8, paddingHorizontal: 4 },
  input: { borderRadius: 16, paddingHorizontal: 20, paddingVertical: 16, fontSize: 14, fontWeight: '700' },
  textArea: { minHeight: 64 },
  selectTrigger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 16, paddingHorizontal: 20, paddingVertical: 16 },
  selectTriggerText: { fontSize: 14, fontWeight: '700' },
  pickerList: { maxHeight: 160, marginTop: 8, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.04)' },
  pickerItem: { paddingVertical: 12, paddingHorizontal: 16 },
  pickerItemActive: { backgroundColor: 'rgba(249,115,22,0.1)' },
  pickerItemText: { fontSize: 14, fontWeight: '700' },

  formRowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xl },
  labelChips: { flexDirection: 'row', gap: 12 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  chipActive: { backgroundColor: colors.orange[500], borderColor: colors.orange[500] },
  chipText: { fontSize: 10, fontWeight: '800' },
  chipTextActive: { color: '#fff' },
  defaultRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  toggle: { width: 40, height: 24, borderRadius: 12, padding: 2, backgroundColor: '#e5e7eb', justifyContent: 'center' },
  toggleOn: { backgroundColor: colors.orange[500], alignItems: 'flex-end' },
  defaultLabel: { fontSize: 10, fontWeight: '800' },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 2 },

  saveBtn: {
    width: '100%',
    height: 56,
    backgroundColor: colors.orange[600],
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});
