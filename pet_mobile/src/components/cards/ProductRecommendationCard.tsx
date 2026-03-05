/**
 * 好物推薦卡片 - 可愛寵物 APP 風格
 * 從商城數據獲取，最多 3 個物品，左右滑動查看
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native';
import { ShoppingBag, Star } from 'lucide-react-native';
import type { Product } from '../../types';
import type { ProductRecommendationCardData } from './types';
import { colors, spacing, borderRadius } from '../../theme/tokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(160, SCREEN_WIDTH * 0.42);
const CARD_GAP = spacing.md;

interface ProductRecommendationCardProps extends ProductRecommendationCardData {
  dark?: boolean;
  onProductPress?: (product: Product) => void;
}

export function ProductRecommendationCard({
  title = '🐾 為你推薦',
  products,
  maxItems = 3,
  dark = false,
  onProductPress,
}: ProductRecommendationCardProps) {
  const items = products.slice(0, maxItems);
  if (items.length === 0) return null;

  const cardBg = dark ? 'rgba(30,41,59,0.6)' : '#fdf6ed';
  const cardBlackBorder = dark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.25)';
  const textColor = dark ? '#f8fafc' : colors.gray[800];
  const subColor = dark ? colors.gray[400] : colors.gray[500];

  return (
    <View style={[styles.wrap, styles.wrapFixed, { backgroundColor: cardBg, borderColor: cardBlackBorder }]}>
      <View style={styles.header}>
        <ShoppingBag size={16} color="#a855f7" />
        <Text style={[styles.title, { color: textColor }]}>{title}</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.horizontalScroll}
        contentContainerStyle={styles.scrollContent}
      >
        {items.map((p) => (
          <Pressable
            key={p.id}
            onPress={() => onProductPress?.(p)}
            style={({ pressed }) => [
              styles.productCard,
              { backgroundColor: dark ? 'rgba(15,23,42,0.5)' : '#fef9f3', borderColor: cardBlackBorder },
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.imageWrap}>
              <Image
                source={{
                  uri: p.imageUrl?.startsWith('http') ? p.imageUrl : 'https://picsum.photos/seed/p/200',
                }}
                style={styles.image}
              />
              {p.tag && (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{p.tag}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.productName, { color: textColor }]} numberOfLines={2}>
              {p.name}
            </Text>
            <View style={styles.metaRow}>
              <View style={styles.ratingRow}>
                <Star size={10} color={colors.orange[500]} fill={colors.orange[500]} />
                <Text style={[styles.ratingText, { color: subColor }]}>{p.rating}</Text>
              </View>
              <Text style={[styles.salesText, { color: subColor }]}>已售 {p.sales}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>HK$</Text>
              <Text style={[styles.priceValue, { color: '#ea580c' }]}>{p.price}</Text>
              {p.originalPrice != null && p.originalPrice > p.price && (
                <Text style={[styles.originalPrice, { color: subColor }]}>${p.originalPrice}</Text>
              )}
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  wrapFixed: {
    maxHeight: 260,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
  },
  horizontalScroll: {
    height: 200,
  },
  scrollContent: {
    gap: CARD_GAP,
    paddingRight: spacing.sm,
    alignItems: 'flex-start'
  },
  productCard: {
    width: CARD_WIDTH,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: 'column',
  },
  pressed: { opacity: 0.85 },
  imageWrap: {
    width: '100%',
    aspectRatio: 1.35,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  tag: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#f97316',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
  },
  productName: {
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    marginTop: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '600',
  },
  salesText: {
    fontSize: 10,
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  priceLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ea580c',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 2,
  },
  originalPrice: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 6,
    textDecorationLine: 'line-through',
  },
});
