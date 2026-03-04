import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  StyleSheet,
  Modal,
  TextInput,
  ActivityIndicator,
  Vibration,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronRight,
  Settings,
  Camera,
  Award,
  Crown,
  Sparkles,
  Package,
  ShoppingCart,
  Pill,
  Wallet,
  Clock,
  LogOut,
  X,
  Send,
  ArrowUp,
  ArrowDown,
  Heart,
  Plus,
  Activity,
  Search,
  FileText,
  MapPinned,
  Stars,
  Moon,
  AlertTriangle,
  Edit3,
  LayoutGrid,
  Image as ImageIcon,
  ShieldCheck,
} from 'lucide-react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../navigation/types';
import type { PetProfile, AlbumPhoto, UserInfo, Appointment } from '../types';
import { colors, borderRadius, spacing, shadowGlass } from '../theme/tokens';
import { ensureImageUri } from '../utils/imageUri';
import { useTabBarVisibility } from '../context/TabBarVisibilityContext';
import { useApp } from '../context/AppContext';
import * as mockApi from '../api/mock';
import * as frontApi from '../front_api';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'Profile'>;

const STATS = [
  { label: '相伴天數', value: '458', color: colors.orange[600] },
  { label: '日記篇數', value: '124', color: '#2563eb' },
  { label: '檢測次數', value: '32', color: '#059669' },
];

const H_PAD = 20;
const SECTION_GAP = 28;

export default function ProfileScreen({
  navigation,
  route,
  user: userProp,
}: {
  navigation: Nav;
  route: { params?: { openAddPet?: boolean } };
  user: UserInfo | null;
}) {
  const { user: ctxUser, logout, setUser, isDarkMode } = useApp();
  const user = userProp ?? ctxUser;
  const dark = isDarkMode;
  const { reportScroll } = useTabBarVisibility();
  const insets = useSafeAreaInsets();

  const [pets, setPets] = useState<PetProfile[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [albumPreview, setAlbumPreview] = useState<AlbumPhoto[]>([]);
  const [showPetListModal, setShowPetListModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [activeVaultTab, setActiveVaultTab] = useState<'ACTIVE' | 'MEMORIAL'>('ACTIVE');
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [selectedSortIdx, setSelectedSortIdx] = useState<number | null>(null);
  const [confirmMemorialPet, setConfirmMemorialPet] = useState<PetProfile | null>(null);
  const [isMovingToMemorial, setIsMovingToMemorial] = useState(false);
  const [newPet, setNewPet] = useState({
    name: '',
    breed: '',
    gender: '小公主 (已絕育)',
    birthday: new Date().toISOString().split('T')[0],
    hobbies: '',
    isMemorial: false,
  });
  const [tempAvatar, setTempAvatar] = useState('https://picsum.photos/seed/pet_placeholder/200');

  const loadData = useCallback(async () => {
    const [petsRes, appointmentsRes, photosRes] = await Promise.all([
      frontApi.fetchPets(),
      mockApi.fetchAppointments(),
      mockApi.fetchAlbumPhotos(),
    ]);
    setPets(petsRes);
    setAppointments(appointmentsRes);
    setAlbumPreview(photosRes.slice(0, 3));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 從首頁「去添加寵物」進入時自動彈出添加新成員
  useEffect(() => {
    if (route.params?.openAddPet) {
      setShowAddModal(true);
      navigation.setParams({ openAddPet: undefined });
    }
  }, [route.params?.openAddPet, navigation]);

  const handleAvatarPress = async () => {
    const mockUrl = `https://picsum.photos/seed/user_${Date.now()}/200`;
    const updated = await mockApi.updateUserProfile({ avatar: mockUrl });
    setUser?.(updated);
    if (Platform.OS !== 'web' && Vibration.vibrate) Vibration.vibrate(50);
  };

  const rootNav = navigation.getParent() as { navigate: (tab: string, opts?: { screen: string; params?: object }) => void } | undefined;

  const activePets = pets.filter((p) => !p.isMemorial);
  const memorialPets = pets.filter((p) => p.isMemorial);

  const handleAddPet = async () => {
    if (!newPet.name || !newPet.breed) return;
    setIsAdding(true);
    try {
      const added = await frontApi.addPet({
        ...newPet,
        avatar: tempAvatar,
      });
      setPets((prev) => [...prev, added]);
      setShowAddModal(false);
      setNewPet({
        name: '',
        breed: '',
        gender: '小公主 (已絕育)',
        birthday: new Date().toISOString().split('T')[0],
        hobbies: '',
        isMemorial: false,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsAdding(false);
    }
  };

  const handleMovePet = (idx: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= activePets.length) return;
    const newPets = [...pets];
    const currentId = activePets[idx].id;
    const targetId = activePets[newIdx].id;
    const realIdx = newPets.findIndex((p) => p.id === currentId);
    const realTargetIdx = newPets.findIndex((p) => p.id === targetId);
    const [moved] = newPets.splice(realIdx, 1);
    newPets.splice(realTargetIdx, 0, moved);
    setPets(newPets);
    setSelectedSortIdx(newIdx);
    if (Platform.OS !== 'web' && Vibration.vibrate) Vibration.vibrate(40);
  };

  const handleConfirmMemorial = async () => {
    if (!confirmMemorialPet) return;
    setIsMovingToMemorial(true);
    try {
      const updated = await mockApi.moveToMemorial(confirmMemorialPet.id);
      setPets((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setConfirmMemorialPet(null);
      if (Platform.OS !== 'web' && Vibration.vibrate) Vibration.vibrate([30, 100, 30]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsMovingToMemorial(false);
    }
  };

  const textPrimary = dark ? '#f8fafc' : colors.gray[800];
  const textSecondary = dark ? colors.gray[500] : colors.gray[400];
  const glassBg = dark ? 'rgba(30,41,59,0.85)' : 'rgba(255,255,255,0.7)';
  const glassBorder = dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.5)';
  const padLeft = H_PAD + insets.left;
  const padRight = H_PAD + insets.right;

  const menuItems = [
    { icon: Package, iconColor: colors.orange[500], label: '我的訂單', badge: '', onPress: () => navigation.navigate('Orders', {}) },
    { icon: ShoppingCart, iconColor: colors.orange[500], label: '我的購物籃', badge: '', onPress: () => navigation.navigate('Cart') },
    { icon: Pill, iconColor: '#6366f1', label: '用藥提醒', badge: '', onPress: () => navigation.navigate('Medication') },
    { icon: Wallet, iconColor: '#059669', label: '寵物錢包', badge: '', onPress: () => navigation.navigate('Wallet') },
    { icon: Clock, iconColor: '#e11d48', label: '我的預約', badge: appointments.length > 0 ? String(appointments.length) : '', onPress: () => navigation.navigate('Appointment') },
    { icon: ShieldCheck, iconColor: '#059669', label: '保單管理', badge: '', onPress: () => navigation.navigate('Insurance') },
    { icon: Settings, iconColor: textSecondary, label: '系統設置', badge: '', onPress: () => navigation.navigate('Settings') },
  ];

  const historyItems = [
    { icon: Activity, label: '健康檢測', bg: '#dbeafe', text: '#2563eb', onPress: () => navigation.navigate('HistoryReport', { type: 'HEALTH' }) },
    { icon: Search, label: '成分分析', bg: '#ffe4e6', text: '#e11d48', onPress: () => navigation.navigate('HistoryReport', { type: 'SCANNER' }) },
    { icon: FileText, label: '報告翻譯', bg: '#d1fae5', text: '#059669', onPress: () => navigation.navigate('HistoryReport', { type: 'TRANSLATOR' }) },
  ];

  // 黑夜模式：整页与顶部 hero 使用同一背景（与其它页面一致的 slate[950]），避免顶部拼色
  const pageBg = dark ? colors.slate[950] : '#fff9f5';
  const heroBg = dark ? colors.slate[950] : 'rgba(253,186,116,0.35)';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: pageBg }]}
      contentContainerStyle={[styles.content, { paddingBottom: 24 + insets.bottom }]}
      showsVerticalScrollIndicator={false}
      onScroll={reportScroll}
      scrollEventThrottle={16}
    >
      {/* Hero Header - 左右留出安全区，避免地图/设置图标贴边或超出 */}
      <View style={[styles.hero, {
        backgroundColor: heroBg,
        paddingTop: 12 + insets.top,
        paddingLeft: padLeft,
        paddingRight: padRight,
        paddingBottom: SECTION_GAP,
      }]}>
        <View style={styles.headerRow}>
          <View style={styles.profileRow}>
            <Pressable onPress={handleAvatarPress} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
              <View style={styles.avatarWrap}>
                <Image source={{ uri: ensureImageUri(user?.avatar, 'https://picsum.photos/seed/owner/200') }} style={styles.avatar} />
                <View style={[styles.cameraBtn, { backgroundColor: dark ? colors.slate[800] : '#fff' }]}>
                  <Camera size={12} color={colors.orange[500]} />
                </View>
              </View>
            </Pressable>
            <View style={styles.profileInfo}>
              <Text style={[styles.userName, { color: textPrimary }]}>{user?.name ?? '陳大萌'}</Text>
              <View style={styles.badgesRow}>
                <View style={[styles.badge, { borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(249,115,22,0.2)' }]}>
                  <Text style={[styles.badgeText, { color: colors.orange[600] }]}>資深鏟屎官</Text>
                </View>
                <View style={styles.levelRow}>
                  <Award size={12} color="#eab308" />
                  <Text style={[styles.levelText, { color: textSecondary }]}>LV.{user?.level ?? 1}</Text>
                </View>
                {user?.isVIP && (
                  <View style={styles.vipBadge}>
                    <Crown size={10} color="#fff" fill="#fff" />
                    <Text style={styles.vipBadgeText}>{user.vipLevel}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
          <View style={styles.headerActions}>
            <Pressable onPress={() => navigation.navigate('Address')} style={[styles.iconBtn, { backgroundColor: glassBg, borderColor: glassBorder }]}>
              <MapPinned size={20} color={textSecondary} />
            </Pressable>
            <Pressable onPress={() => navigation.navigate('Settings')} style={[styles.iconBtn, { backgroundColor: glassBg, borderColor: glassBorder }]}>
              <Settings size={20} color={textSecondary} />
            </Pressable>
          </View>
        </View>

        {/* Membership Card */}
        <Pressable onPress={() => navigation.navigate('Membership')} style={styles.membershipCard}>
          <View style={styles.membershipInner}>
            <View style={styles.membershipLeft}>
              <View style={styles.membershipIconWrap}>
                <Sparkles size={24} color="#fff" />
              </View>
              <View>
                <Text style={styles.membershipTitle}>PawPal 超級會員中心</Text>
                <Text style={styles.membershipSub}>
                  {user?.isVIP ? `保障中 · ${(user.vipExpiry ?? '').slice(0, 10)} 到期` : '解鎖 AI 無限診斷次數'}
                </Text>
              </View>
            </View>
            <View style={styles.membershipBtn}>
              <Text style={styles.membershipBtnText}>立即進入</Text>
            </View>
          </View>
        </Pressable>

        {/* Stats */}
        <View style={styles.statsRow}>
          {STATS.map((stat, i) => (
            <View key={i} style={[styles.statCard, { backgroundColor: glassBg, borderColor: glassBorder }]}>
              <Text style={[styles.statLabel, { color: textSecondary }]}>{stat.label}</Text>
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 我的寶貝 */}
      <View style={[styles.section, { paddingLeft: padLeft, paddingRight: padRight, marginTop: SECTION_GAP }]}>
        <View style={styles.sectionHead}>
          <Text style={[styles.sectionTitle, { color: textPrimary }]}>我的寶貝</Text>
          <Pressable onPress={() => { setShowPetListModal(true); setIsReorderMode(false); setSelectedSortIdx(null); setActiveVaultTab('ACTIVE'); }} style={styles.sectionLink}>
            <Text style={styles.linkText}>萌寶檔案庫</Text>
            <ChevronRight size={14} color={colors.orange[500]} />
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.petsScroll, { paddingRight: padRight }]}>
          {activePets.slice(0, 3).map((pet) => (
            <Pressable
              key={pet.id}
              onPress={() => rootNav?.navigate('HomeTab', { screen: 'PetProfile', params: { pet } })}
              style={[styles.petCard, { backgroundColor: glassBg, borderColor: glassBorder }]}
            >
              <Image source={{ uri: ensureImageUri(pet.avatar) }} style={styles.petAvatar} />
              <Text style={[styles.petName, { color: textPrimary }]} numberOfLines={1}>{pet.name}</Text>
              <Text style={[styles.petBreed, { color: textSecondary }]} numberOfLines={1}>{pet.breed}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* 歷史檔案 */}
      <View style={[styles.section, { paddingLeft: padLeft, paddingRight: padRight, marginTop: SECTION_GAP }]}>
        <Text style={[styles.sectionTitle, { color: textPrimary, marginBottom: 14 }]}>歷史檔案</Text>
        <View style={styles.historyRow}>
          {historyItems.map((item, i) => (
            <Pressable key={i} onPress={item.onPress} style={[styles.historyBtn, { backgroundColor: item.bg }]}>
              <item.icon size={18} color={item.text} />
              <Text style={[styles.historyLabel, { color: item.text }]}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* 萌寵時光相冊 */}
      <View style={[styles.section, { paddingLeft: padLeft, paddingRight: padRight, marginTop: SECTION_GAP }]}>
        <View style={styles.albumSectionHead}>
          <ImageIcon size={18} color={colors.orange[500]} style={{ marginRight: 8 }} />
          <View>
            <Text style={[styles.sectionTitle, { color: textPrimary }]}>萌寵時光相冊</Text>
            <Text style={[styles.albumSub, { color: textSecondary }]}>Digital Pet Memories</Text>
          </View>
        </View>
        <Pressable onPress={() => navigation.navigate('Album')} style={styles.albumCard}>
          <View style={styles.albumPhotoBg}>
            {albumPreview[0] && (
              <Image source={{ uri: ensureImageUri(albumPreview[0].url) }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            )}
          </View>
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(15,23,42,0.5)' }]} />
          </View>
          <View style={styles.albumOverlay}>
            <View style={styles.albumPreviews}>
              {albumPreview.map((p, i) => (
                <Image key={i} source={{ uri: ensureImageUri(p.url) }} style={[styles.albumThumb, i > 0 && { marginLeft: -12 }]} />
              ))}
              <View style={[styles.albumPlus, albumPreview.length > 0 && { marginLeft: -12 }]}>
                <Text style={styles.albumPlusText}>+</Text>
              </View>
            </View>
            <Text style={styles.albumTitle}>點擊進入時光館</Text>
            <Text style={styles.albumDesc}>點進去查看全部精彩瞬間</Text>
          </View>
          <View style={styles.albumIconWrap}>
            <LayoutGrid size={24} color={colors.orange[500]} />
          </View>
        </Pressable>
      </View>

      {/* 功能服務 */}
      <View style={[styles.section, { paddingLeft: padLeft, paddingRight: padRight, marginTop: SECTION_GAP }]}>
        <Text style={[styles.sectionTitle, { color: textPrimary, marginBottom: 12 }]}>功能服務</Text>
        <View style={[styles.menuCard, { backgroundColor: glassBg, borderColor: glassBorder }]}>
        {menuItems.map((item, i) => (
          <Pressable
            key={i}
            onPress={item.onPress}
            style={[styles.menuItem, i < menuItems.length - 1 && [styles.menuItemBorder, { borderBottomColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]]}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconWrap, { backgroundColor: dark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)' }]}>
                <item.icon size={18} color={item.iconColor} />
              </View>
              <Text style={[styles.menuLabel, { color: textPrimary }]}>{item.label}</Text>
            </View>
            <View style={styles.menuItemRight}>
              {item.badge ? (
                <View style={styles.badgePill}>
                  <Text style={styles.badgePillText}>{item.badge}</Text>
                </View>
              ) : null}
              <ChevronRight size={16} color={textSecondary} />
            </View>
          </Pressable>
        ))}
        </View>
      </View>

      {/* 退出登入 */}
      <Pressable onPress={() => logout()} style={[styles.logoutBtn, { marginLeft: padLeft, marginRight: padRight, marginTop: SECTION_GAP + 8, borderColor: dark ? 'rgba(244,63,94,0.2)' : 'rgba(254,202,202,0.8)' }]}>
        <LogOut size={16} color="#e11d48" />
        <Text style={styles.logoutText}>退出登入</Text>
      </Pressable>
      <Text style={[styles.footer, { color: textSecondary, marginTop: 16 }]}>PawPal AI · 2025 v1.2</Text>

      {/* Pet List Modal */}
      <Modal visible={showPetListModal} transparent animationType="slide">
        <Pressable style={styles.modalBackdrop} onPress={() => setShowPetListModal(false)} />
        <View style={[styles.petModal, { backgroundColor: dark ? colors.slate[900] : '#fff' }]}>
          <View style={styles.petModalHeader}>
            <View style={styles.petModalTitleRow}>
              <View style={styles.vaultIconWrap}>
                <Heart size={20} color="#fff" fill="#fff" />
              </View>
              <View>
                <Text style={[styles.petModalTitle, { color: textPrimary }]}>萌寶檔案庫</Text>
                <Text style={styles.petModalSub}>
                  {isReorderMode ? '點擊選擇寵物並排序' : activeVaultTab === 'ACTIVE' ? `共計 ${activePets.length} 位相伴成員` : `共計 ${memorialPets.length} 位星空守護`}
                </Text>
              </View>
            </View>
            <View style={styles.petModalActions}>
              <Pressable
                onPress={() => { setIsReorderMode(!isReorderMode); setSelectedSortIdx(null); }}
                style={[styles.modalIconBtn, isReorderMode && { backgroundColor: 'rgba(249,115,22,0.15)', borderColor: colors.orange[500] }]}
              >
                <Edit3 size={18} color={isReorderMode ? colors.orange[600] : textSecondary} />
              </Pressable>
              <Pressable onPress={() => setShowPetListModal(false)} style={[styles.modalIconBtn, { backgroundColor: dark ? colors.slate[800] : colors.gray[50] }]}>
                <X size={20} color={textSecondary} />
              </Pressable>
            </View>
          </View>

          <View style={[styles.tabs, { backgroundColor: dark ? colors.slate[800] : '#f3f4f6' }]}>
            <Pressable
              onPress={() => setActiveVaultTab('ACTIVE')}
              style={[styles.tab, activeVaultTab === 'ACTIVE' && (dark ? styles.tabActiveDark : styles.tabActive)]}
            >
              <Heart size={12} color={activeVaultTab === 'ACTIVE' ? colors.orange[500] : textSecondary} fill={activeVaultTab === 'ACTIVE' ? colors.orange[500] : 'transparent'} />
              <Text style={[styles.tabText, activeVaultTab === 'ACTIVE' && { color: colors.orange[500] }]}>相伴中 ({activePets.length})</Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveVaultTab('MEMORIAL')}
              style={[styles.tab, activeVaultTab === 'MEMORIAL' && styles.tabMemorial]}
            >
              <Stars size={12} color={activeVaultTab === 'MEMORIAL' ? '#f59e0b' : textSecondary} />
              <Text style={[styles.tabText, activeVaultTab === 'MEMORIAL' && { color: '#f59e0b' }]}>星空中 ({memorialPets.length})</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.petModalList} showsVerticalScrollIndicator={false}>
            {activeVaultTab === 'ACTIVE' && activePets.map((pet, idx) => (
              <Pressable
                key={pet.id}
                onPress={() => {
                  if (isReorderMode) setSelectedSortIdx(selectedSortIdx === idx ? null : idx);
                  else {
                    setShowPetListModal(false);
                    rootNav?.navigate('HomeTab', { screen: 'PetProfile', params: { pet } });
                  }
                }}
                style={[
                  styles.petRow,
                  { backgroundColor: glassBg, borderColor: selectedSortIdx === idx ? colors.orange[500] : glassBorder },
                  selectedSortIdx === idx && styles.petRowSelected,
                ]}
              >
                <Image source={{ uri: ensureImageUri(pet.avatar) }} style={styles.petRowAvatar} />
                <View style={styles.petRowInfo}>
                  <View style={styles.petRowHead}>
                    <Text style={[styles.petRowName, { color: selectedSortIdx === idx ? colors.orange[600] : textPrimary }]}>{pet.name}</Text>
                    {idx < 3 && !isReorderMode && (
                      <View style={styles.homeTag}><Text style={styles.homeTagText}>首頁</Text></View>
                    )}
                    {isReorderMode && selectedSortIdx === idx && (
                      <View style={styles.reorderActions}>
                        <Pressable onPress={(e) => { e.stopPropagation(); setConfirmMemorialPet(pet); }} style={styles.reorderBtn}>
                          <Stars size={16} color="#f59e0b" />
                        </Pressable>
                        <Pressable disabled={idx === 0} onPress={(e) => { e.stopPropagation(); handleMovePet(idx, 'up'); }} style={[styles.reorderBtn, idx === 0 && styles.reorderBtnDisabled]}>
                          <ArrowUp size={16} color={colors.orange[500]} />
                        </Pressable>
                        <Pressable disabled={idx === activePets.length - 1} onPress={(e) => { e.stopPropagation(); handleMovePet(idx, 'down'); }} style={[styles.reorderBtn, idx === activePets.length - 1 && styles.reorderBtnDisabled]}>
                          <ArrowDown size={16} color={colors.orange[500]} />
                        </Pressable>
                      </View>
                    )}
                  </View>
                  <View style={styles.petRowMeta}>
                    <View style={[styles.breedTag, { backgroundColor: dark ? 'rgba(249,115,22,0.2)' : '#ffedd5' }]}>
                      <Text style={[styles.breedTagText, { color: colors.orange[600] }]}>{pet.breed}</Text>
                    </View>
                    <Text style={[styles.petRowGender, { color: textSecondary }]}>{pet.gender}</Text>
                  </View>
                  <Text style={[styles.petRowHobby, { color: textSecondary }]} numberOfLines={1}>愛好：{pet.hobbies}</Text>
                </View>
              </Pressable>
            ))}

            {activeVaultTab === 'MEMORIAL' && (
              memorialPets.length === 0 ? (
                <View style={styles.emptyMemorial}>
                  <Stars size={48} color="rgba(251,191,36,0.3)" />
                  <Text style={[styles.emptyMemorialText, { color: textSecondary }]}>目前尚無星空檔案</Text>
                </View>
              ) : memorialPets.map((pet) => (
                <Pressable
                  key={pet.id}
                  onPress={() => {
                    setShowPetListModal(false);
                    rootNav?.navigate('HomeTab', { screen: 'StarryMemorial', params: { pet } });
                  }}
                  style={styles.memorialRow}
                >
                  <View style={styles.memorialRowAvatarWrap}>
                    <Image source={{ uri: ensureImageUri(pet.avatar) }} style={styles.memorialRowAvatar} />
                    <View style={styles.starsBadge}>
                      <Stars size={10} color="#fff" />
                    </View>
                  </View>
                  <View style={styles.memorialRowInfo}>
                    <View style={styles.memorialRowHead}>
                      <Text style={styles.memorialRowName}>{pet.name}</Text>
                      <View style={styles.eternalBadge}><Text style={styles.eternalBadgeText}>Eternal Paw</Text></View>
                    </View>
                    <View style={styles.memorialRowMeta}>
                      <Text style={styles.memorialRowBreed}>{pet.breed}</Text>
                    </View>
                    <View style={styles.memorialDateRow}>
                      <Moon size={10} color="rgba(251,191,36,0.8)" />
                      <Text style={styles.memorialDateText}>於 {pet.memorialDate} 去往星空</Text>
                    </View>
                  </View>
                </Pressable>
              ))
            )}

            {activeVaultTab === 'ACTIVE' && !isReorderMode && (
              <Pressable
                onPress={() => { setShowPetListModal(false); setShowAddModal(true); }}
                style={[styles.addPetBtn, { borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}
              >
                <View style={[styles.addPetIconWrap, { backgroundColor: dark ? '#334155' : colors.gray[50] }]}>
                  <Plus size={22} color={textSecondary} />
                </View>
                <Text style={[styles.addPetText, { color: textSecondary }]}>添加新成员</Text>
              </Pressable>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Memorial Confirm Modal */}
      <Modal visible={!!confirmMemorialPet} transparent animationType="fade">
        <View style={styles.confirmBackdrop}>
          <View style={[styles.confirmCard, { backgroundColor: dark ? colors.slate[900] : colors.slate[800] }]}>
            <View style={styles.confirmIconWrap}>
              <Stars size={40} color="#f59e0b" />
            </View>
            <Text style={styles.confirmTitle}>去往星空的約定</Text>
            <Text style={styles.confirmDesc}>
              您確定要將 <Text style={styles.confirmPetName}>{confirmMemorialPet?.name}</Text> 的狀態轉為星空紀念模式嗎？
            </Text>
            <View style={styles.confirmWarn}>
              <AlertTriangle size={18} color="#e11d48" />
              <Text style={styles.confirmWarnText}>這是一個永恆的決定：檔案一旦進入星空，將無法再轉回日常模式，所有提醒功能將永久停用。</Text>
            </View>
            <Pressable onPress={handleConfirmMemorial} disabled={isMovingToMemorial} style={styles.confirmPrimaryBtn}>
              {isMovingToMemorial ? <ActivityIndicator color="#020617" /> : <><Stars size={18} color="#020617" /><Text style={styles.confirmPrimaryText}>確認送往星空</Text></>}
            </Pressable>
            <Pressable onPress={() => setConfirmMemorialPet(null)} disabled={isMovingToMemorial}>
              <Text style={styles.confirmCancelText}>再陪它一會兒</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Add Pet Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <Pressable style={styles.modalBackdrop} onPress={() => !isAdding && setShowAddModal(false)} />
        <View style={[styles.addModalContent, { backgroundColor: dark ? colors.slate[900] : '#fff' }]}>
          <View style={styles.addModalHeader}>
            <Text style={[styles.addModalTitle, { color: textPrimary }]}>添加新成員</Text>
            <Pressable onPress={() => setShowAddModal(false)} style={[styles.addModalClose, { backgroundColor: dark ? colors.slate[800] : '#f3f4f6' }]}>
              <X size={18} color={textSecondary} />
            </Pressable>
          </View>
          <View style={styles.addModalAvatarWrap}>
            <Image source={{ uri: ensureImageUri(tempAvatar) }} style={styles.addModalAvatar} />
            <Pressable onPress={() => setTempAvatar(`https://picsum.photos/seed/pet_${Date.now()}/200`)} style={styles.addModalAvatarBtn}>
              <Camera size={14} color="#fff" />
            </Pressable>
          </View>
          <View style={styles.addModalForm}>
            <Text style={[styles.addModalLabel, { color: textSecondary }]}>成員姓名</Text>
            <TextInput
              value={newPet.name}
              onChangeText={(t) => setNewPet((p) => ({ ...p, name: t }))}
              placeholder="如：豆包"
              placeholderTextColor={textSecondary}
              style={[styles.addModalInput, { color: textPrimary, backgroundColor: dark ? 'rgba(30,41,59,0.6)' : colors.gray[50] }]}
            />
            <Text style={[styles.addModalLabel, { color: textSecondary }]}>品種</Text>
            <TextInput
              value={newPet.breed}
              onChangeText={(t) => setNewPet((p) => ({ ...p, breed: t }))}
              placeholder="如：布偶貓"
              placeholderTextColor={textSecondary}
              style={[styles.addModalInput, { color: textPrimary, backgroundColor: dark ? 'rgba(30,41,59,0.6)' : colors.gray[50] }]}
            />
            <View style={styles.addModalRow}>
              <View style={styles.addModalField}>
                <Text style={[styles.addModalLabel, { color: textSecondary }]}>性別</Text>
                <TextInput
                  value={newPet.gender}
                  onChangeText={(t) => setNewPet((p) => ({ ...p, gender: t }))}
                  style={[styles.addModalInput, styles.addModalInputSmall, { color: textPrimary, backgroundColor: dark ? 'rgba(30,41,59,0.6)' : colors.gray[50] }]}
                />
              </View>
              <View style={styles.addModalField}>
                <Text style={[styles.addModalLabel, { color: textSecondary }]}>生日</Text>
                <TextInput
                  value={newPet.birthday}
                  onChangeText={(t) => setNewPet((p) => ({ ...p, birthday: t }))}
                  style={[styles.addModalInput, styles.addModalInputSmall, { color: textPrimary, backgroundColor: dark ? 'rgba(30,41,59,0.6)' : colors.gray[50] }]}
                />
              </View>
            </View>
          </View>
          <Pressable
            onPress={handleAddPet}
            disabled={isAdding || !newPet.name || !newPet.breed}
            style={[styles.addModalSubmit, (!newPet.name || !newPet.breed || isAdding) && styles.addModalSubmitDisabled]}
          >
            {isAdding ? <ActivityIndicator color="#fff" /> : <><Send size={18} color="#fff" /><Text style={styles.addModalSubmitText}>確認添加</Text></>}
          </Pressable>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {},
  hero: {},
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, overflow: 'hidden' },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 },
  avatarWrap: { position: 'relative' },
  avatar: { width: 64, height: 64, borderRadius: 22, borderWidth: 4, borderColor: '#fff' },
  cameraBtn: { position: 'absolute', bottom: -2, right: -2, padding: 6, borderRadius: 12, ...shadowGlass.light },
  profileInfo: { flex: 1, minWidth: 0 },
  userName: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  badgesRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, borderWidth: 1 },
  badgeText: { fontSize: 9, fontWeight: '800' },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  levelText: { fontSize: 10, fontWeight: '800' },
  vipBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f59e0b', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  vipBadgeText: { fontSize: 8, fontWeight: '800', color: '#fff', textTransform: 'uppercase' },
  headerActions: { flexDirection: 'row', gap: 8, flexShrink: 0 },
  iconBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  membershipCard: {
    marginBottom: 20,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
    backgroundColor: '#0f172a',
  },
  membershipInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18 },
  membershipLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 },
  membershipIconWrap: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#f59e0b', alignItems: 'center', justifyContent: 'center' },
  membershipTitle: { fontSize: 14, fontWeight: '800', color: '#fef3c7' },
  membershipSub: { fontSize: 10, fontWeight: '700', color: 'rgba(245,158,11,0.8)', marginTop: 2 },
  membershipBtn: { backgroundColor: '#f59e0b', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  membershipBtnText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, borderRadius: 20, padding: 14, alignItems: 'center', borderWidth: 1 },
  statLabel: { fontSize: 8, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 },
  statValue: { fontSize: 17, fontWeight: '800' },
  section: {},
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontWeight: '800', letterSpacing: -0.5 },
  sectionLink: { flexDirection: 'row', alignItems: 'center' },
  linkText: { fontSize: 10, fontWeight: '800', color: colors.orange[500], textTransform: 'uppercase', marginRight: 2 },
  petsScroll: { flexDirection: 'row', gap: 12, paddingBottom: 4 },
  petCard: { width: 108, padding: 14, borderRadius: 24, alignItems: 'center', borderWidth: 1 },
  petAvatar: { width: 60, height: 60, borderRadius: 16, marginBottom: 8 },
  petName: { fontSize: 14, fontWeight: '800', maxWidth: 76 },
  petBreed: { fontSize: 9, fontWeight: '700', maxWidth: 76 },
  historyRow: { flexDirection: 'row', gap: 10 },
  historyBtn: { flex: 1, minWidth: 0, paddingVertical: 14, paddingHorizontal: 8, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' },
  historyLabel: { fontSize: 10, fontWeight: '800', marginTop: 4 },
  albumSectionHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  albumSub: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },
  albumCard: { borderRadius: 24, overflow: 'hidden', aspectRatio: 16 / 9, ...shadowGlass.light },
  albumPhotoBg: { ...StyleSheet.absoluteFillObject },
  albumOverlay: { position: 'absolute', left: H_PAD, right: 56, bottom: 20 },
  albumPreviews: { flexDirection: 'row', marginBottom: 6 },
  albumThumb: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: '#fff', marginLeft: -12 },
  albumPlus: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 2, borderColor: '#fff', marginLeft: -12, alignItems: 'center', justifyContent: 'center' },
  albumPlusText: { fontSize: 9, fontWeight: '800', color: '#fff' },
  albumTitle: { fontSize: 17, fontWeight: '800', color: '#fff' },
  albumDesc: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', marginTop: 2 },
  albumIconWrap: { position: 'absolute', right: 16, bottom: 16, width: 44, height: 44, backgroundColor: '#fff', borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  menuCard: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 16 },
  menuItemBorder: { borderBottomWidth: 1 },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  menuIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { fontSize: 14, fontWeight: '700' },
  menuItemRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badgePill: { backgroundColor: '#e11d48', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999 },
  badgePillText: { fontSize: 9, fontWeight: '800', color: '#fff' },
  logoutBtn: { paddingVertical: 16, borderRadius: 20, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  logoutText: { fontSize: 12, fontWeight: '800', color: '#e11d48' },
  footer: { textAlign: 'center', fontSize: 9, fontWeight: '700', letterSpacing: 2, marginBottom: 8 },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  petModal: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 48, borderTopRightRadius: 48, maxHeight: '85%', paddingBottom: 40 },
  petModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.xl },
  petModalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  vaultIconWrap: { width: 40, height: 40, backgroundColor: colors.orange[500], borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  petModalTitle: { fontSize: 20, fontWeight: '800' },
  petModalSub: { fontSize: 10, fontWeight: '800', color: colors.orange[500], textTransform: 'uppercase' },
  petModalActions: { flexDirection: 'row', gap: 8 },
  modalIconBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'transparent' },
  tabs: { flexDirection: 'row', marginHorizontal: spacing.md, padding: 4, borderRadius: 16 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 8, borderRadius: 12 },
  tabActive: { backgroundColor: '#fff', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  tabActiveDark: { backgroundColor: '#334155' },
  tabText: { fontSize: 10, fontWeight: '800' },
  tabMemorial: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)' },
  petModalList: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.lg, maxHeight: 400 },
  petRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 32, marginBottom: 12, borderWidth: 1 },
  petRowSelected: { transform: [{ scale: 1.02 }] },
  petRowAvatar: { width: 80, height: 80, borderRadius: 16, marginRight: 16 },
  petRowInfo: { flex: 1 },
  petRowHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  petRowName: { fontSize: 18, fontWeight: '800' },
  homeTag: { backgroundColor: '#6366f1', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  homeTagText: { fontSize: 8, fontWeight: '800', color: '#fff', textTransform: 'uppercase' },
  reorderActions: { flexDirection: 'row', gap: 8 },
  reorderBtn: { width: 36, height: 36, backgroundColor: '#fff', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  reorderBtnDisabled: { opacity: 0.3 },
  petRowMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  breedTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  breedTagText: { fontSize: 10, fontWeight: '800' },
  petRowGender: { fontSize: 10, fontWeight: '700' },
  petRowHobby: { fontSize: 10, fontWeight: '700' },
  emptyMemorial: { paddingVertical: 80, alignItems: 'center', gap: 16 },
  emptyMemorialText: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  memorialRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 32, marginBottom: 12, backgroundColor: '#020617', borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)' },
  memorialRowAvatarWrap: { position: 'relative', marginRight: 16 },
  memorialRowAvatar: { width: 80, height: 80, borderRadius: 16, borderWidth: 2, borderColor: 'rgba(245,158,11,0.4)' },
  starsBadge: { position: 'absolute', top: -4, left: -4, backgroundColor: '#f59e0b', padding: 4, borderRadius: 8 },
  memorialRowInfo: { flex: 1 },
  memorialRowHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  memorialRowName: { fontSize: 18, fontWeight: '800', color: '#fef3c7' },
  eternalBadge: { backgroundColor: 'rgba(245,158,11,0.1)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  eternalBadgeText: { fontSize: 7, fontWeight: '800', color: '#f59e0b', textTransform: 'uppercase' },
  memorialRowMeta: { marginBottom: 4 },
  memorialRowBreed: { fontSize: 10, fontWeight: '800', color: 'rgba(254,243,199,0.6)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  memorialDateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  memorialDateText: { fontSize: 9, fontWeight: '800', color: 'rgba(251,191,36,0.8)', fontStyle: 'italic', textTransform: 'uppercase' },
  addPetBtn: { borderWidth: 2, borderStyle: 'dashed', borderRadius: 32, padding: 32, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  addPetIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  addPetText: { fontSize: 12, fontWeight: '800' },
  confirmBackdrop: { flex: 1, backgroundColor: 'rgba(2,6,23,0.8)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  confirmCard: { width: '100%', maxWidth: 360, borderRadius: 48, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)' },
  confirmIconWrap: { width: 80, height: 80, borderRadius: 24, backgroundColor: 'rgba(245,158,11,0.1)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  confirmTitle: { fontSize: 20, fontWeight: '800', color: '#fef3c7', marginBottom: 8 },
  confirmDesc: { fontSize: 12, color: 'rgba(254,243,199,0.6)', textAlign: 'center', marginBottom: 16 },
  confirmPetName: { color: '#f59e0b', fontWeight: '800' },
  confirmWarn: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: 'rgba(225,29,72,0.05)', borderWidth: 1, borderColor: 'rgba(225,29,72,0.2)', padding: 16, borderRadius: 16, marginBottom: 24 },
  confirmWarnText: { flex: 1, fontSize: 10, fontWeight: '700', color: 'rgba(254,226,226,0.7)' },
  confirmPrimaryBtn: { width: '100%', paddingVertical: 16, backgroundColor: '#f59e0b', borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 },
  confirmPrimaryText: { fontSize: 14, fontWeight: '800', color: '#020617' },
  confirmCancelText: { fontSize: 12, fontWeight: '800', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' },
  addModalContent: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 32, paddingBottom: 48 },
  addModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  addModalTitle: { fontSize: 20, fontWeight: '800' },
  addModalClose: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  addModalAvatarWrap: { alignSelf: 'center', position: 'relative', marginBottom: 24 },
  addModalAvatar: { width: 80, height: 80, borderRadius: 28, borderWidth: 2, borderColor: '#fff' },
  addModalAvatarBtn: { position: 'absolute', bottom: -4, right: -4, width: 28, height: 28, backgroundColor: colors.orange[500], borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  addModalForm: { marginBottom: 24 },
  addModalLabel: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', marginBottom: 4, marginTop: 12 },
  addModalInput: { borderRadius: 20, paddingHorizontal: 20, paddingVertical: 12, fontSize: 14, fontWeight: '700' },
  addModalInputSmall: { flex: 1 },
  addModalRow: { flexDirection: 'row', gap: 12 },
  addModalField: { flex: 1 },
  addModalSubmit: { backgroundColor: colors.orange[500], height: 56, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  addModalSubmitDisabled: { opacity: 0.5 },
  addModalSubmitText: { fontSize: 14, fontWeight: '800', color: '#fff' },
});
