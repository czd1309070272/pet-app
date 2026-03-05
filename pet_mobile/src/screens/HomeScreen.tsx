import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Image,
  Platform,
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import {
  Scan,
  Heart,
  ChevronRight,
  Activity,
  Sparkles,
  Pill,
  Wallet,
  Clock,
  MessageSquareText,
  Crown,
  Stars,
  LayoutGrid,
  Calendar as CalendarIcon,
} from 'lucide-react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../navigation/types';
import type { PetProfile, DiaryEntry, Medication, Article, UserInfo, AlbumPhoto } from '../types';
import * as frontApi from '../front_api';
import * as mockApi from '../api/mock';
import { colors, borderRadius, spacing, shadowGlass } from '../theme/tokens';
import { ensureImageUri } from '../utils/imageUri';
import { ScalePressable } from '../animations/ScalePressable';
import { useTabBarVisibility } from '../context/TabBarVisibilityContext';
import { useApp } from '../context/AppContext';
import { navigateToAddPet } from '../navigation/rootNavigation';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Home'>;

/** 悬浮毛玻璃卡片：BlurView + 描边 + 阴影 */
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

/** 将句子按每6个字切片 */
function sliceTextByChars(text: string, chunkSize = 6): string[] {
  if (!text || text.length === 0) return [text || ''];
  const chars = Array.from(text);
  const chunks: string[] = [];
  for (let i = 0; i < chars.length; i += chunkSize) {
    chunks.push(chars.slice(i, i + chunkSize).join(''));
  }
  return chunks.length > 0 ? chunks : [text];
}

const glassCardStyles = StyleSheet.create({
  shadowWrap: {
    borderRadius: borderRadius['3xl'],
  },
  outer: {
    flex: 1,
    borderRadius: borderRadius['3xl'],
    overflow: 'hidden',
  },
  tintOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: borderRadius['3xl'],
  },
  borderWrap: {
    borderWidth: 1,
    borderRadius: borderRadius['3xl'],
    overflow: 'hidden',
  },
  borderFill: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default function HomeScreen({ navigation }: { navigation: Nav }) {
  const { isDarkMode } = useApp();
  const dark = isDarkMode;
  const { reportScroll } = useTabBarVisibility();
  const [pets, setPets] = useState<PetProfile[]>([]);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [articleIdx, setArticleIdx] = useState(0);
  const [medIndex, setMedIndex] = useState(0);
  const [albumPreview, setAlbumPreview] = useState<AlbumPhoto | null>(null);

  useEffect(() => {
    (async () => {
      const [p, e, m, a, u, album] = await Promise.all([
        frontApi.fetchPets(),
        frontApi.fetchDiaryEntries(),
        frontApi.fetchMedications(),
        mockApi.fetchArticles(),
        frontApi.getCurrentUser(),
        mockApi.fetchAlbumPhotos(),
      ]);
      setPets(p);
      setEntries(e);
      setMedications(m);
      setArticles(a);
      setUser(u);
      if (album.length > 0) setAlbumPreview(album[0]);
    })();
  }, []);

  useEffect(() => {
    if (articles.length <= 1) return;
    const t = setInterval(() => setArticleIdx((i) => (i + 1) % articles.length), 3000);
    return () => clearInterval(t);
  }, [articles.length]);

  const activeList = pets.filter((p) => !p.isMemorial);
  const hasPets = pets.length > 0;
  const activePet = hasPets ? (activeList[0] ?? pets[0])! : null;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayMeds = medications.filter(
    (m) => m.date === todayStr && !m.isTaken && pets.some((p) => p.name === m.petName && !p.isMemorial)
  );
  const warmPhrases = ['今日無需用藥，帶毛孩去踏青吧 🐾', '寶貝今天表現優異，值得獎勵肉條 🍖'];
  const displaySources = todayMeds.length > 0
    ? todayMeds.map((m) => m.name)
    : warmPhrases;
  /** 每6字一组的切片列表（句子顺序，每句内按6字切） */
  const allChunks = useMemo(() => {
    const list: string[] = [];
    displaySources.forEach((s) => {
      list.push(...sliceTextByChars(s, 6));
    });
    return list.length > 0 ? list : [''];
  }, [displaySources]);
  const totalChunks = allChunks.length;

  const scrollAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(scrollAnim, {
      toValue: medIndex,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [medIndex, scrollAnim]);

  useEffect(() => {
    if (totalChunks <= 1) return;
    const t = setInterval(() => setMedIndex((i) => (i + 1) % totalChunks), 2200);
    return () => clearInterval(t);
  }, [totalChunks]);

  const textColor = dark ? '#f8fafc' : colors.gray[800];
  const subColor = dark ? colors.gray[400] : colors.gray[500];
  const petIconSource = useMemo(() => {
    const b = (activePet?.breed ?? '').toLowerCase();
    const isCat = /貓|猫|cat/.test(b);
    return isCat ? require('../../assets/icon/cat.png') : require('../../assets/icon/dog.png');
  }, [activePet?.breed]);
  const glassBg = dark ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.7)';
  const glassBorder = dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.6)';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: dark ? colors.slate[950] : colors.glassBg.light }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      onScroll={reportScroll}
      scrollEventThrottle={16}
    >
      <View style={styles.headerPlaceholder} />

      {/* Pet Card：有寵物顯示寶貝卡片，無寵物顯示「去添加寵物」提示 */}
      <View style={styles.petCardShadowWrap}>
        {hasPets && activePet ? (
          <ScalePressable
            onPress={() => navigation.navigate('PetProfile', { pet: activePet })}
            style={[
              styles.petCard,
              activePet.isMemorial
                ? { backgroundColor: '#1e293b' }
                : { backgroundColor: colors.orange[500] },
            ]}
          >
            <View style={styles.petCardDecor}>
              <Activity size={120} color="rgba(255,255,255,0.12)" />
            </View>
            <View style={styles.petCardTopRight}>
              {activePet.isMemorial && (
                <View style={styles.badge}>
                  <Stars size={12} color="#fbbf24" fill="#fbbf24" />
                  <Text style={styles.badgeText}>Eternal Star</Text>
                </View>
              )}
              {!activePet.isMemorial && user?.isVIP && (
                <View style={styles.vipBadge}>
                  <Crown size={12} color="#fef3c7" fill="#fef3c7" />
                  <Text style={styles.vipBadgeText}>{user.vipLevel} OWNER</Text>
                </View>
              )}
              <Image
                source={petIconSource}
                style={styles.petCardIcon}
                resizeMode="contain"
              />
            </View>
            <View style={styles.petRow}>
              <View>
                <Image
                  source={{ uri: ensureImageUri(activePet.avatar, 'https://picsum.photos/seed/cat1/200') }}
                  style={[styles.petAvatar, activePet.isMemorial && styles.petAvatarMemorial]}
                />
              </View>
              <View style={styles.petInfo}>
                <Text style={styles.petName}>
                  {activePet.name}{activePet.isMemorial ? '·星空' : ''}
                </Text>
                <View style={styles.petTags}>
                  <View style={styles.tag}><Text style={styles.tagText}>{activePet.breed}</Text></View>
                  <View style={styles.tag}><Text style={styles.tagText}>{activePet.isMemorial ? '永遠的守護' : '健康 98'}</Text></View>
                </View>
              </View>
            </View>
            <View style={styles.petFooter}>
              <View>
                <Text style={styles.petFooterLabel}>
                  {activePet.isMemorial ? '來自星空的守護' : `今日待辦: ${todayMeds.length} 項`}
                </Text>
                <View style={styles.petFooterValueRow}>
                  <Text style={styles.petFooterValue}>
                    {activePet.isMemorial ? '它在那邊也很快樂喔 ✨' : '一切正常，繼續保持喔！'}
                  </Text>
                  {!activePet.isMemorial && <Sparkles size={20} color="#fef08a" style={styles.petFooterSparkles} />}
                </View>
              </View>
              <View style={styles.chevronWrap}>
                <ChevronRight size={24} color="#fff" />
              </View>
            </View>
          </ScalePressable>
        ) : (
          <Pressable
            onPress={navigateToAddPet}
            style={[styles.petCard, styles.petCardEmpty, { backgroundColor: dark ? 'rgba(51, 65, 85, 0.9)' : 'rgba(251, 146, 60, 0.25)' }]}
          >
            <View style={styles.petCardDecor}>
              <Activity size={100} color="rgba(255,255,255,0.08)" />
            </View>
            <Image
              source={require('../../assets/icon/card_icon.png')}
              style={styles.petCardIconEmpty}
              resizeMode="contain"
            />
            <View style={styles.petEmptyContent}>
              <Heart size={40} color={dark ? 'rgba(255,255,255,0.4)' : 'rgba(251, 146, 60, 0.6)'} style={{ marginBottom: 12 }} />
              <Text style={[styles.petEmptyTitle, { color: dark ? '#e2e8f0' : colors.gray[800] }]}>還沒有添加寵物</Text>
              <Text style={[styles.petEmptyHint, { color: dark ? colors.gray[400] : colors.gray[500] }]}>快去添加你的萌寵，記錄健康與日常吧～</Text>
              <View style={[styles.petEmptyBtn, { backgroundColor: colors.orange[500] }]}>
                <Text style={styles.petEmptyBtnText}>去添加寵物</Text>
                <ChevronRight size={18} color="#fff" />
              </View>
            </View>
          </Pressable>
        )}
      </View>

      {/* 百科 - 毛玻璃卡片 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>萌寵百科指南</Text>
          <Pressable onPress={() => navigation.navigate('ArticleList')}>
            <Text style={styles.sectionLink}>查看全部</Text>
          </Pressable>
        </View>
        <GlassCard dark={dark} style={styles.articleCardOuter} innerStyle={styles.articleCardInner}>
          {articles.length > 0 ? (
            <ScalePressable
              onPress={() => navigation.navigate('ArticleDetail', { articleId: articles[articleIdx]?.id ?? '' })}
              style={styles.articleInner}
            >
              <Image source={{ uri: ensureImageUri(articles[articleIdx]?.coverImage) }} style={styles.articleImage} />
              <View style={styles.articleOverlay} />
              <View style={styles.articleBottom}>
                <View style={styles.articleMetaRow}>
                  <Text style={styles.articleCategory}>{articles[articleIdx]?.category}</Text>
                  {articles[articleIdx]?.readTime && (
                    <View style={styles.articleReadTime}>
                      <Clock size={10} color="rgba(255,255,255,0.6)" />
                      <Text style={styles.articleReadTimeText}>{articles[articleIdx]?.readTime}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.articleTitle} numberOfLines={1}>{articles[articleIdx]?.title}</Text>
                <Text style={styles.articleSummary} numberOfLines={1}>{articles[articleIdx]?.summary}</Text>
              </View>
            </ScalePressable>
          ) : (
            <View style={styles.articlePlaceholder}>
              <Text style={[styles.articlePlaceholderText, { color: subColor }]}>正在編撰百科...</Text>
            </View>
          )}
          <View style={styles.dots}>
            {articles.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, articleIdx === i && styles.dotActive]}
              />
            ))}
          </View>
        </GlassCard>
      </View>

      {/* 用药 + 钱包 - 双卡毛玻璃 */}
      <View style={styles.grid2}>
        <ScalePressable onPress={() => navigation.navigate('Medication')} style={styles.quickCardWrap}>
          <GlassCard dark={dark} style={styles.quickCardGlass} intensity={72}>
            <View style={styles.quickCardInner}>
              <View style={styles.quickIconWrap}>
                <Pill size={20} color="#6366f1" />
              </View>
              <View style={styles.quickText}>
                <Text style={[styles.quickLabel, { color: subColor }]}>用藥提醒</Text>
                <View style={styles.quickValueScrollWrap}>
                  <Animated.View
                    style={[
                      styles.quickValueScrollInner,
                      {
                        transform: [
                          {
                            translateY: scrollAnim.interpolate({
                              inputRange: Array.from({ length: 24 }, (_, i) => i),
                              outputRange: Array.from({ length: 24 }, (_, i) => -i * 22),
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    {allChunks.map((chunk, i) => (
                      <Text
                        key={i}
                        style={[
                          styles.quickValue,
                          todayMeds.length > 0 ? { color: textColor } : { color: subColor },
                        ]}
                        numberOfLines={1}
                      >
                        {chunk}
                      </Text>
                    ))}
                  </Animated.View>
                </View>
              </View>
            </View>
          </GlassCard>
        </ScalePressable>
        <ScalePressable onPress={() => navigation.navigate('Wallet')} style={styles.quickCardWrap}>
          <GlassCard dark={dark} style={styles.quickCardGlass} intensity={72}>
            <View style={styles.quickCardInner}>
              <View style={[styles.quickIconWrap, { backgroundColor: 'rgba(16, 185, 129, 0.25)' }]}>
                <Wallet size={20} color="#10b981" />
              </View>
              <View style={styles.quickText}>
                <Text style={[styles.quickLabel, { color: subColor }]}>寵物錢包</Text>
                <Text style={[styles.quickValue, { color: textColor }]}>收支統計</Text>
              </View>
            </View>
          </GlassCard>
        </ScalePressable>
      </View>

      {/* AI 檢測（健康·成分·翻譯 三合一）+ AI 顧問 - 毛玻璃 */}
      <View style={styles.grid2}>
        <ScalePressable onPress={() => navigation.navigate('Detect')} style={styles.aiCardWrap}>
          <GlassCard dark={dark} style={styles.aiCardGlass} intensity={70}>
            <View style={styles.aiCardInner}>
              <View style={[styles.aiIconWrap, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
                <Scan size={26} color="#3b82f6" />
              </View>
              <Text style={[styles.aiTitle, { color: textColor }]}>AI 檢測</Text>
              <Text style={styles.aiSub}>健康 · 成分 · 報告翻譯</Text>
            </View>
          </GlassCard>
        </ScalePressable>
        <ScalePressable onPress={() => navigation.navigate('AIConsultant')} style={styles.aiCardWrap}>
          <GlassCard dark={dark} style={styles.aiCardGlass} intensity={70}>
            <View style={styles.aiCardInner}>
              <View style={[styles.aiIconWrap, { backgroundColor: 'rgba(168, 85, 247, 0.2)' }]}>
                <MessageSquareText size={26} color="#a855f7" />
              </View>
              <Text style={[styles.aiTitle, { color: textColor }]}>AI 顧問</Text>
              <Text style={[styles.aiSub, { color: '#a855f7' }]}>24/7 在線諮詢</Text>
            </View>
          </GlassCard>
        </ScalePressable>
      </View>

      {/* 时光胶囊 - 底部毛玻璃条；阴影放外层避免 iOS overflow 裁剪 */}
      <View style={styles.albumCardShadowWrap}>
        <ScalePressable
          onPress={() => navigation.navigate('Album')}
          style={styles.albumCard}
        >
        {albumPreview && (
          <Image source={{ uri: ensureImageUri(albumPreview?.url) }} style={styles.albumBgImage} resizeMode="cover" />
        )}
        <View style={styles.albumGradient} />
        <View style={styles.albumGlassBar}>
          <BlurView intensity={56} tint="dark" style={StyleSheet.absoluteFillObject} />
          <View style={styles.albumContent}>
            <View style={styles.albumLabelRow}>
              <View style={styles.albumPulse} />
              <Text style={styles.albumLabel}>Memories capsule</Text>
            </View>
            <Text style={styles.albumTitle}>{hasPets && activePet ? `回味 ${activePet.name} 的精彩瞬間` : '添加寵物後記錄精彩瞬間'}</Text>
            <Text style={styles.albumSub}>查看 3 天前的午後時光...</Text>
          </View>
          <View style={styles.albumIconWrap}>
            <LayoutGrid size={20} color="#fff" />
          </View>
          </View>
        </ScalePressable>
      </View>

      {/* 成长日历 - 毛玻璃 */}
      <ScalePressable onPress={() => navigation.navigate('Calendar')} style={styles.calendarCardWrap}>
        <GlassCard dark={dark} style={styles.calendarCardGlass} intensity={68}>
          <View style={styles.calendarCardInner}>
            <View style={styles.calendarHead}>
              <View style={styles.calendarTitleRow}>
                <CalendarIcon size={18} color={colors.orange[500]} style={styles.calendarIcon} />
                <Text style={[styles.calendarTitle, { color: textColor }]}>成長日曆</Text>
              </View>
              <View style={styles.calendarViewAll}>
                <Text style={styles.calendarViewAllText}>查看全部</Text>
              </View>
            </View>
            <View style={styles.calendarDaysRow}>
          {(() => {
            const today = new Date();
            const year = today.getFullYear();
            const month = today.getMonth();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
            const allDays = Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              return {
                day,
                dateStr,
                isToday: day === today.getDate(),
                dayOfWeek: weekDays[new Date(year, month, day).getDay()],
                hasEntry: entries.some((e) => e.date === dateStr),
                hasMed: medications.some((m) => m.date === dateStr),
              };
            });
            const start = Math.max(0, today.getDate() - 4);
            const end = Math.min(today.getDate() + 3, daysInMonth);
            const items = allDays.slice(start, end);
            return items.map((item) => (
              <View key={item.day} style={styles.calendarDayWrap}>
                <Text style={[styles.calendarDayWeek, { color: item.isToday ? colors.orange[500] : subColor }]}>{item.dayOfWeek}</Text>
                <View style={[styles.calendarDayNum, item.isToday && styles.calendarDayNumToday]}>
                  <Text style={[styles.calendarDayNumText, item.isToday && { color: '#fff' }]}>{item.day}</Text>
                </View>
                <View style={styles.calendarDots}>
                  {item.hasEntry && <View style={[styles.calendarDot, styles.calendarDotOrange]} />}
                  {item.hasMed && <View style={[styles.calendarDot, styles.calendarDotIndigo]} />}
                </View>
              </View>
            ));
          })()}
            </View>
          </View>
        </GlassCard>
      </ScalePressable>

      {/* AI 萌宠日记 - 毛玻璃 */}
      <ScalePressable onPress={() => navigation.navigate('Diary')} style={styles.diaryCardWrap}>
        <GlassCard dark={dark} style={styles.diaryCardGlass} intensity={70}>
          <View style={styles.diaryCardInner}>
            <View style={styles.diaryHead}>
              <View style={styles.diaryTitleRow}>
                <Image
                  source={require('../../assets/icon/paw_button.png')}
                  style={styles.diaryIcon}
                  resizeMode="contain"
                />
                <Text style={[styles.diaryTitle, { color: textColor }]}>AI 萌寵日記</Text>
              </View>
              <View style={styles.diaryTag}>
                <Text style={styles.diaryTagText}>台式療癒</Text>
              </View>
            </View>
            <View style={[styles.diaryQuote, dark ? styles.diaryQuoteDark : styles.diaryQuoteLight]}>
              <Text style={[styles.diaryQuoteText, { color: textColor }]}>
                「{entries[0]?.content || '今天陪麻薯玩了一整天，它真的好可愛嗚嗚... ✨'}」
              </Text>
            </View>
          </View>
        </GlassCard>
      </ScalePressable>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  headerPlaceholder: { height: 56 },
  petCardShadowWrap: {
    marginBottom: spacing.lg,
    borderRadius: borderRadius['4xl'],
    ...(Platform.OS === 'ios' ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 18 },
      shadowOpacity: 0.55,
      shadowRadius: 42,
    } : { elevation: 20 }),
  },
  petCard: {
    borderRadius: borderRadius['4xl'],
    padding: spacing.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  petCardDecor: { position: 'absolute', top: -20, right: -20 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    gap: 4,
  },
  badgeText: { fontSize: 10, fontWeight: '800', color: '#fde68a' },
  vipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 4,
  },
  vipBadgeText: { fontSize: 10, fontWeight: '800', color: '#fef3c7' },
  petRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  petAvatar: {
    width: 72,
    height: 72,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  petAvatarMemorial: { borderColor: 'rgba(245, 158, 11, 0.35)' },
  petInfo: { flex: 1 },
  petName: { fontSize: 22, fontWeight: '800', color: '#fff' },
  petTags: { flexDirection: 'row', gap: spacing.sm, marginTop: 6 },
  tag: { backgroundColor: 'rgba(255,255,255,0.22)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  tagText: { fontSize: 11, fontWeight: '800', color: '#fff' },
  petFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: spacing.lg },
  petFooterLabel: { fontSize: 11, color: 'rgba(255,255,255,0.75)' },
  petFooterValueRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  petFooterValue: { fontSize: 16, fontWeight: '800', color: '#fff' },
  petFooterSparkles: { marginLeft: 4 },
  petCardTopRight: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  petCardIcon: { width: 50, height: 50 },
  petCardIconEmpty: { position: 'absolute', top: spacing.md, right: spacing.md, width: 40, height: 40, opacity: 0.6 },
  chevronWrap: { backgroundColor: 'rgba(255,255,255,0.22)', padding: 10, borderRadius: borderRadius['2xl'] },
  petCardEmpty: { minHeight: 140, justifyContent: 'center', alignItems: 'center' },
  petEmptyContent: { alignItems: 'center', paddingVertical: spacing.lg, paddingHorizontal: spacing.xl },
  petEmptyTitle: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
  petEmptyHint: { fontSize: 13, textAlign: 'center', marginBottom: spacing.lg, lineHeight: 20 },
  petEmptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 999 },
  petEmptyBtnText: { fontSize: 14, fontWeight: '800', color: '#fff' },
  section: { marginBottom: spacing.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: spacing.sm, paddingHorizontal: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '800' },
  sectionLink: { fontSize: 10, fontWeight: '800', color: colors.orange[500] },
  articleCardOuter: {
    overflow: 'hidden',
    aspectRatio: 16 / 9,
  },
  articleCardInner: {
    padding: 0,
    aspectRatio: 16 / 9,
  },
  articleInner: { flex: 1 },
  articleImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  articleOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  articleBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
  },
  articleMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  articleCategory: { fontSize: 8, fontWeight: '800', color: colors.orange[500] },
  articleReadTime: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  articleReadTimeText: { fontSize: 8, fontWeight: '700', color: 'rgba(255,255,255,0.65)' },
  articleTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  articleSummary: { fontSize: 11, color: 'rgba(255,255,255,0.75)' },
  articlePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  articlePlaceholderText: { fontSize: 12, fontWeight: '800' },
  dots: { position: 'absolute', top: spacing.md, right: spacing.md, flexDirection: 'row', gap: 5 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.35)' },
  dotActive: { width: 14, backgroundColor: colors.orange[500] },
  grid2: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  quickCardWrap: { flex: 1 },
  quickCardGlass: { flex: 1, minHeight: 76 },
  quickCardInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  quickIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickText: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 9, fontWeight: '800', marginBottom: 2, textAlign: 'center' },
  quickValueScrollWrap: { height: 22, overflow: 'hidden', width: '100%', alignItems: 'center' },
  quickValueScrollInner: { alignItems: 'center' },
  quickValue: { fontSize: 13, fontWeight: '800', textAlign: 'center', height: 22, lineHeight: 22 },
  aiCardWrap: { flex: 1 },
  aiCardGlass: { flex: 1, minHeight: 132 },
  aiCardInner: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aiIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTitle: { fontSize: 17, fontWeight: '800', textAlign: 'center', alignSelf: 'stretch' },
  aiSub: { fontSize: 9, fontWeight: '800', marginTop: 2, color: '#3b82f6', textAlign: 'center', alignSelf: 'stretch' },
  albumCardShadowWrap: {
    marginBottom: spacing.lg,
    borderRadius: borderRadius['4xl'],
    ...(Platform.OS === 'ios' ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 18 },
      shadowOpacity: 0.55,
      shadowRadius: 40,
    } : { elevation: 20 }),
  },
  albumCard: {
    width: '100%',
    alignSelf: 'stretch',
    borderRadius: borderRadius['4xl'],
    aspectRatio: 16 / 7,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0f172a',
  },
  albumBgImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%', opacity: 0.75 },
  albumGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  albumGlassBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
    borderRadius: 0,
  },
  albumContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  albumLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  albumPulse: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.orange[500] },
  albumLabel: { fontSize: 8, fontWeight: '800', color: '#fb923c', letterSpacing: 1.5 },
  albumTitle: { fontSize: 16, fontWeight: '800', color: '#fff', marginBottom: 2, textAlign: 'center', alignSelf: 'stretch' },
  albumSub: { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.65)', textAlign: 'center', alignSelf: 'stretch' },
  albumIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarCardWrap: { marginBottom: spacing.lg },
  calendarCardGlass: { minHeight: 168 },
  calendarCardInner: {
    ...StyleSheet.absoluteFillObject,
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  calendarHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  calendarTitleRow: { flexDirection: 'row', alignItems: 'center' },
  calendarIcon: { marginRight: 10 },
  calendarTitle: { fontSize: 16, fontWeight: '800' },
  calendarViewAll: { backgroundColor: colors.orange[50], paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999 },
  calendarViewAllText: { fontSize: 11, fontWeight: '800', color: colors.orange[600] },
  calendarDaysRow: { flexDirection: 'row', justifyContent: 'space-between' },
  calendarDayWrap: { alignItems: 'center', paddingVertical: 6 },
  calendarDayWeek: { fontSize: 9, fontWeight: '800', marginBottom: 4 },
  calendarDayNum: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayNumToday: { backgroundColor: colors.orange[500], borderWidth: 1, borderColor: colors.orange[600] },
  calendarDayNumText: { fontSize: 13, fontWeight: '700', color: colors.gray[800] },
  calendarDots: { flexDirection: 'row', gap: 2, marginTop: 4, minHeight: 4 },
  calendarDot: { width: 4, height: 4, borderRadius: 2 },
  calendarDotOrange: { backgroundColor: colors.orange[500] },
  calendarDotIndigo: { backgroundColor: '#6366f1' },
  diaryCardWrap: { marginBottom: spacing.lg },
  diaryCardGlass: { minHeight: 140 },
  diaryCardInner: {
    ...StyleSheet.absoluteFillObject,
    padding: spacing.lg,
  },
  diaryHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  diaryTitleRow: { flexDirection: 'row', alignItems: 'center' },
  diaryIcon: { width: 18, height: 18, marginRight: 10 },
  diaryTitle: { fontSize: 16, fontWeight: '800' },
  diaryTag: { backgroundColor: colors.orange[100], paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
  diaryTagText: { fontSize: 9, fontWeight: '800', color: colors.orange[600], letterSpacing: 1 },
  diaryQuote: {
    padding: spacing.md,
    borderRadius: 20,
    borderWidth: 1,
  },
  diaryQuoteLight: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(255,255,255,0.5)',
  },
  diaryQuoteDark: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  diaryQuoteText: { fontSize: 15, fontWeight: '600', fontStyle: 'italic', lineHeight: 22 },
});
