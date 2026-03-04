import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  User,
  AtSign,
  Phone,
  Key,
  Mail,
  Chrome,
  Apple,
  ChevronRight,
  ShieldCheck,
  UserCircle,
  X,
  Check,
} from 'lucide-react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../navigation/types';
import type { UserInfo } from '../types';
import { ViewHeader } from '../components/shared/CommonUI';
import { colors, spacing, borderRadius } from '../theme/tokens';
import { useApp } from '../context/AppContext';
import * as mockApi from '../api/mock';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'PersonalInfo'>;

type EditingField = 'name' | 'gender' | 'phone' | 'email' | null;

const GENDER_OPTIONS = ['男', '女', '非二元', '保密'];

export default function PersonalInfoScreen({
  navigation,
  user: userProp,
}: {
  navigation: Nav;
  user: UserInfo | null;
}) {
  const insets = useSafeAreaInsets();
  const { user: ctxUser, setUser, isDarkMode } = useApp();
  const user = userProp ?? ctxUser;
  const dark = isDarkMode;

  const [isSaving, setIsSaving] = useState(false);
  const [editingField, setEditingField] = useState<EditingField>(null);
  const [tempValue, setTempValue] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    gender: '保密',
    phone: '',
    email: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name ?? '',
        gender: user.gender ?? '保密',
        phone: user.phone ?? '',
        email: user.email ?? '',
      });
    }
  }, [user]);

  const openEdit = (field: EditingField, currentVal: string) => {
    setEditingField(field);
    setTempValue(currentVal);
  };

  const handleFieldSave = async () => {
    if (!editingField) return;
    setIsSaving(true);
    try {
      const updatedData = { ...formData, [editingField]: tempValue };
      const updatedUser = await mockApi.updateUserProfile(updatedData);
      setFormData(updatedData);
      setUser(updatedUser);
      setEditingField(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const textPrimary = dark ? '#f8fafc' : colors.gray[800];
  const textSecondary = dark ? colors.slate[800] : colors.gray[400];
  const glassBg = dark ? 'rgba(30,41,59,0.85)' : 'rgba(255,255,255,0.7)';
  const glassBorder = dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.45)';
  const iconBg = dark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.06)';
  const dividerColor = dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
  const sectionTitleColor = dark ? colors.gray[500] : colors.gray[400];

  const infoItems: Array<{
    label: string;
    value: string | undefined;
    icon: React.ReactNode;
    type?: 'readonly';
    onClick?: () => void;
  }> = [
    { label: '賬號名', value: user?.username, icon: <AtSign size={18} color={dark ? colors.gray[400] : colors.gray[500]} />, type: 'readonly' },
    { label: '名稱', value: formData.name, icon: <User size={18} color={dark ? colors.gray[400] : colors.gray[500]} />, onClick: () => openEdit('name', formData.name) },
    { label: '性別', value: formData.gender, icon: <UserCircle size={18} color={dark ? colors.gray[400] : colors.gray[500]} />, onClick: () => openEdit('gender', formData.gender) },
    { label: '手機號碼', value: formData.phone, icon: <Phone size={18} color={dark ? colors.gray[400] : colors.gray[500]} />, onClick: () => openEdit('phone', formData.phone) },
    { label: '電子郵箱', value: formData.email, icon: <Mail size={18} color={dark ? colors.gray[400] : colors.gray[500]} />, onClick: () => openEdit('email', formData.email) },
  ];

  const securityItems = [
    { label: '修改密碼', icon: <Key size={18} color={dark ? colors.gray[400] : colors.gray[500]} />, extra: '上次更換於 3 個月前' },
  ];

  const bindItems = [
    { label: 'Google 賬號', icon: <Chrome size={18} color="#3b82f6" />, bound: user?.googleBound },
    { label: 'Apple ID', icon: <Apple size={18} color={dark ? '#f8fafc' : colors.gray[800]} />, bound: user?.appleBound },
  ];

  const fieldLabel =
    editingField === 'name' ? '名稱' : editingField === 'gender' ? '性別' : editingField === 'phone' ? '手機號碼' : '電子郵箱';
  const inputLabel =
    editingField === 'name' ? '名稱' : editingField === 'phone' ? '手機號' : editingField === 'email' ? '郵箱地址' : '';

  return (
    <View style={[styles.container, { backgroundColor: dark ? colors.glassBg.dark : colors.glassBg.light, paddingTop: insets.top }]}>
      <View style={[styles.headerWrap, { paddingHorizontal: spacing.xl }]}>
        <ViewHeader title="個人信息" onBack={() => navigation.goBack()} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: 120, paddingHorizontal: spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 基礎資料 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: sectionTitleColor }]}>基礎資料</Text>
          <View style={[styles.card, { backgroundColor: glassBg, borderColor: glassBorder }]}>
            {infoItems.map((item, idx) => (
              <Pressable
                key={idx}
                onPress={item.onClick}
                disabled={!item.onClick}
                style={({ pressed }) => [
                  styles.row,
                  idx < infoItems.length - 1 && [styles.rowBorder, { borderBottomColor: dividerColor }],
                  item.onClick && pressed && { backgroundColor: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' },
                ]}
              >
                <View style={styles.rowLeft}>
                  <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>{item.icon}</View>
                  <Text style={[styles.rowLabel, { color: textPrimary }]}>{item.label}</Text>
                </View>
                <View style={styles.rowRight}>
                  <Text
                    style={[styles.rowValue, { color: item.type === 'readonly' ? textSecondary : textPrimary }]}
                    numberOfLines={1}
                  >
                    {item.value || '未綁定'}
                  </Text>
                  {item.onClick && <ChevronRight size={14} color={textSecondary} />}
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* 安全中心 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: sectionTitleColor }]}>安全中心</Text>
          <View style={[styles.card, { backgroundColor: glassBg, borderColor: glassBorder }]}>
            {securityItems.map((item, idx) => (
              <View key={idx} style={styles.row}>
                <View style={styles.rowLeft}>
                  <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>{item.icon}</View>
                  <Text style={[styles.rowLabel, { color: textPrimary }]}>{item.label}</Text>
                </View>
                <View style={styles.rowRight}>
                  <Text style={[styles.rowExtra, { color: textSecondary }]}>{item.extra}</Text>
                  <ChevronRight size={16} color={textSecondary} />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 第三方綁定 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: sectionTitleColor }]}>第三方綁定</Text>
          <View style={[styles.card, { backgroundColor: glassBg, borderColor: glassBorder }]}>
            {bindItems.map((item, idx) => (
              <View key={idx} style={[styles.row, idx < bindItems.length - 1 && [styles.rowBorder, { borderBottomColor: dividerColor }]]}>
                <View style={styles.rowLeft}>
                  <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>{item.icon}</View>
                  <Text style={[styles.rowLabel, { color: textPrimary }]}>{item.label}</Text>
                </View>
                <View style={[styles.bindBadge, item.bound ? styles.bindBadgeBound : styles.bindBadgeUnbound]}>
                  <Text style={[styles.bindBadgeText, item.bound ? styles.bindBadgeTextBound : styles.bindBadgeTextUnbound]}>
                    {item.bound ? '已綁定' : '去綁定'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.footerNote}>
          <ShieldCheck size={12} color={textSecondary} />
          <Text style={[styles.footerText, { color: textSecondary }]}>數據已通過 256 位加密保護</Text>
        </View>
      </ScrollView>

      {/* 編輯底部彈窗 */}
      <Modal visible={!!editingField} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => !isSaving && setEditingField(null)} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalKeyboard}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <View style={[styles.sheet, { backgroundColor: dark ? colors.slate[900] : '#fff', paddingBottom: insets.bottom + 24 }]}>
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: textPrimary }]}>修改{fieldLabel}</Text>
              <Pressable onPress={() => setEditingField(null)} style={[styles.sheetClose, { backgroundColor: dark ? colors.slate[800] : '#f3f4f6' }]}>
                <X size={18} color={textSecondary} />
              </Pressable>
            </View>

            {editingField === 'gender' ? (
              <View style={styles.genderGrid}>
                {GENDER_OPTIONS.map((option) => (
                  <Pressable
                    key={option}
                    onPress={() => setTempValue(option)}
                    style={[
                      styles.genderOption,
                      {
                        backgroundColor: tempValue === option ? (dark ? 'rgba(249,115,22,0.2)' : '#fff7ed') : dark ? colors.slate[800] : colors.gray[50],
                        borderColor: tempValue === option ? colors.orange[500] : dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                      },
                    ]}
                  >
                    <Text style={[styles.genderOptionText, { color: tempValue === option ? colors.orange[600] : textSecondary }]}>{option}</Text>
                    {tempValue === option && <Check size={16} color={colors.orange[600]} />}
                  </Pressable>
                ))}
              </View>
            ) : (
              <View style={styles.inputBlock}>
                <Text style={[styles.inputLabel, { color: sectionTitleColor }]}>請輸入新{inputLabel}</Text>
                <TextInput
                  autoFocus
                  value={tempValue}
                  onChangeText={setTempValue}
                  placeholder={`請輸入${editingField === 'name' ? '名稱' : editingField === 'phone' ? '手機號' : '郵箱'}`}
                  placeholderTextColor={textSecondary}
                  keyboardType={editingField === 'phone' ? 'phone-pad' : editingField === 'email' ? 'email-address' : 'default'}
                  style={[styles.input, { backgroundColor: dark ? colors.slate[800] : colors.gray[50], color: textPrimary }]}
                />
              </View>
            )}

            <Pressable
              onPress={handleFieldSave}
              disabled={isSaving || (editingField !== 'gender' && !tempValue.trim())}
              style={({ pressed }) => [
                styles.saveBtn,
                { opacity: isSaving || (editingField !== 'gender' && !tempValue.trim()) ? 0.5 : pressed ? 0.9 : 1 },
              ]}
            >
              {isSaving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>確認保存</Text>}
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
  scroll: { flex: 1 },
  content: {},
  section: { marginBottom: spacing['2xl'] },
  sectionTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: spacing.md, paddingHorizontal: 8 },
  card: { borderRadius: borderRadius['3xl'], borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 20, paddingHorizontal: 20 },
  rowBorder: { borderBottomWidth: 1 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: 14, fontWeight: '700' },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowValue: { fontSize: 14, fontWeight: '800', maxWidth: 140, textAlign: 'right' },
  rowExtra: { fontSize: 10, fontWeight: '700' },
  bindBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999 },
  bindBadgeBound: { backgroundColor: 'rgba(16,185,129,0.15)' },
  bindBadgeUnbound: { backgroundColor: 'rgba(0,0,0,0.06)' },
  bindBadgeText: { fontSize: 10, fontWeight: '800' },
  bindBadgeTextBound: { color: '#059669' },
  bindBadgeTextUnbound: { color: colors.gray[400] },
  footerNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: spacing.lg },
  footerText: { fontSize: 9, fontWeight: '800', letterSpacing: 2, fontStyle: 'italic' },

  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalKeyboard: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing['2xl'],
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xl },
  sheetTitle: { fontSize: 20, fontWeight: '800' },
  sheetClose: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  genderGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: spacing.xl },
  genderOption: { width: '47%', paddingVertical: 16, paddingHorizontal: 16, borderRadius: 16, borderWidth: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  genderOptionText: { fontSize: 14, fontWeight: '800' },
  inputBlock: { marginBottom: spacing.xl },
  inputLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 8, paddingHorizontal: 4 },
  input: { borderRadius: 16, paddingHorizontal: 20, paddingVertical: 16, fontSize: 16, fontWeight: '800' },
  saveBtn: {
    width: '100%',
    height: 56,
    backgroundColor: colors.orange[500],
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});
