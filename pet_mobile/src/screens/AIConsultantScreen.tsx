import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  Platform,
  Dimensions,
  Keyboard,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Send,
  Bot,
  User,
  Loader2,
  History,
  ShoppingBag,
} from 'lucide-react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../navigation/types';
import { ViewHeader } from '../components/shared/CommonUI';
import { useApp } from '../context/AppContext';
import { colors, spacing } from '../theme/tokens';
import { chatWithAIStream } from '../front_api/aiConsultantChat';
import { MessageCardRenderer } from '../components/cards';
import type { MessageCardData } from '../components/cards';
import type { Product } from '../types';
import * as mockApi from '../api/mock';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'AIConsultant'>;

interface Message {
  id: string;
  type: 'AI' | 'USER';
  text: string;
  time: string;
  isStreaming?: boolean;
  /** 可拼接的卡片，支援單張或多張自由組合 */
  card?: MessageCardData;
  cards?: MessageCardData[];
}

const SUGGESTIONS = ['推薦好用的貓砂？', '什麼時候該驅蟲？', '來個寵物冷知識 ✨', '如何挑選糧食？'];

/** 全部卡片測試用數據 */
const CARD_TEST_ITEMS: { label: string; getCard: () => MessageCardData | Promise<MessageCardData> }[] = [
  { label: '好物推薦', getCard: async () => ({ type: 'product_recommendation', products: await mockApi.fetchProducts(undefined, 1, 3), maxItems: 3 }) },
  { label: '用藥風險', getCard: () => ({ type: 'medication_feeding_risk', content: '請遵從獸醫指示用藥，切勿自行增減劑量。若寵物對藥物過敏，請立即停藥並就醫。' }) },
  { label: '緊急警示', getCard: () => ({ type: 'emergency_alert', content: '若寵物出現呼吸困難、抽搐、大量出血等緊急情況，請立即前往獸醫急診！' }) },
  { label: '品種風險', getCard: () => ({ type: 'breed_age_risk', content: '此品種易有髖關節問題，建議控制體重、避免過度跳躍。', petInfo: '柯基犬 · 幼犬' }) },
  { label: 'AI 局限', getCard: () => ({ type: 'ai_limitation', content: '本建議由 AI 生成，僅供參考。AI 可能存在局限性，請結合獸醫專業判斷。' }) },
  { label: '隱私數據', getCard: () => ({ type: 'privacy_data', content: '您的對話數據僅用於改善服務，我們不會外洩或用于營銷。詳見隱私政策。' }) },
  { label: '免責聲明', getCard: () => ({ type: 'disclaimer', content: '本服務僅供參考，不構成獸醫或醫療建議。如寵物出現異常，請及時就醫。' }) },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/** 思考中三點跳動動畫 */
function ThinkingDots() {
  const a = useRef(new Animated.Value(0)).current;
  const b = useRef(new Animated.Value(0)).current;
  const c = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = (v: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(v, { toValue: 1, useNativeDriver: true, duration: 200 }),
          Animated.timing(v, { toValue: 0, useNativeDriver: true, duration: 200 }),
        ])
      );
    const s1 = anim(a, 0);
    const s2 = anim(b, 150);
    const s3 = anim(c, 300);
    s1.start();
    s2.start();
    s3.start();
    return () => {
      s1.stop();
      s2.stop();
      s3.stop();
    };
  }, [a, b, c]);
  const scale = (v: Animated.Value) =>
    v.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.2] });
  return (
    <View style={styles.dots}>
      <Animated.View style={[styles.dot, { backgroundColor: '#a855f7', transform: [{ scale: scale(a) }] }]} />
      <Animated.View style={[styles.dot, { backgroundColor: '#a855f7', transform: [{ scale: scale(b) }] }]} />
      <Animated.View style={[styles.dot, { backgroundColor: '#a855f7', transform: [{ scale: scale(c) }] }]} />
    </View>
  );
}

/** 旋轉的 Loader 圖標（思考中） */
function SpinningLoader({ size = 16, color = '#a855f7' }: { size?: number; color?: string }) {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, useNativeDriver: true, duration: 1000 })
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <Loader2 size={size} color={color} />
    </Animated.View>
  );
}

/** 觸發好物推薦卡片的關鍵詞 */
const PRODUCT_CARD_TRIGGERS = ['好物推薦', '推薦貓糧', '推薦糧食', '貓糧推薦', '狗糧推薦'];

export default function AIConsultantScreen({ navigation }: { navigation: Nav }) {
  const { isDarkMode } = useApp();
  const dark = isDarkMode;
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'AI',
      text: '你好！我是你的 PawPal AI 顧問。無論是健康、飲食還是行為問題，我都在這裡為你解惑喔 ✨',
      time: '現在',
      cards: [
        {
          type: 'ai_limitation',
          content: '本建議由 AI 生成，僅供參考。AI 可能存在局限性，請結合獸醫專業判斷。',
        },
        {
          type: 'disclaimer',
          content: '本服務僅供參考，不構成獸醫或醫療建議。如寵物出現異常，請及時就醫。',
        },
      ],
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const subShow = Keyboard.addListener(showEvent, (e) => setKeyboardHeight(e.endCoordinates.height));
    const subHide = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, []);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, isThinking]);

  const handleSend = (text?: string, attachProductCard?: boolean) => {
    const content = (text ?? inputText).trim();
    if (!content || isThinking) return;

    Keyboard.dismiss();

    const shouldAttachCard = attachProductCard ?? PRODUCT_CARD_TRIGGERS.some((k) => content.includes(k));

    const userMsg: Message = {
      id: Date.now().toString(),
      type: 'USER',
      text: content,
      time: new Date().toLocaleTimeString('zh-Hant', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsThinking(true);

    const aiMsgId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      {
        id: aiMsgId,
        type: 'AI',
        text: '',
        time: new Date().toLocaleTimeString('zh-Hant', { hour: '2-digit', minute: '2-digit' }),
        isStreaming: true,
      },
    ]);

    const buildHistory = (list: Message[]) => {
      return list
        .filter((m) => m.type === 'USER' || m.type === 'AI')
        .slice(-10)
        .map((m) => ({
          role: (m.type === 'USER' ? 'user' : 'model') as 'user' | 'model',
          text: m.text,
        }));
    };

    (async () => {
      try {
        const history = buildHistory(messages);
        let fullText = '';
        const stream = chatWithAIStream(content, history, '毛孩子');
        for await (const chunk of stream) {
          fullText += chunk;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiMsgId ? { ...m, text: fullText, isStreaming: true } : m
            )
          );
        }

        let card: MessageCardData | undefined;
        if (shouldAttachCard) {
          const products = await mockApi.fetchProducts(undefined, 1, 3);
          if (products.length > 0) {
            card = { type: 'product_recommendation', products, maxItems: 3 };
          }
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId
              ? { ...m, text: fullText || '（無回覆）', isStreaming: false, card }
              : m
          )
        );
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : '連線異常，請稍後再試';
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId ? { ...m, text: `⚠️ ${errMsg}`, isStreaming: false } : m
          )
        );
      } finally {
        setIsThinking(false);
      }
    })();
  };

  const handleProductPress = (product: Product) => {
    navigation.navigate('ProductDetail', { productId: product.id });
  };

  const handleTestCard = async (item: (typeof CARD_TEST_ITEMS)[0]) => {
    const card = await Promise.resolve(item.getCard());
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        type: 'AI',
        text: `[卡片測試] ${item.label}`,
        time: new Date().toLocaleTimeString('zh-Hant', { hour: '2-digit', minute: '2-digit' }),
        card,
      },
    ]);
  };

  const textColor = dark ? '#f8fafc' : colors.gray[800];
  const subColor = dark ? colors.gray[400] : colors.gray[500];
  const bubbleUser = '#6366f1';
  const bubbleBlackBorder = dark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.25)';
  const bubbleAiBg = dark ? 'rgba(30,41,59,0.85)' : '#fdf6ed';
  const bubbleAiBorder = bubbleBlackBorder;

  return (
    <View style={[styles.container, { backgroundColor: dark ? colors.slate[950] : '#fafafa', paddingTop: insets.top }]}>
      <ViewHeader
        title="AI 萌寵顧問"
        onBack={() => navigation.goBack()}
        rightElement={
          <View style={styles.headerRight}>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={[styles.statusText, { color: '#059669' }]}>在線實時諮詢</Text>
            </View>
            <Pressable
              onPress={() => {}}
              style={[styles.historyBtn, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}
            >
              <History size={20} color="#a855f7" />
            </Pressable>
          </View>
        }
      />

      <View style={styles.keyboard}>
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[styles.msgRow, msg.type === 'USER' ? styles.msgRowUser : styles.msgRowAi]}
            >
              <View style={[styles.msgAvatar, msg.type === 'AI' ? styles.msgAvatarAi : styles.msgAvatarUser]}>
                {msg.type === 'AI' ? <Bot size={20} color="#fff" /> : <User size={20} color="#a855f7" />}
              </View>
              <View style={[styles.msgBubbleWrap, msg.type === 'USER' && styles.msgBubbleWrapUser]}>
                {(msg.text || msg.isStreaming) && (
                  <View
                    style={[
                      styles.msgBubble,
                      msg.type === 'USER'
                        ? { backgroundColor: bubbleUser, borderColor: bubbleBlackBorder }
                        : { backgroundColor: bubbleAiBg, borderColor: bubbleAiBorder },
                    ]}
                  >
                    {msg.isStreaming ? (
                      <ThinkingDots />
                    ) : (
                      <Text style={[styles.msgText, msg.type === 'USER' ? styles.msgTextUser : { color: textColor }]}>{msg.text}</Text>
                    )}
                  </View>
                )}
                {!msg.isStreaming && msg.type === 'AI' && (() => {
                  const cards = msg.cards ?? (msg.card ? [msg.card] : []);
                  if (cards.length === 0) return null;
                  return (
                    <>
                      {cards.map((c, i) => (
                        <MessageCardRenderer
                          key={i}
                          card={c}
                          dark={dark}
                          onProductPress={handleProductPress}
                        />
                      ))}
                    </>
                  );
                })()}
                <Text style={[styles.msgTime, { color: subColor }]}>{msg.time}</Text>
              </View>
            </View>
          ))}
          {isThinking && !messages.some((m) => m.isStreaming) && (
            <View style={[styles.msgRow, styles.msgRowAi]}>
              <View style={[styles.msgAvatar, styles.msgAvatarAi]}>
                <Bot size={20} color="#fff" />
              </View>
              <View style={[styles.msgBubble, styles.thinkingBubble, { backgroundColor: bubbleAiBg, borderColor: bubbleAiBorder }]}>
                <SpinningLoader size={16} color="#a855f7" />
                <Text style={[styles.thinkingText, { color: subColor }]}>正在為你查閱寵物百科...</Text>
              </View>
            </View>
          )}
          <View style={{ height: 24 }} />
        </ScrollView>

        <View
          style={[
            styles.footer,
            {
              backgroundColor: dark ? 'rgba(15,23,42,0.98)' : 'rgba(255,255,255,0.98)',
              borderTopColor: bubbleAiBorder,
              bottom: keyboardHeight,
              paddingBottom: keyboardHeight > 0 ? spacing.sm : Math.max(insets.bottom, spacing.md),
            },
          ]}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestRow} contentContainerStyle={styles.suggestRowContent}>
            <Pressable
              onPress={() => handleSend('推薦貓糧', true)}
              style={[styles.suggestChip, { backgroundColor: 'rgba(249, 115, 22, 0.1)', borderColor: 'rgba(249, 115, 22, 0.2)' }]}
            >
              <ShoppingBag size={12} color={colors.orange[600]} />
              <Text style={[styles.suggestChipText, { color: colors.orange[600] }]}>好物推薦</Text>
            </Pressable>
            {SUGGESTIONS.map((s, i) => (
              <Pressable
                key={i}
                onPress={() => handleSend(s)}
                style={[styles.suggestChip, { backgroundColor: bubbleAiBg, borderColor: bubbleAiBorder }]}
              >
                <Text style={[styles.suggestChipText, { color: textColor }]}>{s}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cardTestRow} contentContainerStyle={styles.cardTestRowContent}>
            {CARD_TEST_ITEMS.map((item, i) => (
              <Pressable
                key={i}
                onPress={() => handleTestCard(item)}
                style={[styles.cardTestChip, { backgroundColor: 'rgba(124, 58, 237, 0.15)', borderColor: 'rgba(124, 58, 237, 0.3)' }]}
              >
                <Text style={[styles.cardTestChipText, { color: '#7c3aed' }]}>{item.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <View style={[styles.inputRow, { backgroundColor: dark ? colors.slate[800] : '#f5f5f7', borderColor: bubbleAiBorder }]}>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="問問主子的健康或飲食..."
              placeholderTextColor={subColor}
              style={[styles.input, { color: textColor }]}
              onSubmitEditing={() => handleSend()}
              returnKeyType="send"
            />
            <Pressable
              onPress={() => handleSend()}
              disabled={!inputText.trim() || isThinking}
              style={[
                styles.sendBtn,
                { backgroundColor: inputText.trim() ? '#7c3aed' : (dark ? colors.slate[800] : colors.gray[500]) },
              ]}
            >
              {isThinking ? <SpinningLoader size={18} color="#fff" /> : <Send size={18} color="#fff" />}
            </Pressable>
          </View>
          {keyboardHeight === 0 && (
            <Text style={[styles.footerHint, { color: subColor }]}>PawPal AI 顧問 · 專業賦能健康每一天</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  historyBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  statusText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  keyboard: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 200,
    paddingTop: spacing.lg,
    maxWidth: SCREEN_WIDTH,
    flexGrow: 0,
  },
  msgRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.xl, gap: 8 },
  msgRowAi: { marginLeft: -spacing.md },
  msgRowUser: { flexDirection: 'row-reverse', marginRight: -spacing.md },
  msgAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  msgAvatarAi: { backgroundColor: '#7c3aed' },
  msgAvatarUser: { backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(168, 85, 247, 0.2)' },
  msgBubbleWrap: { flex: 1, minWidth: 0, alignItems: 'flex-start', maxWidth: SCREEN_WIDTH * 0.78 },
  msgBubbleWrapUser: { alignItems: 'flex-end' },
  msgBubble: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 2,
    maxWidth: '100%',
  },
  thinkingBubble: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  msgText: { fontSize: 15, fontWeight: '500', lineHeight: 23, color: '#fff' },
  msgTextUser: { color: '#fff' },
  msgTime: { fontSize: 11, fontWeight: '600', marginTop: 6, letterSpacing: 0.3 },
  dots: { flexDirection: 'row', gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  thinkingText: { fontSize: 13, fontWeight: '600', marginLeft: 0 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  suggestRow: { marginBottom: spacing.sm },
  suggestRowContent: { paddingRight: spacing.lg },
  cardTestRow: { marginBottom: spacing.md },
  cardTestRowContent: { paddingRight: spacing.lg },
  cardTestChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    marginRight: 8,
  },
  cardTestChipText: { fontSize: 11, fontWeight: '700' },
  suggestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 10,
  },
  suggestChipText: { fontSize: 12, fontWeight: '600' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 40,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 10 : 12,
    fontSize: 15,
    fontWeight: '500',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerHint: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: spacing.md,
    letterSpacing: 1,
  },
});
