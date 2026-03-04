import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {
  Search,
  ShoppingCart,
  Star,
  Plus,
  Loader2,
  Heart,
  ShoppingBag,
  LayoutGrid,
  List,
  CheckCircle2,
  Trophy,
  ChevronLeft,
} from 'lucide-react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { DiscoveryStackParamList } from '../navigation/types';
import type { Product } from '../types';
import * as mockApi from '../api/mock';
import { useTabBarVisibility } from '../context/TabBarVisibilityContext';
import { useApp } from '../context/AppContext';
import { colors, borderRadius, spacing } from '../theme/tokens';

type Nav = NativeStackNavigationProp<DiscoveryStackParamList, 'Discovery'>;

const CATEGORIES = [
  { id: 'ALL', label: '全部' },
  { id: 'FOOD', label: '主糧' },
  { id: 'TREAT', label: '零食' },
  { id: 'HEALTH', label: '健康' },
  { id: 'TOY', label: '玩具' },
];

const LIMIT = 6;

export default function DiscoveryScreen({ navigation }: { navigation: Nav }) {
  const { isDarkMode } = useApp();
  const dark = isDarkMode;
  const { reportScroll } = useTabBarVisibility();

  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState<'ALL' | Product['category']>('ALL');
  const [layoutMode, setLayoutMode] = useState<'GRID' | 'LIST'>('GRID');
  const [cartCount, setCartCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isAddingId, setIsAddingId] = useState<string | null>(null);
  const [offset, setOffset] = useState(1);
  const [searchOffset, setSearchOffset] = useState(1);

  const loadCategory = useCallback(
    async (category: string, page: number) => {
      const list = await mockApi.fetchProducts(
        category === 'ALL' ? undefined : category,
        page,
        LIMIT
      );
      if (page === 1) setProducts(list);
      else setProducts((prev) => [...prev, ...list]);
    },
    []
  );

  const loadSearch = useCallback(async (keyword: string, page: number, append: boolean) => {
    const list = await mockApi.searchProducts(keyword, page, LIMIT);
    if (append) setProducts((prev) => [...prev, ...list]);
    else setProducts(list);
  }, []);

  const loadInitial = useCallback(async () => {
    setIsLoading(true);
    try {
      await loadCategory(activeCategory, 1);
      const cart = await mockApi.fetchCart();
      setCartCount(cart.reduce((acc, i) => acc + i.quantity, 0));
    } finally {
      setIsLoading(false);
    }
  }, [activeCategory, loadCategory]);

  useEffect(() => {
    if (isSearching) return;
    loadInitial();
  }, [activeCategory, isSearching]);

  const onRefresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      if (isSearching) {
        await loadSearch(searchKeyword, 1, false);
        setSearchOffset(1);
      } else {
        await loadCategory(activeCategory, 1);
        setOffset(1);
      }
      const cart = await mockApi.fetchCart();
      setCartCount(cart.reduce((acc, i) => acc + i.quantity, 0));
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, isSearching, searchKeyword, activeCategory, loadSearch, loadCategory]);

  const handleSearchSubmit = useCallback(async () => {
    const keyword = searchInput.trim();
    if (!keyword) {
      setIsSearching(false);
      setSearchKeyword('');
      setSearchInput('');
      await loadCategory(activeCategory, 1);
      return;
    }
    setIsSearching(true);
    setSearchKeyword(keyword);
    setIsLoading(true);
    try {
      await loadSearch(keyword, 1, false);
      setSearchOffset(1);
    } finally {
      setIsLoading(false);
    }
  }, [searchInput, activeCategory, loadCategory, loadSearch]);

  const handleCategoryChange = useCallback(
    (cat: string) => {
      if (isSearching) {
        setIsSearching(false);
        setSearchKeyword('');
        setSearchInput('');
      }
      setActiveCategory(cat as Product['category']);
    },
    [isSearching]
  );

  const handleAddToCart = useCallback(async (product: Product) => {
    setIsAddingId(product.id);
    try {
      await mockApi.addToCart(product, 1);
      const cart = await mockApi.fetchCart();
      setCartCount(cart.reduce((acc, i) => acc + i.quantity, 0));
    } finally {
      setTimeout(() => setIsAddingId(null), 600);
    }
  }, []);

  const bg = dark ? colors.slate[950] : '#f6f6f6';
  const headerBg = dark ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.95)';
  const cardBg = dark ? colors.slate[900] : '#fff';
  const textColor = dark ? '#f8fafc' : colors.gray[800];
  const subColor = dark ? colors.gray[400] : colors.gray[500];
  const inputBg = dark ? colors.slate[800] : '#f1f1f1';

  const renderProduct = useCallback(
    (item: Product) => (
      <Pressable
        key={item.id}
        onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
        style={[
          styles.productCard,
          layoutMode === 'LIST' && styles.productCardList,
          { backgroundColor: cardBg },
        ]}
      >
        <View style={layoutMode === 'GRID' ? styles.productImageWrap : styles.productImageWrapList}>
          <Image
            source={{
              uri: item.imageUrl.startsWith('http') ? item.imageUrl : 'https://picsum.photos/seed/p/200',
            }}
            style={layoutMode === 'GRID' ? styles.productImage : styles.productImageList}
          />
          {item.tag && (
            <View style={styles.tag}>
              <Trophy size={8} color="#fff" />
              <Text style={styles.tagText}>{item.tag}</Text>
            </View>
          )}
          <View style={styles.heartBtn}>
            <Heart size={14} color="rgba(255,255,255,0.8)" />
          </View>
        </View>
        <View style={[styles.productInfo, layoutMode === 'LIST' && styles.productInfoList]}>
          <Text style={[styles.productName, { color: textColor }]} numberOfLines={2}>
            {item.name}
          </Text>
          <View style={styles.ratingRow}>
            <Star size={10} color={colors.orange[500]} fill={colors.orange[500]} />
            <Text style={[styles.ratingText, { color: subColor }]}>
              {item.rating} | 已售 {item.sales}
            </Text>
          </View>
          {layoutMode === 'LIST' && (
            <Text style={[styles.extraText, { color: subColor }]} numberOfLines={1}>
              官方正品 · 限時包郵
            </Text>
          )}
          <View style={styles.priceRow}>
            <View>
              <View style={styles.priceWrap}>
                <Text style={styles.priceLabel}>HK$</Text>
                <Text style={styles.priceValue}>{item.price}</Text>
              </View>
              {item.originalPrice != null && (
                <Text style={styles.originalPrice}>HK$ {item.originalPrice}</Text>
              )}
            </View>
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                handleAddToCart(item);
              }}
              disabled={isAddingId === item.id}
              style={[
                styles.addBtn,
                layoutMode === 'LIST' && styles.addBtnList,
                isAddingId === item.id && styles.addBtnDone,
              ]}
            >
              {isAddingId === item.id ? (
                <CheckCircle2 size={18} color="#fff" />
              ) : (
                <>
                  <Plus size={18} color="#fff" />
                  {layoutMode === 'LIST' && (
                    <Text style={styles.addBtnText}>加購物籃</Text>
                  )}
                </>
              )}
            </Pressable>
          </View>
        </View>
      </Pressable>
    ),
    [
      layoutMode,
      cardBg,
      textColor,
      subColor,
      navigation,
      handleAddToCart,
      isAddingId,
    ]
  );

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View style={styles.headerPlaceholder} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: headerBg, borderBottomColor: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)' }]}>
        <View style={styles.headerRow}>
          <View style={styles.logoRow}>
            {navigation.canGoBack() ? (
              <Pressable
                onPress={() => navigation.goBack()}
                style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
              >
                <ChevronLeft size={24} color={textColor} />
              </Pressable>
            ) : null}
            <View style={styles.logoIcon}>
              <ShoppingBag size={18} color="#fff" />
            </View>
            <Text style={[styles.title, { color: textColor }]}>
              PawPal <Text style={styles.titleMall}>Mall</Text>
            </Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => setLayoutMode((m) => (m === 'GRID' ? 'LIST' : 'GRID'))}
              style={[styles.iconBtn, { backgroundColor: dark ? 'rgba(30,41,59,0.8)' : 'rgba(255,255,255,0.8)' }]}
            >
              {layoutMode === 'GRID' ? <List size={20} color={subColor} /> : <LayoutGrid size={20} color={subColor} />}
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate('Cart')}
              style={[styles.iconBtn, styles.cartBtn, { backgroundColor: cardBg }]}
            >
              <ShoppingCart size={20} color={textColor} />
              {cartCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartCount > 99 ? '99+' : cartCount}</Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>

        <View style={styles.searchRow}>
          <View style={[styles.searchWrap, { backgroundColor: inputBg }]}>
            <Search size={16} color={subColor} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: textColor }]}
              placeholder="搜尋全球萌寵好物..."
              placeholderTextColor={subColor}
              value={searchInput}
              onChangeText={(t) => {
                setSearchInput(t);
                if (!t.trim()) {
                  setIsSearching(false);
                  loadCategory(activeCategory, 1);
                }
              }}
              onSubmitEditing={handleSearchSubmit}
              returnKeyType="search"
            />
            <Pressable onPress={handleSearchSubmit} style={styles.searchSubmit}>
              <Search size={16} color={subColor} />
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.orange[500]}
          />
        }
        onScroll={reportScroll}
        scrollEventThrottle={16}
      >
        {!isSearching && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categories}
          >
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat.id}
                onPress={() => handleCategoryChange(cat.id)}
                style={[
                  styles.categoryChip,
                  activeCategory === cat.id ? styles.categoryChipActive : { backgroundColor: cardBg, borderColor: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)' },
                ]}
              >
                <Text
                  style={[
                    styles.categoryLabel,
                    activeCategory === cat.id ? styles.categoryLabelActive : { color: subColor },
                  ]}
                >
                  {cat.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        <View style={styles.productsWrap}>
          {isLoading && !isRefreshing ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={colors.orange[500]} />
              <Text style={[styles.loadingText, { color: subColor }]}>正在探索精選好物...</Text>
            </View>
          ) : layoutMode === 'GRID' ? (
            <View style={styles.gridContainer}>
              {products.map((p, i) => (
                <View key={p.id} style={[styles.gridCell, i % 2 === 0 ? styles.gridCellLeft : styles.gridCellRight]}>
                  {renderProduct(p)}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.listContainer}>
              {products.map((p) => renderProduct(p))}
            </View>
          )}
        </View>

        {!isLoading && products.length === 0 && (
          <View style={styles.emptyWrap}>
            <ShoppingBag size={48} color={subColor} />
            <Text style={[styles.emptyText, { color: subColor }]}>
              {isSearching ? '沒有找到相關商品...' : '該分類下暫無好物...'}
            </Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerPlaceholder: { height: 30 },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.orange[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 18, fontWeight: '800', fontStyle: 'italic' },
  titleMall: { color: colors.orange[500], fontStyle: 'normal' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBtn: { borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.orange[600],
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  searchRow: { marginTop: spacing.sm },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 10,
    paddingLeft: 12,
    paddingRight: 8,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 12, fontWeight: '700', paddingVertical: 0 },
  searchSubmit: { padding: 8 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  categories: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  categoryChipActive: { backgroundColor: colors.orange[600] },
  categoryLabel: { fontSize: 11, fontWeight: '800' },
  categoryLabelActive: { color: '#fff' },
  productsWrap: { paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
  loadingWrap: { paddingVertical: 48, alignItems: 'center', gap: spacing.md },
  loadingText: { fontSize: 12, fontWeight: '800' },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -spacing.sm / 2 },
  gridCell: { width: '50%', paddingHorizontal: spacing.sm / 2, marginBottom: spacing.sm },
  gridCellLeft: {},
  gridCellRight: {},
  listContainer: { gap: spacing.sm },
  productCard: {
    flex: 1,
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  productCardList: {
    flexDirection: 'row',
    minHeight: 144,
    flex: undefined,
  },
  productImageWrap: { width: '100%', aspectRatio: 1 },
  productImageWrapList: { width: 144, height: 144 },
  productImage: { width: '100%', height: '100%' },
  productImageList: { width: 144, height: 144 },
  tag: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.orange[600],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  tagText: { color: '#fff', fontSize: 8, fontWeight: '800' },
  heartBtn: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: { padding: spacing.md },
  productInfoList: { flex: 1, justifyContent: 'space-between', minWidth: 0 },
  productName: { fontSize: 12, fontWeight: '800' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  ratingText: { fontSize: 9, fontWeight: '800' },
  extraText: { fontSize: 10, marginTop: 4, fontStyle: 'italic' },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  priceWrap: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  priceLabel: { fontSize: 10, fontWeight: '800', color: colors.orange[600] },
  priceValue: { fontSize: 18, fontWeight: '800', color: colors.orange[600] },
  originalPrice: { fontSize: 9, color: colors.gray[400], textDecorationLine: 'line-through' },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.orange[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnList: { width: 96, flexDirection: 'row', gap: 6 },
  addBtnDone: { backgroundColor: '#10b981' },
  addBtnText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  emptyWrap: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 12, fontWeight: '800', marginTop: 8 },
});
