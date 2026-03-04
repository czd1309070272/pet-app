import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  Image,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Search, Clock, Heart, Filter, Loader2, BookOpen, TrendingUp } from 'lucide-react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../navigation/types';
import type { Article } from '../types';
import * as mockApi from '../api/mock';
import { useApp } from '../context/AppContext';
import { colors, borderRadius, spacing } from '../theme/tokens';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'ArticleList'>;

const CATEGORIES = ['全部', '健康守護', '護理科普', '行為解析', '營養膳食'];

export default function ArticleListScreen({ navigation }: { navigation: Nav }) {
  const { isDarkMode } = useApp();
  const insets = useSafeAreaInsets();
  const dark = isDarkMode;
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('全部');

  useEffect(() => {
    mockApi.fetchArticles().then((data) => {
      setArticles(data);
      setIsLoading(false);
    });
  }, []);

  const filteredArticles = articles.filter((a) => {
    const matchSearch =
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.summary.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = activeCategory === '全部' || a.category === activeCategory;
    return matchSearch && matchCat;
  });

  const textColor = dark ? '#f8fafc' : colors.gray[800];
  const subColor = dark ? colors.gray[400] : colors.gray[500];
  const glassBg = dark ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.9)';
  const glassBorder = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  return (
    <View style={[styles.container, { backgroundColor: dark ? colors.slate[950] : '#f8fafc' }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: glassBg,
            borderBottomColor: glassBorder,
            paddingTop: Platform.OS === 'ios' ? insets.top + spacing.lg : spacing.lg,
            paddingBottom: spacing.md,
            paddingLeft: spacing.lg + insets.left,
            paddingRight: spacing.lg + insets.right,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={[styles.backBtn, { backgroundColor: dark ? colors.slate[800] : 'rgba(255,255,255,0.9)' }]}
          >
            <ChevronLeft size={22} color={dark ? '#f8fafc' : colors.gray[600]} />
          </Pressable>
          <View>
            <Text style={[styles.title, { color: textColor }]}>萌寵百科全書</Text>
            <Text style={[styles.subtitle, { color: colors.orange[500] }]}>Expert Pet Knowledge Base</Text>
          </View>
          <View style={[styles.filterBtn, { backgroundColor: dark ? colors.slate[800] : 'rgba(255,255,255,0.9)' }]}>
            <Filter size={20} color={subColor} />
          </View>
        </View>
        <View style={styles.searchWrap}>
          <Search size={16} color={subColor} style={styles.searchIcon} />
          <TextInput
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="搜尋科普知識或症狀..."
            placeholderTextColor={subColor}
            style={[styles.searchInput, { backgroundColor: dark ? colors.slate[800] : colors.gray[100], color: textColor }]}
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              onPress={() => setActiveCategory(cat)}
              style={[
                styles.categoryChip,
                {
                  backgroundColor: activeCategory === cat ? colors.orange[500] : (dark ? colors.slate[800] : '#fff'),
                  borderColor: activeCategory === cat ? colors.orange[500] : glassBorder,
                },
              ]}
            >
              <Text style={[styles.categoryChipText, { color: activeCategory === cat ? '#fff' : subColor }]}>{cat}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: spacing.xl * 2 + (Platform.OS === 'ios' ? insets.bottom : 0),
            paddingLeft: spacing.xl + insets.left,
            paddingRight: spacing.xl + insets.right,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingWrap}>
            <Loader2 size={32} color={colors.orange[500]} />
            <Text style={[styles.loadingText, { color: subColor }]}>正在打開百科全書...</Text>
          </View>
        ) : filteredArticles.length === 0 ? (
          <View style={styles.emptyWrap}>
            <BookOpen size={64} color={subColor} />
            <Text style={[styles.emptyText, { color: subColor }]}>暫無匹配的百科內容</Text>
          </View>
        ) : (
          filteredArticles.map((article) => (
            <Pressable
              key={article.id}
              onPress={() => navigation.navigate('ArticleDetail', { articleId: article.id })}
              style={[styles.articleCard, { backgroundColor: glassBg, borderColor: glassBorder }]}
            >
              <View style={styles.articleImageWrap}>
                <Image source={{ uri: article.coverImage }} style={styles.articleImage} resizeMode="cover" />
                <View style={[styles.articleCategoryTag, { backgroundColor: glassBg }]}>
                  <Text style={styles.articleCategoryText}>{article.category}</Text>
                </View>
                <View style={styles.articleReadTime}>
                  <Clock size={12} color="#fff" />
                  <Text style={styles.articleReadTimeText}>{article.readTime}</Text>
                </View>
              </View>
              <View style={styles.articleBody}>
                <Text style={[styles.articleTitle, { color: textColor }]} numberOfLines={2}>{article.title}</Text>
                <Text style={[styles.articleSummary, { color: subColor }]} numberOfLines={2}>{article.summary}</Text>
                <View style={styles.articleMeta}>
                  <Text style={[styles.articleMetaText, { color: subColor }]}>{article.author}</Text>
                  <Text style={[styles.articleMetaText, { color: subColor }]}>{article.date}</Text>
                  <View style={styles.articleLikes}>
                    <Heart size={14} color="#f43f5e" />
                    <Text style={styles.articleLikesText}>{article.likes}</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          ))
        )}

        <View style={[styles.aiTeaser, { backgroundColor: '#6366f1' }]}>
          <View style={styles.aiTeaserDecor}>
            <BookOpen size={180} color="rgba(255,255,255,0.1)" />
          </View>
          <View style={styles.aiTeaserContent}>
            <View style={styles.aiTeaserHead}>
              <TrendingUp size={20} color="rgba(255,255,255,0.8)" />
              <Text style={styles.aiTeaserLabel}>AI Daily Insight</Text>
            </View>
            <Text style={styles.aiTeaserTitle}>找不到想要的內容？{'\n'}試試諮詢 AI 萌寵顧問</Text>
            <Text style={styles.aiTeaserDesc}>24/7 隨時在線，為您解答任何專業的養寵難題。</Text>
            <Pressable
              onPress={() => navigation.navigate('AIConsultant')}
              style={styles.aiTeaserBtn}
            >
              <Text style={styles.aiTeaserBtnText}>立即諮詢</Text>
            </Pressable>
          </View>
        </View>
        <Text style={[styles.footerHint, { color: subColor }]}>Powered by PawPal Expert Panel · © 2025</Text>
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  title: { flex: 1, fontSize: 20, fontWeight: '800' },
  subtitle: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: { position: 'relative', marginBottom: spacing.md },
  searchIcon: { position: 'absolute', left: 16, top: 14, zIndex: 1 },
  searchInput: {
    borderRadius: 16,
    paddingVertical: 12,
    paddingLeft: 44,
    paddingRight: 16,
    fontSize: 12,
    fontWeight: '700',
  },
  categoryRow: { marginHorizontal: -4 },
  categoryChip: {
    marginRight: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  categoryChipText: { fontSize: 11, fontWeight: '800' },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.xl, paddingBottom: spacing.xl * 2 },
  loadingWrap: { alignItems: 'center', paddingVertical: 48, gap: spacing.lg },
  loadingText: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  emptyWrap: { alignItems: 'center', paddingVertical: 64, gap: spacing.lg },
  emptyText: { fontSize: 14, fontWeight: '800' },
  articleCard: {
    borderRadius: 36,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: spacing.xl,
  },
  articleImageWrap: { aspectRatio: 16 / 8, position: 'relative' },
  articleImage: { width: '100%', height: '100%' },
  articleCategoryTag: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  articleCategoryText: { fontSize: 9, fontWeight: '800', color: colors.orange[600], letterSpacing: 0.5 },
  articleReadTime: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  articleReadTimeText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  articleBody: { padding: spacing.xl },
  articleTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  articleSummary: { fontSize: 14, fontWeight: '500', lineHeight: 22, marginBottom: spacing.lg },
  articleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  articleMetaText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  articleLikes: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  articleLikesText: { fontSize: 10, fontWeight: '800', color: '#f43f5e' },
  aiTeaser: {
    borderRadius: 40,
    padding: spacing.xl,
    marginTop: spacing.xl,
    overflow: 'hidden',
  },
  aiTeaserDecor: { position: 'absolute', top: -40, right: -40 },
  aiTeaserContent: { position: 'relative', zIndex: 1 },
  aiTeaserHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md },
  aiTeaserLabel: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.8)', letterSpacing: 2 },
  aiTeaserTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 8, lineHeight: 28 },
  aiTeaserDesc: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.7)', marginBottom: spacing.lg },
  aiTeaserBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  aiTeaserBtnText: { fontSize: 12, fontWeight: '800', color: '#6366f1' },
  footerHint: { fontSize: 9, fontWeight: '800', textAlign: 'center', marginTop: 48, letterSpacing: 2 },
});
