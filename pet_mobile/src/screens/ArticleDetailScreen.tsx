import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Image,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Share2,
  Heart,
  Bookmark,
  Clock,
  User,
  ThumbsUp,
  MessageCircle,
  ArrowRight,
  Sparkles,
  Loader2,
} from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../navigation/types';
import type { Article } from '../types';
import * as mockApi from '../api/mock';
import { useApp } from '../context/AppContext';
import { colors, borderRadius, spacing } from '../theme/tokens';

type Props = NativeStackScreenProps<HomeStackParamList, 'ArticleDetail'>;

export default function ArticleDetailScreen({ navigation, route }: Props) {
  const { articleId } = route.params;
  const { isDarkMode } = useApp();
  const insets = useSafeAreaInsets();
  const dark = isDarkMode;
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    mockApi.fetchArticleById(articleId).then((a) => {
      setArticle(a);
      setIsLoading(false);
    });
  }, [articleId]);

  const textColor = dark ? '#f8fafc' : colors.gray[800];
  const subColor = dark ? colors.gray[400] : colors.gray[500];
  const glassBg = dark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)';

  if (isLoading) {
    return (
      <View
        style={[
          styles.loadingWrap,
          {
            backgroundColor: dark ? colors.slate[950] : '#fff',
            paddingTop: Platform.OS === 'ios' ? insets.top : 0,
            paddingBottom: Platform.OS === 'ios' ? insets.bottom : 0,
          },
        ]}
      >
        <Loader2 size={32} color={colors.orange[500]} />
        <Text style={[styles.loadingText, { color: subColor }]}>正在載入專家的智慧...</Text>
      </View>
    );
  }

  if (!article) return null;

  return (
    <View style={[styles.container, { backgroundColor: dark ? colors.slate[950] : '#fff' }]}>
      <View
        style={[
          styles.floatingHeader,
          {
            backgroundColor: glassBg,
            paddingTop: Platform.OS === 'ios' ? insets.top + spacing.lg - spacing.lg : spacing.lg,
            paddingLeft: spacing.lg + insets.left,
            paddingRight: spacing.lg + insets.right,
          },
        ]}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          style={[styles.headerBtn, { backgroundColor: glassBg, borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }]}
        >
          <ChevronLeft size={22} color={dark ? '#f8fafc' : colors.gray[800]} />
        </Pressable>
        <Pressable
          style={[styles.headerBtn, { backgroundColor: glassBg, borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }]}
        >
          <Share2 size={18} color={dark ? '#f8fafc' : colors.gray[800]} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 120 + (Platform.OS === 'ios' ? insets.bottom : 0) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.coverWrap}>
          <Image source={{ uri: article.coverImage }} style={styles.coverImage} resizeMode="cover" />
          <View style={styles.coverGradient} />
          <View style={styles.coverCategory}>
            <Text style={styles.coverCategoryText}>{article.category}</Text>
          </View>
        </View>

        <View style={styles.body}>
          <Text style={[styles.title, { color: textColor }]}>{article.title}</Text>
          <View style={[styles.metaRow, { borderColor: dark ? 'rgba(255,255,255,0.05)' : colors.gray[50] }]}>
            <View style={styles.authorRow}>
              <View style={[styles.avatarWrap, { backgroundColor: dark ? colors.slate[800] : colors.gray[50] }]}>
                <User size={18} color={colors.orange[500]} />
              </View>
              <View>
                <Text style={[styles.authorName, { color: textColor }]}>{article.author}</Text>
                <Text style={[styles.authorDate, { color: subColor }]}>{article.date}</Text>
              </View>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Clock size={12} color={subColor} />
                <Text style={[styles.statText, { color: subColor }]}>{article.readTime}</Text>
              </View>
              <View style={styles.stat}>
                <ThumbsUp size={12} color={subColor} />
                <Text style={[styles.statText, { color: subColor }]}>{article.likes}</Text>
              </View>
            </View>
          </View>
          <Text style={[styles.content, { color: textColor }]}>{article.content}</Text>
          <View style={[styles.aiInsight, { backgroundColor: 'rgba(249, 115, 22, 0.08)', borderColor: 'rgba(249, 115, 22, 0.2)' }]}>
            <View style={styles.aiInsightHead}>
              <Sparkles size={18} color={colors.orange[600]} />
              <Text style={styles.aiInsightTitle}>AI 推薦總結</Text>
            </View>
            <Text style={[styles.aiInsightText, { color: textColor }]}>
              科學養寵不僅是責任，更是一種愛的體現。建議將本文提到的水分優化方案與您的寵物日常飲食相結合，持續觀察兩週，您會發現毛孩子的狀態有顯著提升。
            </Text>
          </View>
          <Text style={[styles.copyright, { color: subColor }]}>© 2025 PawPal AI · 版權所有 · 專業養寵指導</Text>
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: glassBg,
            borderColor: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)',
            left: spacing.lg + insets.left,
            right: spacing.lg + insets.right,
            bottom: Platform.OS === 'ios' ? 5 + insets.bottom-spacing['3xl'] : 10,
          },
        ]}
      >
        <View style={styles.bottomActions}>
          <Pressable
            onPress={() => setIsLiked(!isLiked)}
            style={styles.bottomAction}
          >
            <Heart size={20} color={isLiked ? '#f43f5e' : subColor} fill={isLiked ? '#f43f5e' : 'transparent'} />
            <Text style={[styles.bottomActionLabel, { color: subColor }]}>點讚</Text>
          </Pressable>
          <Pressable
            onPress={() => setIsBookmarked(!isBookmarked)}
            style={styles.bottomAction}
          >
            <Bookmark size={20} color={isBookmarked ? colors.orange[500] : subColor} fill={isBookmarked ? colors.orange[500] : 'transparent'} />
            <Text style={[styles.bottomActionLabel, { color: subColor }]}>收藏</Text>
          </Pressable>
          <Pressable style={styles.bottomAction}>
            <MessageCircle size={20} color={subColor} />
            <Text style={[styles.bottomActionLabel, { color: subColor }]}>評論</Text>
          </Pressable>
        </View>
        <Pressable style={styles.joinBtn}>
          <Text style={styles.joinBtnText}>加入養寵群組</Text>
          <ArrowRight size={14} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.lg },
  loadingText: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.lg,
    zIndex: 10,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 120 },
  coverWrap: { aspectRatio: 16 / 10, position: 'relative' },
  coverImage: { width: '100%', height: '100%' },
  coverGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
    backgroundColor: 'transparent',
  },
  coverCategory: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.xl,
    backgroundColor: colors.orange[500],
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  coverCategoryText: { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  body: { padding: spacing.xl },
  title: { fontSize: 24, fontWeight: '800', marginBottom: spacing.lg, lineHeight: 32 },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginBottom: spacing.xl,
  },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorName: { fontSize: 12, fontWeight: '800' },
  authorDate: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  statsRow: { flexDirection: 'row', gap: spacing.lg },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 10, fontWeight: '800' },
  content: { fontSize: 16, fontWeight: '600', lineHeight: 26, marginBottom: spacing.xl },
  aiInsight: {
    padding: spacing.xl,
    borderRadius: 32,
    borderWidth: 1,
    marginBottom: spacing.xl,
  },
  aiInsightHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.sm },
  aiInsightTitle: { fontSize: 14, fontWeight: '800', color: colors.orange[600], letterSpacing: 0.5 },
  aiInsightText: { fontSize: 12, fontWeight: '700', lineHeight: 20 },
  copyright: { fontSize: 9, fontWeight: '800', textAlign: 'center', letterSpacing: 1 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: '5%',
    right: '5%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 28,
    borderWidth: 1,
    marginBottom: 24,
    gap: 8,
  },
  bottomActions: { flexDirection: 'row', flex: 1 },
  bottomAction: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  bottomActionLabel: { fontSize: 8, fontWeight: '800', marginTop: 4 },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: colors.orange[600],
    borderRadius: 16,
  },
  joinBtnText: { fontSize: 12, fontWeight: '800', color: '#fff' },
});
