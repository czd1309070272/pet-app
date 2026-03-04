import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Share2,
  MoreHorizontal,
  ShoppingCart,
  MessageCircle,
  Store,
  Heart,
  Star,
  ChevronRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Info,
} from 'lucide-react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { DiscoveryStackParamList } from '../navigation/types';
import type { Product } from '../types';
import * as mockApi from '../api/mock';
import { url_base } from '../types';
import { useApp } from '../context/AppContext';
import { colors, borderRadius, spacing } from '../theme/tokens';

type Nav = NativeStackNavigationProp<DiscoveryStackParamList, 'ProductDetail'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const IMAGE_PLACEHOLDER = 'https://picsum.photos/seed/placeholder/200';

function imageUri(path: string): string {
  const s = (path ?? '').trim();
  if (s === '') return IMAGE_PLACEHOLDER;
  return s.startsWith('http') ? s : `${url_base}${s}`;
}

export default function ProductDetailScreen({
  route,
  navigation,
}: {
  route: { params: { productId: string } };
  navigation: Nav;
}) {
  const { productId } = route.params;
  const insets = useSafeAreaInsets();
  const { isDarkMode } = useApp();
  const dark = isDarkMode;

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      const data = await mockApi.fetchProductById(productId);
      if (!cancelled) {
        setProduct(data ?? null);
        setActiveImageIdx(0);
      }
      setIsLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [productId]);

  const handleAddToCart = async () => {
    if (!product) return;
    try {
      await mockApi.addToCart(product, 1);
      navigation.navigate('Cart');
    } catch {
      // 可接 Toast
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.center, dark ? styles.bgDark : styles.bgLight]}>
        <ActivityIndicator size="large" color={colors.orange[500]} />
        <Text style={[styles.loadingText, dark && styles.textMuted]}>正在獲取產品資訊...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[styles.center, dark ? styles.bgDark : styles.bgLight]}>
        <Text style={[styles.emptyText, dark && styles.textMuted]}>抱歉，該產品目前無法提供</Text>
        <Pressable onPress={() => navigation.goBack()} style={styles.backToMall}>
          <Text style={styles.backToMallText}>返回商城</Text>
        </Pressable>
      </View>
    );
  }

  const images = product.detailImages && product.detailImages.length > 0 ? product.detailImages : [product.imageUrl];
  const bg = dark ? '#0f172a' : '#fafafa';
  const cardBg = dark ? '#0f172a' : '#fff';
  const borderColor = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const textPrimary = dark ? '#f8fafc' : '#0f172a';
  const textSecondary = dark ? '#94a3b8' : '#64748b';

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      {/* 沉浸式透明 Header */}
      <View style={[styles.headerFloat, { paddingTop: insets.top + spacing.md }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [
            styles.headerBtn,
            dark ? styles.headerBtnDark : styles.headerBtnLight,
            pressed && styles.pressed,
          ]}
        >
          <ChevronLeft size={22} color={dark ? '#f8fafc' : '#1e293b'} />
        </Pressable>
        <View style={styles.headerRight}>
          <Pressable style={[styles.headerBtn, dark ? styles.headerBtnDark : styles.headerBtnLight]}>
            <Share2 size={18} color={dark ? '#f8fafc' : '#1e293b'} />
          </Pressable>
          <Pressable style={[styles.headerBtn, dark ? styles.headerBtnDark : styles.headerBtnLight]}>
            <MoreHorizontal size={18} color={dark ? '#f8fafc' : '#1e293b'} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 32 + 80 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 輪播圖 */}
        <View style={styles.carouselWrap}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setActiveImageIdx(Math.min(idx, images.length - 1));
            }}
            style={styles.carouselScroll}
          >
            {images.map((img, idx) => (
              <Image
                key={idx}
                source={{ uri: imageUri(img) }}
                style={[styles.carouselImage, { width: SCREEN_WIDTH }]}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
          {images.length > 1 && (
            <View style={styles.dotsWrap}>
              {images.map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.dot,
                    activeImageIdx === idx ? styles.dotActive : styles.dotInactive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* 標題與價格 */}
        <View style={[styles.section, { backgroundColor: cardBg, borderBottomWidth: 1, borderBottomColor: borderColor }]}>
          <View style={styles.badges}>
            <View style={styles.badgeLimited}>
              <Text style={styles.badgeLimitedText}>Limited</Text>
            </View>
            <Text style={[styles.productId, { color: textSecondary }]}>Product ID: {product.productId}</Text>
          </View>
          <Text style={[styles.title, { color: textPrimary }]}>{product.name}</Text>
          <View style={styles.priceRow}>
            <View>
              {product.originalPrice != null && (
                <Text style={[styles.originalPrice, { color: textSecondary }]}>HK$ {product.originalPrice}</Text>
              )}
              <View style={styles.priceMain}>
                <Text style={styles.priceCurrency}>HK$</Text>
                <Text style={styles.priceValue}>{product.price}</Text>
              </View>
            </View>
            <View style={[styles.ratingBadge, dark && styles.ratingBadgeDark]}>
              <Star size={14} color="#f59e0b" fill="#f59e0b" />
              <Text style={styles.ratingText}>{product.rating}</Text>
              <Text style={[styles.ratingDivider, { color: textSecondary }]}>|</Text>
              <Text style={[styles.salesText, { color: textSecondary }]}>已售 {product.sales}</Text>
            </View>
          </View>
        </View>

        {/* 物流與保障 */}
        <View style={[styles.section, styles.sectionBorder, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.serviceRow}>
            <View style={styles.serviceItem}>
              <View style={styles.serviceIconWrap}>
                <Truck size={18} color="#059669" />
              </View>
              <View>
                <Text style={[styles.serviceTitle, { color: textPrimary }]}>順豐速運發貨</Text>
                <Text style={[styles.serviceSub, { color: textSecondary }]}>滿 HK$300 免運費</Text>
              </View>
            </View>
            <View style={styles.serviceItem}>
              <View style={[styles.serviceIconWrap, { backgroundColor: dark ? 'rgba(59,130,246,0.2)' : '#eff6ff' }]}>
                <RotateCcw size={18} color="#2563eb" />
              </View>
              <View>
                <Text style={[styles.serviceTitle, { color: textPrimary }]}>7天無條件退換</Text>
                <Text style={[styles.serviceSub, { color: textSecondary }]}>原廠包裝未拆</Text>
              </View>
            </View>
            <ChevronRight size={18} color={textSecondary} />
          </View>
          <View style={[styles.guaranteeCard, dark && styles.guaranteeCardDark]}>
            <View style={styles.guaranteeLeft}>
              <View style={styles.guaranteeIcon}>
                <ShieldCheck size={20} color="#fff" />
              </View>
              <View>
                <Text style={[styles.guaranteeTitle, { color: textPrimary }]}>PawPal 正品保證</Text>
                <Text style={[styles.guaranteeSub, { color: textSecondary }]}>Global Quality Certified</Text>
              </View>
            </View>
            <Pressable style={[styles.guaranteeBtn, dark && styles.guaranteeBtnDark]}>
              <Text style={styles.guaranteeBtnText}>查看資質</Text>
            </Pressable>
          </View>
        </View>

        {/* 產品說明 + 詳情圖 */}
        <View style={[styles.section, { backgroundColor: cardBg }]}>
          <View style={styles.detailHeader}>
            <Info size={18} color={colors.orange[500]} />
            <Text style={[styles.detailTitle, { color: textPrimary }]}>產品說明 / Details</Text>
          </View>
          <Text style={[styles.description, { color: textSecondary }]}>
            {product.description || '此產品由 PawPal 專業研發團隊精心挑選，旨在為香港的都市萌寵提供最均衡的營養與最舒適的體驗。100% 安全認證，符合國際進口標準。'}
          </Text>
          {images.map((img, i) => (
            <View key={i} style={[styles.detailImageWrap, { borderColor }]}>
              <Image source={{ uri: imageUri(img) }} style={styles.detailImage} resizeMode="cover" />
            </View>
          ))}
        </View>
      </ScrollView>

      {/* 底部操作欄 */}
      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + spacing.md,
            backgroundColor: dark ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.95)',
            borderTopColor: borderColor,
          },
        ]}
      >
        <View style={styles.footerLeft}>
          <Pressable style={styles.footerIconBtn}>
            <Store size={22} color={textSecondary} strokeWidth={1.5} />
            <Text style={[styles.footerIconLabel, { color: textSecondary }]}>店舖</Text>
          </Pressable>
          <Pressable style={styles.footerIconBtn}>
            <MessageCircle size={22} color={textSecondary} strokeWidth={1.5} />
            <Text style={[styles.footerIconLabel, { color: textSecondary }]}>諮詢</Text>
          </Pressable>
          <Pressable
            onPress={() => setIsLiked(!isLiked)}
            style={styles.footerIconBtn}
          >
            <Heart
              size={22}
              color={isLiked ? '#f43f5e' : textSecondary}
              fill={isLiked ? '#f43f5e' : 'none'}
              strokeWidth={1.5}
            />
            <Text style={[styles.footerIconLabel, { color: isLiked ? '#f43f5e' : textSecondary }]}>收藏</Text>
          </Pressable>
        </View>
        <View style={styles.footerRight}>
          <Pressable
            onPress={handleAddToCart}
            style={[styles.footerActionBtn, styles.footerActionSecondary, dark && styles.footerActionSecondaryDark]}
          >
            <Text style={[styles.footerActionText, { color: textPrimary }]}>加入購物籃</Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('Cart')}
            style={styles.footerActionBtnPrimary}
          >
            <Text style={styles.footerActionTextPrimary}>立即結賬</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  bgLight: { backgroundColor: '#fff' },
  bgDark: { backgroundColor: '#0f172a' },
  loadingText: { marginTop: spacing.lg, fontSize: 12, fontWeight: '800', color: colors.gray[400] },
  textMuted: { color: colors.gray[500] },
  emptyText: { fontSize: 14, fontWeight: '800', color: colors.gray[500], marginBottom: spacing.xl },
  backToMall: { backgroundColor: colors.orange[500], paddingHorizontal: spacing['2xl'], paddingVertical: 12, borderRadius: borderRadius['2xl'] },
  backToMallText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  headerFloat: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerBtnLight: { backgroundColor: 'rgba(255,255,255,0.9)', borderColor: 'rgba(0,0,0,0.06)' },
  headerBtnDark: { backgroundColor: 'rgba(30,41,59,0.9)', borderColor: 'rgba(255,255,255,0.1)' },
  headerRight: { flexDirection: 'row', gap: 8 },
  pressed: { opacity: 0.9, transform: [{ scale: 0.95 }] },

  scroll: { flex: 1 },
  carouselWrap: { width: SCREEN_WIDTH, aspectRatio: 1, backgroundColor: '#fff' },
  carouselScroll: { width: SCREEN_WIDTH, height: SCREEN_WIDTH },
  carouselImage: { width: SCREEN_WIDTH, height: SCREEN_WIDTH },
  dotsWrap: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  dot: { borderRadius: 999 },
  dotActive: { width: 16, height: 6, backgroundColor: '#fff' },
  dotInactive: { width: 6, height: 6, backgroundColor: 'rgba(255,255,255,0.4)' },

  section: { paddingHorizontal: spacing.xl, paddingVertical: spacing['2xl'] },
  sectionBorder: { borderTopWidth: 1, borderBottomWidth: 1 },
  badges: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.sm },
  badgeLimited: { backgroundColor: colors.orange[500], paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  badgeLimitedText: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  productId: { fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  title: { fontSize: 24, fontWeight: '800', lineHeight: 32, marginBottom: spacing.lg },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  originalPrice: { fontSize: 12, textDecorationLine: 'line-through', marginBottom: 4 },
  priceMain: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  priceCurrency: { fontSize: 18, fontWeight: '800', color: colors.orange[600], fontStyle: 'italic' },
  priceValue: { fontSize: 36, fontWeight: '800', color: colors.orange[600], letterSpacing: -1 },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(251,191,36,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: borderRadius.xl,
  },
  ratingBadgeDark: { backgroundColor: 'rgba(251,191,36,0.2)' },
  ratingText: { fontSize: 12, fontWeight: '800', color: '#f59e0b' },
  ratingDivider: { marginHorizontal: 4 },
  salesText: { fontSize: 12 },

  serviceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xl },
  serviceItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  serviceIconWrap: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(5,150,105,0.15)', alignItems: 'center', justifyContent: 'center' },
  serviceTitle: { fontSize: 11, fontWeight: '800' },
  serviceSub: { fontSize: 9, fontWeight: '700' },
  guaranteeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    backgroundColor: 'rgba(113,113,122,0.08)',
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  guaranteeCardDark: { backgroundColor: 'rgba(30,41,59,0.5)', borderColor: 'rgba(255,255,255,0.05)' },
  guaranteeLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  guaranteeIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.orange[500], alignItems: 'center', justifyContent: 'center' },
  guaranteeTitle: { fontSize: 11, fontWeight: '800' },
  guaranteeSub: { fontSize: 9, fontWeight: '700', fontStyle: 'italic' },
  guaranteeBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  guaranteeBtnDark: { backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.1)' },
  guaranteeBtnText: { fontSize: 10, fontWeight: '800', color: colors.orange[600], letterSpacing: 2 },

  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.lg },
  detailTitle: { fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  description: { fontSize: 14, lineHeight: 22, marginBottom: spacing.xl },
  detailImageWrap: { borderRadius: borderRadius['3xl'], overflow: 'hidden', borderWidth: 1, marginBottom: spacing.lg },
  detailImage: { width: SCREEN_WIDTH - spacing.xl * 2, height: SCREEN_WIDTH - spacing.xl * 2 },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
  },
  footerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl },
  footerIconBtn: { alignItems: 'center', gap: 4 },
  footerIconLabel: { fontSize: 9, fontWeight: '700' },
  footerRight: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'flex-end', paddingLeft: spacing.lg },
  footerActionBtn: { flex: 1, maxWidth: 120, paddingVertical: 14, borderRadius: borderRadius['2xl'], alignItems: 'center', justifyContent: 'center' },
  footerActionSecondary: { backgroundColor: 'rgba(0,0,0,0.06)', borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' },
  footerActionSecondaryDark: { backgroundColor: 'rgba(30,41,59,0.8)', borderColor: 'rgba(255,255,255,0.1)' },
  footerActionText: { fontSize: 12, fontWeight: '800' },
  footerActionBtnPrimary: {
    flex: 1,
    maxWidth: 120,
    backgroundColor: colors.orange[600],
    paddingVertical: 14,
    borderRadius: borderRadius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.orange[600],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  footerActionTextPrimary: { color: '#fff', fontSize: 12, fontWeight: '800' },
});
