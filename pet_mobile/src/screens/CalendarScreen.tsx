import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Heart, Pill, Stethoscope } from 'lucide-react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../navigation/types';
import type { DiaryEntry, Medication, Appointment } from '../types';
import * as mockApi from '../api/mock';
import * as frontApi from '../front_api';
import { useApp } from '../context/AppContext';
import { colors, borderRadius, spacing, shadowGlass } from '../theme/tokens';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Calendar'>;

const WEEK_DAYS = ['一', '二', '三', '四', '五', '六', '日'];

/** 与主页一致的毛玻璃卡片：BlurView + 暖色描边 + 阴影 */
function GlassCard({
  children,
  style,
  innerStyle,
  intensity = 64,
  dark,
}: {
  children: React.ReactNode;
  style?: object;
  innerStyle?: object;
  intensity?: number;
  dark: boolean;
}) {
  const shadow = dark ? shadowGlass.dark : shadowGlass.light;
  const tintColor = dark ? colors.glassCard.tintDark : colors.glassCard.tintLight;
  const borderColor = dark ? colors.glassCard.borderDark : colors.glassCard.borderLight;
  return (
    <View style={[glassCardStyles.shadowWrap, shadow, style, { overflow: 'visible' }]}>
      <View style={[glassCardStyles.outer]}>
        <BlurView
          intensity={intensity}
          tint={dark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={[glassCardStyles.tintOverlay, { backgroundColor: tintColor }]} />
        <View style={[glassCardStyles.borderWrap, glassCardStyles.borderFill, { borderColor }, innerStyle]}>
          {children}
        </View>
      </View>
    </View>
  );
}

const glassCardStyles = StyleSheet.create({
  shadowWrap: { borderRadius: borderRadius['3xl'] },
  outer: { flex: 1, borderRadius: borderRadius['3xl'], overflow: 'hidden' },
  tintOverlay: { ...StyleSheet.absoluteFillObject, borderRadius: borderRadius['3xl'] },
  borderWrap: { borderWidth: 1, borderRadius: borderRadius['3xl'], overflow: 'hidden' },
  borderFill: { ...StyleSheet.absoluteFillObject },
});

export default function CalendarScreen({
  navigation,
  route,
}: {
  navigation: Nav;
  route: { params?: { onDateSelect?: (date: string) => void } };
}) {
  const { isDarkMode } = useApp();
  const dark = isDarkMode;
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const horizontalPadding = spacing.lg + Math.max(insets.left, insets.right);
  const contentWidth = windowWidth - horizontalPadding * 2;
  const dayCellSize = Math.floor((contentWidth - spacing.xl * 2) / 7);

  useEffect(() => {
    (async () => {
      const [e, m, a] = await Promise.all([
        mockApi.fetchDiaryEntries(),
        frontApi.fetchMedications(),
        mockApi.fetchAppointments(),
      ]);
      setEntries(e);
      setMedications(m);
      setAppointments(a);
    })();
  }, []);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayRaw = new Date(year, month, 1).getDay();
  const firstDay = (firstDayRaw + 6) % 7;

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const hasEntry = entries.some((e) => e.date === dateStr);
    const hasMed = medications.some((m) => m.date === dateStr);
    const hasAppointment = appointments.some((a) => a.date === dateStr);
    const isClickable = hasEntry || hasMed || hasAppointment;
    return { d, dateStr, hasEntry, hasMed, hasAppointment, isClickable };
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const onDateClick = route.params?.onDateSelect;

  const handleDatePress = (item: { dateStr: string; hasEntry: boolean; hasMed: boolean; hasAppointment: boolean }) => {
    if (item.hasEntry) {
      navigation.navigate('Diary', { filterDate: item.dateStr });
    }
    onDateClick?.(item.dateStr);
  };

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const textColor = dark ? '#f8fafc' : colors.gray[800];
  const subColor = dark ? colors.gray[400] : colors.gray[500];
  const glassBg = dark ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.7)';
  const glassBorder = dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.6)';

  const scrollContentPadding = {
    paddingTop: spacing.xl + insets.top,
    paddingBottom: spacing.xl * 2 + insets.bottom,
    paddingHorizontal: horizontalPadding,
  };

  return (
    <View style={[styles.container, { backgroundColor: dark ? colors.glassBg.dark : colors.glassBg.light }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, scrollContentPadding]}
        showsVerticalScrollIndicator={false}
      >
        {/* 顶部：返回 + 标题区（与主页气质一致） */}
        <View style={styles.topRow}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [
              styles.backBtn,
              { backgroundColor: glassBg, borderColor: glassBorder },
              pressed && { opacity: 0.9, transform: [{ scale: 0.96 }] },
            ]}
          >
            <ChevronLeft size={22} color={dark ? colors.gray[300] : colors.gray[600]} />
          </Pressable>
          <View style={styles.titleBlock}>
            <View style={styles.titleRow}>
              <CalendarIcon size={20} color={colors.orange[500]} style={styles.titleIcon} />
              <Text style={[styles.title, { color: textColor }]}>時光日曆</Text>
            </View>
            <Text style={[styles.subtitle, { color: subColor }]}>和毛孩的每一天 🐾</Text>
          </View>
        </View>

        {/* 日历主卡：毛玻璃 + 阴影，与主页成长日历一致 */}
        <View style={styles.calendarCardWrap}>
          <GlassCard dark={dark} style={styles.calendarCardGlass} intensity={68}>
            <View style={styles.calendarCardInner}>
              <View style={styles.calendarHead}>
                <Text style={[styles.calendarTitle, { color: textColor }]}>
                  {year}年 {month + 1}月
                </Text>
                <View style={styles.monthNav}>
                  <Pressable
                    onPress={prevMonth}
                    style={({ pressed }) => [
                      styles.monthBtn,
                      { backgroundColor: dark ? 'rgba(255,255,255,0.08)' : colors.orange[50] },
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <ChevronLeft size={18} color={colors.orange[600]} />
                  </Pressable>
                  <Pressable
                    onPress={nextMonth}
                    style={({ pressed }) => [
                      styles.monthBtn,
                      { backgroundColor: dark ? 'rgba(255,255,255,0.08)' : colors.orange[50] },
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <ChevronRight size={18} color={colors.orange[600]} />
                  </Pressable>
                </View>
              </View>

              <View style={styles.weekRow}>
                {WEEK_DAYS.map((w) => (
                  <Text key={w} style={[styles.weekDay, { color: subColor }]}>{w}</Text>
                ))}
              </View>

              <View style={styles.daysGrid}>
                {Array(firstDay)
                  .fill(null)
                  .map((_, i) => (
                    <View key={`empty-${i}`} style={[styles.dayCell, { width: dayCellSize }]} />
                  ))}
                {days.map((item) => {
                  const isToday = item.dateStr === todayStr;
                  return (
                    <Pressable
                      key={item.dateStr}
                      onPress={() => item.isClickable && handleDatePress(item)}
                      disabled={!item.isClickable}
                      style={[styles.dayCell, { width: dayCellSize }]}
                    >
                      <View
                        style={[
                          styles.dayNumWrap,
                          isToday && styles.dayNumToday,
                          item.isClickable &&
                            !isToday && {
                              backgroundColor: dark ? 'rgba(255,255,255,0.12)' : 'rgba(255,242,230,0.8)',
                              borderColor: 'rgba(249, 115, 22, 0.35)',
                            },
                          !item.isClickable && { backgroundColor: 'transparent', borderColor: 'transparent' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.dayNum,
                            { color: isToday ? colors.orange[600] : item.isClickable ? textColor : subColor },
                          ]}
                        >
                          {item.d}
                        </Text>
                      </View>
                      <View style={styles.dotsRow}>
                        {item.hasEntry && <View style={[styles.dot, styles.dotOrange]} />}
                        {item.hasMed && <View style={[styles.dot, styles.dotIndigo]} />}
                        {item.hasAppointment && <View style={[styles.dot, styles.dotRose]} />}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </GlassCard>
        </View>

        {/* 图例：小药丸式标签，可爱统一 */}
        <View style={styles.legendRow}>
          <View style={[styles.legendItem, dark ? styles.legendItemDark : styles.legendItemLight]}>
            <Heart size={12} color={colors.orange[500]} fill={colors.orange[500]} />
            <Text style={[styles.legendText, { color: subColor }]}>日記回憶</Text>
          </View>
          <View style={[styles.legendItem, dark ? styles.legendItemDark : styles.legendItemLight]}>
            <Pill size={12} color="#6366f1" />
            <Text style={[styles.legendText, { color: subColor }]}>用藥清單</Text>
          </View>
          <View style={[styles.legendItem, dark ? styles.legendItemDark : styles.legendItemLight]}>
            <Stethoscope size={12} color="#f43f5e" />
            <Text style={[styles.legendText, { color: subColor }]}>門診預約</Text>
          </View>
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xl * 2 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  titleIcon: { marginRight: 8 },
  title: { fontSize: 22, fontWeight: '800' },
  subtitle: { fontSize: 12, fontWeight: '600', marginTop: 2, letterSpacing: 0.5 },
  calendarCardWrap: {
    marginBottom: spacing.xl,
    ...(Platform.OS === 'ios'
      ? {
          shadowColor: '#c47b4a',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.28,
          shadowRadius: 28,
        }
      : { elevation: 14 }),
  },
  calendarCardGlass: { minHeight: 420 },
  calendarCardInner: {
    padding: spacing.xl,
    alignSelf: 'stretch',
  },
  calendarHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: 4,
  },
  calendarTitle: { fontSize: 18, fontWeight: '800' },
  monthNav: { flexDirection: 'row', gap: 10 },
  monthBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  dayNumWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  dayNumToday: {
    backgroundColor: colors.orange[500],
    borderColor: colors.orange[600],
  },
  dayNum: { fontSize: 14, fontWeight: '700' },
  dotsRow: { flexDirection: 'row', gap: 2, marginTop: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotOrange: { backgroundColor: colors.orange[500] },
  dotIndigo: { backgroundColor: '#6366f1' },
  dotRose: { backgroundColor: '#f43f5e' },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  legendItemLight: {
    backgroundColor: colors.orange[50],
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.2)',
  },
  legendItemDark: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 235, 215, 0.15)',
  },
  legendText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
});
