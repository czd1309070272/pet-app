import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Image,
} from 'react-native';
import {
  DollarSign,
  Utensils,
  HeartPulse,
  Sparkles,
  ShoppingBag,
  Receipt,
  Zap,
  Stars,
} from 'lucide-react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../navigation/types';
import type { Expense, PetProfile } from '../types';
import * as mockApi from '../api/mock';
import * as frontApi from '../front_api';
import { ViewHeader } from '../components/shared/CommonUI';
import { useApp } from '../context/AppContext';
import { colors, borderRadius, spacing } from '../theme/tokens';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Wallet'>;

const CATEGORIES: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  FOOD: { label: '飲食', icon: <Utensils size={18} color="#fff" />, color: colors.orange[500] },
  HEALTH: { label: '醫療', icon: <HeartPulse size={18} color="#fff" />, color: '#f43f5e' },
  PLAY: { label: '娛樂', icon: <ShoppingBag size={18} color="#fff" />, color: '#3b82f6' },
  BEAUTY: { label: '美容', icon: <Sparkles size={18} color="#fff" />, color: '#6366f1' },
};

export default function WalletScreen({ navigation }: { navigation: Nav }) {
  const { isDarkMode } = useApp();
  const dark = isDarkMode;
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [pets, setPets] = useState<PetProfile[]>([]);
  const [filterPetName, setFilterPetName] = useState<string>('ALL');
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    (async () => {
      const [ex, petList] = await Promise.all([
        mockApi.fetchExpenses(),
        frontApi.fetchPets(),
      ]);
      setExpenses(ex);
      setPets(petList);
    })();
  }, []);

  const filteredExpenses =
    filterPetName === 'ALL' ? expenses : expenses.filter((e) => e.petName === filterPetName);
  const total = filteredExpenses.reduce((acc, cur) => acc + cur.amount, 0);

  const handleScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      const firstActive = pets.find((p) => !p.isMemorial);
      const newExp: Expense = {
        id: 'x_' + Date.now(),
        amount: Math.floor(Math.random() * 200) + 50,
        category: 'FOOD',
        date: new Date().toISOString().split('T')[0],
        description: 'AI 自動識別: 皇家貓糧 2kg',
        petName: filterPetName === 'ALL' ? (firstActive?.name ?? '寶貝') : filterPetName,
      };
      mockApi.addExpenseLocal(newExp);
      setExpenses((prev) => [newExp, ...prev]);
      setIsScanning(false);
    }, 2000);
  };

  const textColor = dark ? '#f8fafc' : colors.gray[800];
  const subColor = dark ? colors.gray[400] : colors.gray[500];
  const glassBorder = dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.45)';

  return (
    <View style={[styles.container, { backgroundColor: dark ? colors.slate[950] : '#fff9f5' }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ViewHeader title="寵物錢包" onBack={() => navigation.goBack()} />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          <Pressable
            onPress={() => setFilterPetName('ALL')}
            style={[
              styles.filterChip,
              filterPetName === 'ALL' && styles.filterChipActive,
              {
                backgroundColor: filterPetName === 'ALL' ? colors.orange[500] : dark ? 'rgba(30,41,59,0.85)' : 'rgba(255,255,255,0.7)',
                borderColor: glassBorder,
              },
            ]}
          >
            <Text style={[styles.filterChipText, { color: filterPetName === 'ALL' ? '#fff' : subColor }]}>全部</Text>
          </Pressable>
          {pets.map((pet) => (
            <Pressable
              key={pet.id}
              onPress={() => setFilterPetName(pet.name)}
              style={[
                styles.filterChip,
                filterPetName === pet.name && (pet.isMemorial ? styles.filterChipMemorial : styles.filterChipActive),
                {
                  backgroundColor:
                    filterPetName === pet.name
                      ? pet.isMemorial
                        ? colors.slate[800]
                        : '#10b981'
                      : dark ? 'rgba(30,41,59,0.85)' : 'rgba(255,255,255,0.7)',
                  borderColor: filterPetName === pet.name && pet.isMemorial ? 'rgba(245,158,11,0.3)' : glassBorder,
                },
              ]}
            >
              {pet.isMemorial && <Stars size={10} color="#f59e0b" />}
              <Text
                style={[
                  styles.filterChipText,
                  { color: filterPetName === pet.name ? (pet.isMemorial ? '#fbbf24' : '#fff') : subColor },
                ]}
              >
                {pet.name}
                {pet.isMemorial ? '·星空' : ''}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={[styles.balanceCard, { backgroundColor: dark ? colors.slate[900] : '#0f172a' }]}>
          <View style={styles.balanceDecor}>
            <DollarSign size={180} color="rgba(255,255,255,0.1)" />
          </View>
          <Text style={styles.balanceLabel}>
            {filterPetName === 'ALL' ? '總累計支出' : `${filterPetName} 的支出`}
          </Text>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceAmount}>HK$ {total}</Text>
            <Text style={styles.balanceVs}>+12% vs 上月</Text>
          </View>
          <Pressable
            onPress={handleScan}
            style={styles.scanBtn}
          >
            <Receipt size={16} color="#fff" />
            <Text style={styles.scanBtnText}>AI 掃描記賬</Text>
          </Pressable>
        </View>

        <Text style={[styles.sectionTitle, { color: subColor }]}>收支明細</Text>
        {filteredExpenses.length === 0 ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: subColor }]}>尚無支出記錄</Text>
          </View>
        ) : (
          filteredExpenses.map((exp) => {
            const pet = pets.find((p) => p.name === exp.petName);
            const cat = CATEGORIES[exp.category] ?? CATEGORIES.FOOD;
            return (
              <View
                key={exp.id}
                style={[
                  styles.expCard,
                  {
                    backgroundColor: dark ? 'rgba(30,41,59,0.85)' : 'rgba(255,255,255,0.7)',
                    borderColor: glassBorder,
                    opacity: pet?.isMemorial ? 0.7 : 1,
                  },
                ]}
              >
                <View style={[styles.expIconWrap, { backgroundColor: cat.color }]}>
                  {cat.icon}
                </View>
                <View style={styles.expBody}>
                  <Text style={[styles.expDesc, { color: textColor }]} numberOfLines={1}>{exp.description}</Text>
                  <View style={styles.expMeta}>
                    <View style={[styles.expPetTag, pet?.isMemorial && { backgroundColor: colors.slate[700] }]}>
                      <Text style={[styles.expPetTagText, pet?.isMemorial && { color: '#fbbf24' }]}>{exp.petName}</Text>
                    </View>
                    <Text style={[styles.expMetaText, { color: subColor }]}>
                      {exp.date} · {cat.label}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.expAmount, { color: textColor }]}>-${exp.amount}</Text>
              </View>
            );
          })
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {isScanning && (
        <View style={styles.scanOverlay}>
          <View style={styles.scanFrame}>
            <Image
              source={{ uri: 'https://picsum.photos/seed/receipt/400/600' }}
              style={styles.scanImage}
              resizeMode="cover"
            />
          </View>
          <Zap size={32} color={colors.orange[500]} />
          <Text style={styles.scanOverlayText}>AI 正在深度解析收據...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.xl, paddingBottom: spacing.xl * 2 },
  filterRow: { marginBottom: spacing.xl },
  filterChip: {
    marginRight: spacing.sm,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterChipActive: {},
  filterChipMemorial: {},
  filterChipText: { fontSize: 12, fontWeight: '800' },
  balanceCard: {
    borderRadius: borderRadius['4xl'],
    padding: spacing.xl * 1.5,
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  balanceDecor: { position: 'absolute', top: -40, right: -40 },
  balanceLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 2,
    marginBottom: 8,
  },
  balanceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  balanceAmount: { fontSize: 36, fontWeight: '800', color: '#fff', letterSpacing: -1 },
  balanceVs: { fontSize: 12, fontWeight: '700', color: '#34d399' },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: spacing.xl,
    paddingVertical: 14,
    borderRadius: borderRadius['2xl'],
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  scanBtnText: { fontSize: 11, fontWeight: '800', color: '#fff' },
  sectionTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 1, marginBottom: spacing.lg, paddingHorizontal: 4 },
  empty: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { fontSize: 14, fontWeight: '800' },
  expCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: 30,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  expIconWrap: {
    width: 48,
    height: 48,
    borderRadius: borderRadius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  expBody: { flex: 1, minWidth: 0 },
  expDesc: { fontSize: 14, fontWeight: '800' },
  expMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  expPetTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  expPetTagText: { fontSize: 9, fontWeight: '800', color: '#059669' },
  expMetaText: { fontSize: 10, fontWeight: '700' },
  expAmount: { fontSize: 18, fontWeight: '800' },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xl,
  },
  scanFrame: {
    width: 256,
    height: 320,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.orange[500],
    overflow: 'hidden',
  },
  scanImage: { width: '100%', height: '100%', opacity: 0.4 },
  scanOverlayText: { color: '#fff', fontWeight: '800', letterSpacing: 2 },
});
