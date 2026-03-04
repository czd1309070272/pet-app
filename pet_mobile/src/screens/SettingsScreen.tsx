import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  StyleSheet,
  Platform,
} from 'react-native';
import {
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  Bell,
  Globe,
  Shield,
  Smartphone,
  Trash2,
  UserCircle,
  MapPin,
  FileText,
  Info,
  LogOut,
} from 'lucide-react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../navigation/types';
import { colors, spacing, borderRadius, shadowGlass } from '../theme/tokens';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'Settings'>;

const SECTION_PADDING = 24;
const GLASS_BORDER_RADIUS = 32;

const sections = [
  {
    title: '帳戶與通訊',
    items: [
      { icon: UserCircle, iconColor: '#3b82f6', label: '個人信息', extra: '已完善', route: 'PersonalInfo' as const },
      { icon: MapPin, iconColor: '#10b981', label: '收貨地址', extra: '管理', route: 'Address' as const },
      { icon: Bell, iconColor: '#f97316', label: '通知提醒', extra: '開啟', route: null },
      { icon: Globe, iconColor: '#6366f1', label: '多語言設置', extra: '繁體中文', route: null },
    ],
  },
  {
    title: '隱私與數據',
    items: [
      { icon: Shield, iconColor: '#10b981', label: '隱私中心', extra: '', route: null },
      { icon: Trash2, iconColor: '#f43f5e', label: '清除緩存', extra: '24.5 MB', route: null },
    ],
  },
  {
    title: '關於',
    items: [
      { icon: Smartphone, iconColor: '#a855f7', label: '檢查更新', extra: 'v1.2.0 (最新)', route: null },
      { icon: FileText, iconColor: '#60a5fa', label: '用戶協議', extra: '', route: null },
      { icon: Shield, iconColor: '#34d399', label: '隱私協議', extra: '', route: null },
      { icon: Info, iconColor: '#9ca3af', label: '關於 PawPal AI', extra: '', route: null },
    ],
  },
];

export default function SettingsScreen({
  navigation,
  onBack,
  isDarkMode,
  onToggleDarkMode,
  onLogout,
}: {
  navigation: Nav;
  onBack: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onLogout: () => void;
}) {
  // 使用 app 內黑夜模式開關驅動整頁主題（與 Switch 一致）
  const dark = isDarkMode;
  const textPrimary = dark ? '#f8fafc' : colors.gray[800];
  const textSecondary = dark ? colors.slate[800] : colors.gray[400];
  const glassBg = dark ? 'rgba(30,41,59,0.85)' : 'rgba(255,255,255,0.7)';
  const glassBorder = dark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.6)';
  const sectionTitleColor = dark ? colors.gray[500] : colors.gray[400];
  const dividerColor = dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)';

  return (
    <View style={[styles.container, { backgroundColor: dark ? colors.glassBg.dark : colors.glassBg.light }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          style={({ pressed }) => [
            styles.backBtn,
            { backgroundColor: glassBg, borderColor: glassBorder, opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.96 : 1 }] },
          ]}
        >
          <ChevronLeft size={24} color={dark ? '#f8fafc' : colors.gray[600]} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: textPrimary }]}>系統設置</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Dark Mode Switcher - 黑夜模式 */}
        <View
          style={[
            styles.darkModeCard,
            { backgroundColor: glassBg, borderColor: glassBorder },
            Platform.OS === 'ios' && (dark ? shadowGlass.dark : shadowGlass.light),
          ]}
        >
          <View style={styles.darkModeLeft}>
            <View style={[styles.darkModeIconWrap, isDarkMode ? styles.darkModeIconDark : styles.darkModeIconLight]}>
              {isDarkMode ? (
                <Moon size={24} color="#818cf8" />
              ) : (
                <Sun size={24} color="#fff" />
              )}
            </View>
            <View>
              <Text style={[styles.darkModeTitle, { color: textPrimary }]}>黑夜模式</Text>
              <Text style={[styles.darkModeSub, { color: textSecondary }]}>APPEARANCE</Text>
            </View>
          </View>
          <Switch
            value={!!isDarkMode}
            onValueChange={onToggleDarkMode}
            trackColor={{ false: dark ? colors.slate[800] : '#e5e7eb', true: '#6366f1' }}
            thumbColor="#fff"
          />
        </View>

        {/* Settings Sections */}
        <View style={styles.sections}>
          {sections.map((section, idx) => (
            <View key={idx} style={styles.sectionBlock}>
              <Text style={[styles.sectionTitle, { color: sectionTitleColor }]}>{section.title}</Text>
              <View style={[styles.sectionCard, { backgroundColor: glassBg, borderColor: glassBorder }]}>
                {section.items.map((item, i) => (
                  <Pressable
                    key={i}
                    onPress={() => item.route && navigation.navigate(item.route)}
                    style={({ pressed }) => [
                      styles.sectionItem,
                      i < section.items.length - 1 && [styles.sectionItemBorder, { borderBottomColor: dividerColor }],
                      pressed && { backgroundColor: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' },
                    ]}
                  >
                    <View style={styles.sectionItemLeft}>
                      <View style={[styles.sectionIconWrap, { backgroundColor: dark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.06)' }]}>
                        <item.icon size={20} color={item.iconColor} />
                      </View>
                      <Text style={[styles.sectionLabel, { color: textPrimary }]}>{item.label}</Text>
                    </View>
                    <View style={styles.sectionItemRight}>
                      {item.extra ? (
                        <Text style={[styles.sectionExtra, { color: textSecondary }]}>{item.extra}</Text>
                      ) : null}
                      <ChevronRight size={18} color={dark ? colors.gray[600] : colors.gray[400]} />
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* Danger Zone - 切換帳號或登出 */}
        <View style={styles.dangerZone}>
          <Pressable
            onPress={onLogout}
            style={({ pressed }) => [
              styles.logoutBtn,
              {
                backgroundColor: dark ? 'rgba(244,63,94,0.15)' : 'rgba(254,226,226,0.6)',
                borderColor: dark ? 'rgba(244,63,94,0.25)' : 'rgba(254,202,202,0.8)',
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <LogOut size={20} color="#e11d48" />
            <Text style={styles.logoutText}>切換帳號或登出</Text>
          </Pressable>
        </View>

        <Text style={[styles.footer, { color: textSecondary }]}>PawPal AI Pro · Stability Build 2025</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: SECTION_PADDING, paddingTop: Platform.OS === 'ios' ? 56 : 48 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl, gap: spacing.lg },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  content: {},
  darkModeCard: {
    borderRadius: GLASS_BORDER_RADIUS,
    padding: spacing.xl,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing['2xl'],
  },
  darkModeLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  darkModeIconWrap: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  darkModeIconDark: { backgroundColor: 'rgba(99,102,241,0.2)' },
  darkModeIconLight: { backgroundColor: 'rgba(249,115,22,0.2)' },
  darkModeTitle: { fontSize: 18, fontWeight: '800' },
  darkModeSub: { fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  sections: { marginBottom: spacing.xl },
  sectionBlock: { marginBottom: spacing['2xl'] },
  sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 2, marginBottom: spacing.md, paddingHorizontal: 8 },
  sectionCard: { borderRadius: GLASS_BORDER_RADIUS, borderWidth: 1, overflow: 'hidden' },
  sectionItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 20, paddingHorizontal: 20 },
  sectionItemBorder: { borderBottomWidth: 1 },
  sectionItemLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  sectionIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sectionLabel: { fontSize: 16, fontWeight: '700' },
  sectionItemRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sectionExtra: { fontSize: 14, fontWeight: '700' },
  dangerZone: { marginTop: spacing.lg },
  logoutBtn: {
    width: '100%',
    paddingVertical: 20,
    borderRadius: 28,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutText: { color: '#e11d48', fontSize: 14, fontWeight: '800' },
  footer: {
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: spacing.xl,
    fontStyle: 'italic',
  },
});
