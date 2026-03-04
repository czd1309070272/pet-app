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
  MessageSquareText,
  Loader2,
  History,
  ShoppingBag,
} from 'lucide-react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../navigation/types';
import { ViewHeader } from '../components/shared/CommonUI';
import { useApp } from '../context/AppContext';
import { colors, borderRadius, spacing } from '../theme/tokens';
import { chatWithAIStream } from '../front_api/aiConsultantChat';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'AIConsultant'>;

interface Message {
  id: string;
  type: 'AI' | 'USER';
  text: string;
  time: string;
  isStreaming?: boolean;
}

const SUGGESTIONS = ['推薦好用的貓砂？', '什麼時候該驅蟲？', '來個寵物冷知識 ✨', '如何挑選糧食？'];

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

  const handleSend = (text?: string) => {
    const content = (text ?? inputText).trim();
    if (!content || isThinking) return;

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

    // 構建歷史記錄（最近若干條，供後端上下文）
    const buildHistory = (list: Message[]) => {
      const items = list
        .filter((m) => m.type === 'USER' || m.type === 'AI')
        .slice(-10)
        .map((m) => ({
          role: (m.type === 'USER' ? 'user' : 'model') as 'user' | 'model',
          text: m.text,
        }));
      return items;
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
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId ? { ...m, text: fullText || '（無回覆）', isStreaming: false } : m
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

  const textColor = dark ? '#f8fafc' : colors.gray[800];
  const subColor = dark ? colors.gray[400] : colors.gray[500];
  const bubbleUser = '#6366f1';
  const bubbleAiBg = dark ? 'rgba(30,41,59,0.85)' : 'rgba(255,255,255,0.9)';
  const bubbleAiBorder = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

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
              style={[styles.msgRow, msg.type === 'USER' && styles.msgRowUser]}
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
                        ? { backgroundColor: bubbleUser }
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
                <Text style={[styles.msgTime, { color: subColor }]}>{msg.time}</Text>
              </View>
            </View>
          ))}
          {isThinking && !messages.some((m) => m.isStreaming) && (
            <View style={styles.msgRow}>
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
              onPress={() => handleSend('推薦貓糧')}
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
  },
  msgRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.xl, gap: 14 },
  msgRowUser: { flexDirection: 'row-reverse' },
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
    borderWidth: 1,
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
  suggestRow: { marginBottom: spacing.md },
  suggestRowContent: { paddingRight: spacing.lg },
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
