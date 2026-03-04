import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import {
  ChevronLeft,
  Trash2,
  Plus,
  Minus,
  CheckCircle,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Apple,
  Chrome,
  XCircle,
  CheckCircle2,
  MapPin,
  PlusCircle,
} from 'lucide-react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { DiscoveryStackParamList } from '../navigation/types';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '../navigation/types';
import type { CartItem, Address } from '../types';
import * as mockApi from '../api/mock';
import { url_base } from '../types';
import { useApp } from '../context/AppContext';
import { colors, borderRadius, spacing } from '../theme/tokens';

type PaymentStatus = 'IDLE' | 'PROCESSING' | 'SUCCESS' | 'FAILED';

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<DiscoveryStackParamList, 'Cart'>,
  BottomTabNavigationProp<MainTabParamList>
>;

const IMAGE_PLACEHOLDER = 'https://picsum.photos/seed/placeholder/200';

function imageUri(path: string): string {
  const s = (path ?? '').trim();
  if (s === '') return IMAGE_PLACEHOLDER;
  return s.startsWith('http') ? s : `${url_base}${s}`;
}

export default function CartScreen({ navigation }: { navigation: Nav }) {
  const { isDarkMode } = useApp();
  const dark = isDarkMode;

  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [showAddressPicker, setShowAddressPicker] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('IDLE');
  const [selectedMethod, setSelectedMethod] = useState<'APPLE' | 'GOOGLE' | 'CARD'>('APPLE');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [cartData, addrData] = await Promise.all([
        mockApi.fetchCart(),
        mockApi.fetchAddresses(),
      ]);
      setItems(cartData);
      setAddresses(addrData);
      const defaultAddr = addrData.find((a) => a.isDefault) ?? addrData[0];
      setSelectedAddress(defaultAddr ?? null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateQuantity = async (id: string, delta: number) => {
    const newItems = [...items];
    const item = newItems.find((i) => i.id === id);
    if (item) {
      item.quantity = Math.max(1, item.quantity + delta);
      setItems(newItems);
      await mockApi.updateCartItem(id, { quantity: item.quantity });
    }
  };

  const toggleSelect = async (id: string) => {
    const newItems = [...items];
    const item = newItems.find((i) => i.id === id);
    if (item) {
      item.selected = !item.selected;
      setItems(newItems);
      await mockApi.updateCartItem(id, { selected: item.selected });
    }
  };

  const toggleSelectAll = () => {
    const allSelected = items.every((i) => i.selected);
    const next = items.map((i) => ({ ...i, selected: !allSelected }));
    setItems(next);
    next.forEach((i) => mockApi.updateCartItem(i.id, { selected: i.selected }));
  };

  const removeItem = async (id: string) => {
    const ok = await mockApi.removeFromCart(id);
    if (ok) setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const totalPrice = useMemo(
    () => items.filter((i) => i.selected).reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );
  const selectedCount = useMemo(() => items.filter((i) => i.selected).length, [items]);

  const handleStartCheckout = () => {
    if (selectedCount === 0) return;
    setShowCheckout(true);
  };

  const goToOrders = (initialTab?: string) => {
    setShowCheckout(false);
    (navigation.getParent() as any)?.getParent()?.navigate('ProfileTab', {
      screen: 'Orders',
      params: initialTab ? { initialTab } : undefined,
    });
  };

  const goToAddress = () => {
    setShowCheckout(false);
    (navigation.getParent() as any)?.getParent()?.navigate('ProfileTab', { screen: 'Address' });
  };

  const goToDiscovery = () => {
    navigation.navigate('Discovery');
  };

  const handleConfirmPayment = async () => {
    setPaymentStatus('PROCESSING');
    const selectedItems = items.filter((i) => i.selected);
    if (selectedItems.length === 0) {
      Alert.alert('提示', '请选择商品');
      setPaymentStatus('IDLE');
      return;
    }
    if (!selectedAddress) {
      Alert.alert('提示', '请选择收货地址');
      setPaymentStatus('IDLE');
      return;
    }
    let orderId: string | null = null;
    try {
      orderId = await mockApi.createOrderFromCart(selectedItems, selectedAddress.id);
      if (!orderId) {
        Alert.alert('提示', '创建订单失败，请稍后再试');
        setPaymentStatus('IDLE');
        return;
      }
      await mockApi.clearSelectedCartItems();
      setItems((prev) => prev.filter((i) => !i.selected));
      await new Promise((r) => setTimeout(r, 2000));
      const isSuccess = Math.random() > 0.1;
      if (isSuccess) {
        await mockApi.updateOrderStatus(orderId, 'PENDING_SHIP');
        setPaymentStatus('SUCCESS');
        setTimeout(() => goToOrders('PENDING_SHIP'), 1500);
      } else {
        setPaymentStatus('FAILED');
        setTimeout(() => {
          setShowCheckout(false);
          goToOrders('PENDING_PAY');
        }, 1500);
      }
    } catch {
      setPaymentStatus('FAILED');
      Alert.alert('提示', '下单失败，请重试');
    }
  };

  const methodOptions = [
    { id: 'APPLE' as const, label: 'Apple Pay', Icon: Apple },
    { id: 'GOOGLE' as const, label: 'Google Pay', Icon: Chrome },
    { id: 'CARD' as const, label: 'Credit Card', Icon: CreditCard },
  ];

  const bg = dark ? '#0f172a' : '#f8fafc';
  const cardBg = dark ? 'rgba(30,41,59,0.9)' : 'rgba(255,255,255,0.85)';
  const borderColor = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const textPrimary = dark ? '#f8fafc' : '#1f2937';
  const textSecondary = dark ? '#94a3b8' : '#6b7280';

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: borderColor }]}>
        <View style={styles.headerLeft}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.headerBack, pressed && styles.pressed]}
          >
            <ChevronLeft size={22} color={dark ? '#f8fafc' : colors.gray[600]} />
          </Pressable>
          <View>
            <Text style={[styles.headerTitle, { color: textPrimary }]}>我的購物籃</Text>
            <Text style={styles.headerSub}>共 {items.length} 件商品</Text>
          </View>
        </View>
        <Pressable onPress={toggleSelectAll}>
          <Text style={[styles.headerSelectAll, { color: textSecondary }]}>全選/取消</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.emptyWrap}>
            <ActivityIndicator size="large" color={colors.orange[500]} />
            <Text style={[styles.emptyText, { color: textSecondary }]}>正在整理您的購物籃...</Text>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={[styles.emptyIconWrap, dark && styles.emptyIconWrapDark]}>
              <ShoppingBag size={40} color={colors.orange[500]} />
            </View>
            <Text style={[styles.emptyText, { color: textSecondary }]}>購物籃還是空的喔</Text>
            <Pressable onPress={goToDiscovery} style={styles.goShopBtn}>
              <Text style={styles.goShopBtnText}>去逛逛</Text>
            </Pressable>
          </View>
        ) : (
          items.map((item) => (
            <View key={item.id} style={[styles.itemCard, { backgroundColor: cardBg, borderColor }]}>
              <Pressable
                onPress={() => toggleSelect(item.id)}
                style={[
                  styles.checkbox,
                  item.selected ? styles.checkboxSelected : styles.checkboxUnselected,
                ]}
              >
                {item.selected && <CheckCircle size={14} color="#fff" />}
              </Pressable>
              <Image
                source={{ uri: imageUri(item.imageUrl) }}
                style={styles.itemImage}
                resizeMode="cover"
              />
              <View style={styles.itemBody}>
                <Text style={[styles.itemName, { color: textPrimary }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <View style={styles.itemRow}>
                  <Text style={styles.itemPrice}>HK$ {item.price}</Text>
                  <View style={[styles.quantityWrap, dark && styles.quantityWrapDark]}>
                    <Pressable onPress={() => updateQuantity(item.id, -1)} style={styles.quantityBtn}>
                      <Minus size={14} color={textSecondary} />
                    </Pressable>
                    <Text style={[styles.quantityText, { color: textPrimary }]}>{item.quantity}</Text>
                    <Pressable onPress={() => updateQuantity(item.id, 1)} style={styles.quantityBtn}>
                      <Plus size={14} color={textSecondary} />
                    </Pressable>
                  </View>
                </View>
              </View>
              <Pressable onPress={() => removeItem(item.id)} style={styles.deleteBtn}>
                <Trash2 size={16} color="#fda4af" />
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>

      {/* Footer */}
      {items.length > 0 && (
        <View style={[styles.footer, { backgroundColor: cardBg, borderTopColor: borderColor }]}>
          <View style={styles.footerRow}>
            <Text style={[styles.footerSelected, { color: textSecondary }]}>已選 {selectedCount} 件</Text>
            <View style={styles.footerTotal}>
              <Text style={[styles.footerTotalLabel, { color: textSecondary }]}>Total HK$</Text>
              <Text style={styles.footerTotalValue}>{totalPrice.toFixed(1)}</Text>
            </View>
          </View>
          <Pressable
            onPress={handleStartCheckout}
            disabled={selectedCount === 0}
            style={({ pressed }) => [
              styles.checkoutBtn,
              selectedCount === 0 && styles.checkoutBtnDisabled,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.checkoutBtnText}>立即結賬 ({selectedCount})</Text>
            <ArrowRight size={18} color="#fff" />
          </Pressable>
        </View>
      )}

      {/* Checkout Modal */}
      <Modal
        visible={showCheckout}
        transparent
        animationType="slide"
        onRequestClose={() => paymentStatus === 'IDLE' && setShowCheckout(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => paymentStatus === 'IDLE' && setShowCheckout(false)}
          />
          <View style={[styles.modalContent, dark && styles.modalContentDark]}>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
              {paymentStatus === 'IDLE' && (
                <>
                  <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: textPrimary }]}>PawPal 結賬收銀台</Text>
                    <Pressable
                      onPress={() => {
                        setShowCheckout(false);
                        setShowAddressPicker(false);
                      }}
                    >
                      <XCircle size={24} color={textSecondary} />
                    </Pressable>
                  </View>

                  {/* 地址 */}
                  <View style={[styles.addressBlock, dark && styles.addressBlockDark]}>
                    <View style={styles.addressBlockHeader}>
                      <Text style={[styles.addressBlockLabel, { color: textSecondary }]}>
                        <MapPin size={12} color={colors.orange[500]} style={{ marginRight: 4 }} />
                        收貨地址
                      </Text>
                      <Pressable
                        onPress={() => setShowAddressPicker(!showAddressPicker)}
                        style={styles.addressToggle}
                      >
                        <Text style={styles.addressToggleText}>
                          {showAddressPicker ? '取消切換' : selectedAddress ? '修改' : '去添加'}
                        </Text>
                      </Pressable>
                    </View>
                    {!showAddressPicker ? (
                      selectedAddress ? (
                        <View style={styles.addressDisplay}>
                          <Text style={[styles.addressName, { color: textPrimary }]}>
                            {selectedAddress.receiverName} · {selectedAddress.phone}
                          </Text>
                          <Text style={[styles.addressDetail, { color: textSecondary }]} numberOfLines={1}>
                            {selectedAddress.area} {selectedAddress.detail}
                          </Text>
                        </View>
                      ) : (
                        <Pressable onPress={goToAddress} style={[styles.addAddressBtn, { borderColor }]}>
                          <PlusCircle size={24} color={textSecondary} />
                          <Text style={[styles.addAddressText, { color: textSecondary }]}>點擊添加收貨地址</Text>
                        </Pressable>
                      )
                    ) : (
                      <View style={styles.addressList}>
                        {addresses.length === 0 ? (
                          <Text style={[styles.addressEmpty, { color: textSecondary }]}>
                            尚未保存地址，請前往管理頁面添加
                          </Text>
                        ) : (
                          addresses.map((addr) => (
                            <Pressable
                              key={addr.id}
                              onPress={() => {
                                setSelectedAddress(addr);
                                setShowAddressPicker(false);
                              }}
                              style={[
                                styles.addressItem,
                                selectedAddress?.id === addr.id && styles.addressItemSelected,
                                { borderColor },
                              ]}
                            >
                              <Text style={[styles.addressItemName, { color: textPrimary }]}>
                                {addr.receiverName} · {addr.phone}
                              </Text>
                              {selectedAddress?.id === addr.id && (
                                <CheckCircle2 size={16} color={colors.orange[500]} />
                              )}
                              <Text style={[styles.addressItemDetail, { color: textSecondary }]} numberOfLines={1}>
                                {addr.area} {addr.detail}
                              </Text>
                            </Pressable>
                          ))
                        )}
                        <Pressable onPress={goToAddress} style={styles.manageAddressBtn}>
                          <Plus size={14} color="#2563eb" />
                          <Text style={styles.manageAddressText}>管理我的地址</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>

                  {/* 支付金額 */}
                  <View style={[styles.amountBlock, dark && styles.amountBlockDark]}>
                    <View style={styles.amountRow}>
                      <Text style={[styles.amountLabel, { color: textSecondary }]}>支付金額</Text>
                      <Text style={[styles.amountLabel, { color: textSecondary }]}>訂單合計</Text>
                    </View>
                    <View style={styles.amountValue}>
                      <Text style={styles.amountCurrency}>HK$</Text>
                      <Text style={styles.amountNumber}>{totalPrice.toFixed(1)}</Text>
                    </View>
                    <View style={styles.amountSecure}>
                      <ShieldCheck size={14} color="#059669" />
                      <Text style={styles.amountSecureText}>銀行級安全加密支付協議</Text>
                    </View>
                  </View>

                  {/* 支付方式 */}
                  <View style={styles.methodsBlock}>
                    <Text style={[styles.methodsLabel, { color: textSecondary }]}>選擇支付方式</Text>
                    {methodOptions.map((m) => {
                      const isSelected = selectedMethod === m.id;
                      return (
                        <Pressable
                          key={m.id}
                          onPress={() => setSelectedMethod(m.id)}
                          style={[
                            styles.methodItem,
                            isSelected && styles.methodItemSelected,
                            { borderColor },
                          ]}
                        >
                          <View style={styles.methodLeft}>
                            <View
                              style={[
                                styles.methodIconWrap,
                                isSelected && styles.methodIconWrapSelected,
                              ]}
                            >
                              <m.Icon size={20} color={isSelected ? '#fff' : textSecondary} />
                            </View>
                            <Text
                              style={[
                                styles.methodLabel,
                                { color: isSelected ? colors.orange[600] : textSecondary },
                              ]}
                            >
                              {m.label}
                            </Text>
                          </View>
                          {isSelected && (
                            <CheckCircle2 size={20} color={colors.orange[500]} />
                          )}
                        </Pressable>
                      );
                    })}
                  </View>

                  <Pressable onPress={handleConfirmPayment} style={styles.confirmPayBtn}>
                    <CreditCard size={20} color="#fff" />
                    <Text style={styles.confirmPayText}>確認支付 HK$ {totalPrice.toFixed(1)}</Text>
                  </Pressable>
                </>
              )}

              {paymentStatus === 'PROCESSING' && (
                <View style={styles.statusWrap}>
                  <View style={styles.spinnerWrap}>
                    <ActivityIndicator size="large" color={colors.orange[500]} />
                  </View>
                  <Text style={[styles.statusTitle, { color: textPrimary }]}>正在處理支付請求</Text>
                  <Text style={[styles.statusSub, { color: textSecondary }]}>
                    正在驗證銀行網關數據，請勿關閉...
                  </Text>
                </View>
              )}

              {paymentStatus === 'SUCCESS' && (
                <View style={styles.statusWrap}>
                  <View style={styles.successIcon}>
                    <CheckCircle2 size={40} color="#fff" />
                  </View>
                  <Text style={styles.successTitle}>支付成功！</Text>
                  <Text style={[styles.successSub, { color: textSecondary }]}>
                    訂單已生效，我們將儘快為您發貨
                  </Text>
                  <Text style={[styles.successHint, { color: textSecondary }]}>即將進入訂單中心...</Text>
                </View>
              )}

              {paymentStatus === 'FAILED' && (
                <View style={styles.statusWrap}>
                  <View style={styles.failIcon}>
                    <XCircle size={40} color="#fff" />
                  </View>
                  <Text style={styles.failTitle}>支付未完成</Text>
                  <Text style={[styles.failSub, { color: textSecondary }]}>
                    餘額不足或網絡超時，該訂單已保存至「待付款」列表
                  </Text>
                  <View style={styles.failActions}>
                    <Pressable onPress={() => setPaymentStatus('IDLE')} style={styles.failBtn}>
                      <Text style={[styles.failBtnText, { color: textSecondary }]}>重新支付</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => goToOrders('PENDING_PAY')}
                      style={[styles.failBtn, styles.failBtnPrimary]}
                    >
                      <Text style={styles.failBtnPrimaryText}>查看訂單</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pressed: { opacity: 0.95, transform: [{ scale: 0.98 }] },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  headerBack: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  headerSub: { fontSize: 10, fontWeight: '800', color: colors.orange[500], letterSpacing: 2 },
  headerSelectAll: { fontSize: 10, fontWeight: '800', letterSpacing: 2 },

  scroll: { flex: 1 },
  scrollContent: { padding: spacing.xl, paddingBottom: 120 },

  emptyWrap: { paddingVertical: 80, alignItems: 'center', justifyContent: 'center' },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 32, backgroundColor: 'rgba(249,115,22,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl },
  emptyIconWrapDark: { backgroundColor: 'rgba(249,115,22,0.2)' },
  emptyText: { fontSize: 14, fontWeight: '800', marginBottom: spacing.xl },
  goShopBtn: { backgroundColor: colors.orange[500], paddingHorizontal: spacing['2xl'], paddingVertical: 12, borderRadius: borderRadius['2xl'] },
  goShopBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },

  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: 32,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginRight: spacing.lg,
  },
  checkboxSelected: { backgroundColor: colors.orange[500], borderColor: colors.orange[500] },
  checkboxUnselected: { borderColor: colors.gray[400] },
  itemImage: { width: 80, height: 80, borderRadius: borderRadius['2xl'], marginRight: spacing.lg },
  itemBody: { flex: 1, minWidth: 0 },
  itemName: { fontSize: 12, fontWeight: '800', marginBottom: 8 },
  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemPrice: { fontSize: 14, fontWeight: '800', color: colors.orange[600] },
  quantityWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.04)', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' },
  quantityWrapDark: { backgroundColor: 'rgba(30,41,59,0.6)', borderColor: 'rgba(255,255,255,0.05)' },
  quantityBtn: { padding: 4 },
  quantityText: { marginHorizontal: 12, fontSize: 12, fontWeight: '800' },
  deleteBtn: { padding: 8 },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    paddingBottom: spacing['2xl'],
    borderTopWidth: 1,
  },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  footerSelected: { fontSize: 12, fontWeight: '700' },
  footerTotal: { alignItems: 'flex-end' },
  footerTotalLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  footerTotalValue: { fontSize: 24, fontWeight: '800', color: colors.orange[600] },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.orange[600],
    paddingVertical: 16,
    borderRadius: 24,
    shadowColor: colors.orange[600],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  checkoutBtnDisabled: { opacity: 0.5 },
  checkoutBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 48,
    borderTopRightRadius: 48,
    maxHeight: '95%',
    paddingBottom: 48,
  },
  modalContentDark: { backgroundColor: '#0f172a' },
  modalScroll: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xl },
  modalTitle: { fontSize: 20, fontWeight: '800' },

  addressBlock: { backgroundColor: 'rgba(0,0,0,0.03)', padding: spacing.xl, borderRadius: 32, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', marginBottom: spacing.xl },
  addressBlockDark: { backgroundColor: 'rgba(30,41,59,0.5)', borderColor: 'rgba(255,255,255,0.05)' },
  addressBlockHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  addressBlockLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  addressToggle: { backgroundColor: 'rgba(249,115,22,0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(249,115,22,0.2)' },
  addressToggleText: { fontSize: 10, fontWeight: '800', color: colors.orange[600] },
  addressDisplay: {},
  addressName: { fontSize: 12, fontWeight: '800', marginBottom: 4 },
  addressDetail: { fontSize: 12, fontWeight: '700' },
  addAddressBtn: { paddingVertical: spacing.xl, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderStyle: 'dashed', borderRadius: borderRadius['2xl'] },
  addAddressText: { fontSize: 12, fontWeight: '800', marginTop: 8 },
  addressList: { gap: 12 },
  addressEmpty: { textAlign: 'center', paddingVertical: spacing.lg, fontSize: 12, fontStyle: 'italic' },
  addressItem: { padding: spacing.lg, borderRadius: borderRadius['2xl'], borderWidth: 2, marginBottom: 8 },
  addressItemSelected: { borderColor: colors.orange[500], backgroundColor: 'rgba(249,115,22,0.05)' },
  addressItemName: { fontSize: 12, fontWeight: '800', marginBottom: 4 },
  addressItemDetail: { fontSize: 10, fontWeight: '700' },
  manageAddressBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, backgroundColor: 'rgba(37,99,235,0.1)', borderRadius: 12, marginTop: 8 },
  manageAddressText: { fontSize: 12, fontWeight: '800', color: '#2563eb' },

  amountBlock: { backgroundColor: 'rgba(0,0,0,0.03)', padding: spacing.xl, borderRadius: 32, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', marginBottom: spacing.xl },
  amountBlockDark: { backgroundColor: 'rgba(30,41,59,0.5)', borderColor: 'rgba(255,255,255,0.05)' },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  amountLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  amountValue: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: 8 },
  amountCurrency: { fontSize: 18, fontWeight: '800', color: colors.orange[600] },
  amountNumber: { fontSize: 36, fontWeight: '800', color: colors.orange[600] },
  amountSecure: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  amountSecureText: { fontSize: 10, fontWeight: '800', color: '#059669', letterSpacing: 1 },

  methodsBlock: { marginBottom: spacing.xl },
  methodsLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: spacing.sm },
  methodItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, borderRadius: borderRadius['2xl'], borderWidth: 2, marginBottom: 8, backgroundColor: 'rgba(0,0,0,0.02)' },
  methodItemSelected: { borderColor: colors.orange[500], backgroundColor: 'rgba(249,115,22,0.08)' },
  methodLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  methodIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.06)', alignItems: 'center', justifyContent: 'center' },
  methodIconWrapSelected: { backgroundColor: colors.orange[500] },
  methodLabel: { fontSize: 14, fontWeight: '800' },

  confirmPayBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, height: 64, backgroundColor: '#1e293b', borderRadius: 24, marginBottom: 24 },
  confirmPayText: { color: '#fff', fontWeight: '800', fontSize: 16 },

  statusWrap: { paddingVertical: 48, alignItems: 'center' },
  spinnerWrap: { marginBottom: spacing.xl },
  statusTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  statusSub: { fontSize: 10, fontWeight: '700', letterSpacing: 2 },
  successIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl },
  successTitle: { fontSize: 20, fontWeight: '800', color: '#10b981', marginBottom: 8 },
  successSub: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  successHint: { fontSize: 10, letterSpacing: 2 },
  failIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f43f5e', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl },
  failTitle: { fontSize: 20, fontWeight: '800', color: '#f43f5e', marginBottom: 8 },
  failSub: { fontSize: 14, fontWeight: '700', marginBottom: spacing.xl, textAlign: 'center' },
  failActions: { flexDirection: 'row', gap: 12, width: '100%' },
  failBtn: { flex: 1, paddingVertical: 16, borderRadius: borderRadius['2xl'], backgroundColor: 'rgba(0,0,0,0.06)', alignItems: 'center', justifyContent: 'center' },
  failBtnPrimary: { backgroundColor: '#1e293b' },
  failBtnText: { fontSize: 12, fontWeight: '800' },
  failBtnPrimaryText: { color: '#fff', fontSize: 12, fontWeight: '800' },
});
