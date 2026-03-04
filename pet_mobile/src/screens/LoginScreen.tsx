import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
} from 'react-native';
import { Heart, Mail, Lock, ArrowRight, Loader2, User, KeyRound } from 'lucide-react-native';
import * as authApi from '../front_api';
import type { UserInfo } from '../types';
import { colors, borderRadius, spacing } from '../theme/tokens';

type Mode = 'LOGIN' | 'REGISTER' | 'FORGOT';

export default function LoginScreen({
  onLoginSuccess,
}: {
  onLoginSuccess: (user: UserInfo) => void;
}) {
  const [mode, setMode] = useState<Mode>('LOGIN');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [regName, setRegName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [timer, setTimer] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setErrorMessage('');
  }, [mode]);

  useEffect(() => {
    if (isLoading) {
      spinValue.setValue(0);
      const animation = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      animation.start();
      return () => animation.stop();
    }
  }, [isLoading, spinValue]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (codeSent && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [codeSent, timer]);

  const handleSendCode = () => {
    if (!username) {
      Alert.alert('', mode === 'REGISTER' ? '請輸入手機號或郵箱' : '請輸入電子郵箱');
      return;
    }
    setCodeSent(true);
    setTimer(60);
  };

  const isPrimaryDisabled =
    isLoading ||
    (mode === 'LOGIN' && (!username.trim() || !password)) ||
    (mode === 'REGISTER' &&
      (!username.trim() || !regName.trim() || !verifyCode || !password || !confirmPassword)) ||
    (mode === 'FORGOT' && (!username.trim() || !verifyCode || !password || !confirmPassword));

  const handleAction = async () => {
    setIsLoading(true);
    try {
      if (mode === 'LOGIN') {
        const user = await authApi.login(username, password);
        onLoginSuccess(user);
      } else if (mode === 'REGISTER') {
        if (!regName.trim()) {
          Alert.alert('', '請輸入用戶名！');
          setIsLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          Alert.alert('', '密碼不一致，請檢查！');
          setIsLoading(false);
          return;
        }
        if (!verifyCode) {
          Alert.alert('', '請輸入驗證碼！');
          setIsLoading(false);
          return;
        }
        const user = await authApi.register(username, password, 'EMAIL', regName);
        onLoginSuccess(user);
      } else {
        if (!verifyCode) {
          Alert.alert('', '請輸入驗證碼！');
          setIsLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          Alert.alert('', '密碼不一致，請檢查！');
          setIsLoading(false);
          return;
        }
        const ok = await authApi.verifyCode(username, verifyCode);
        if (!ok) {
          Alert.alert('', '驗證碼錯誤，請重試');
          setIsLoading(false);
          return;
        }
        await authApi.resetPassword(username, password);
        Alert.alert('', '密碼已重置');
        setMode('LOGIN');
        setPassword('');
        setConfirmPassword('');
        setVerifyCode('');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : '操作失敗，請重試';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logo}>
          <View style={styles.logoIcon}>
            <Heart size={32} color="#fff" fill="#fff" />
          </View>
          <Text style={styles.title}>PawPal</Text>
          <Text style={styles.subtitle}>萌寵 AI 日記</Text>
        </View>

        {mode === 'LOGIN' && (
          <>
            <TextInput
              style={styles.input}
              placeholder="手機號 / 郵箱"
              placeholderTextColor={colors.gray[400]}
              value={username}
              onChangeText={(t) => { setUsername(t); setErrorMessage(''); }}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              style={styles.input}
              placeholder="密碼"
              placeholderTextColor={colors.gray[400]}
              value={password}
              onChangeText={(t) => { setPassword(t); setErrorMessage(''); }}
              secureTextEntry
            />
          </>
        )}
        {(mode === 'REGISTER' || mode === 'FORGOT') && (
          <>
            <TextInput
              style={styles.input}
              placeholder={mode === 'REGISTER' ? '手機號 / 郵箱' : '電子郵箱'}
              placeholderTextColor={colors.gray[400]}
              value={username}
              onChangeText={(t) => { setUsername(t); setErrorMessage(''); }}
              autoCapitalize="none"
            />
            {mode === 'REGISTER' && (
              <TextInput
                style={styles.input}
                placeholder="用戶名"
                placeholderTextColor={colors.gray[400]}
                value={regName}
                onChangeText={(t) => { setRegName(t); setErrorMessage(''); }}
              />
            )}
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.codeInput]}
                placeholder="驗證碼"
                placeholderTextColor={colors.gray[400]}
                value={verifyCode}
                onChangeText={(t) => { setVerifyCode(t); setErrorMessage(''); }}
                keyboardType="number-pad"
              />
              <Pressable
                onPress={handleSendCode}
                disabled={timer > 0 || !username.trim()}
                style={[
                  styles.codeBtn,
                  (timer > 0 || !username.trim()) && styles.codeBtnDisabled,
                ]}
              >
                <Text style={styles.codeBtnText}>{timer > 0 ? `${timer}s` : '發送驗證碼'}</Text>
              </Pressable>
            </View>
            <TextInput
              style={styles.input}
              placeholder="新密碼"
              placeholderTextColor={colors.gray[400]}
              value={password}
              onChangeText={(t) => { setPassword(t); setErrorMessage(''); }}
              secureTextEntry
            />
            <TextInput
              style={styles.input}
              placeholder="確認密碼"
              placeholderTextColor={colors.gray[400]}
              value={confirmPassword}
              onChangeText={(t) => { setConfirmPassword(t); setErrorMessage(''); }}
              secureTextEntry
            />
          </>
        )}

        <Pressable
          onPress={handleAction}
          disabled={isPrimaryDisabled}
          style={({ pressed }) => [
            styles.primaryBtn,
            pressed && !isPrimaryDisabled && styles.primaryBtnPressed,
            isPrimaryDisabled && styles.primaryBtnDisabled,
          ]}
        >
          {isLoading ? (
            <Animated.View
              style={{
                transform: [
                  {
                    rotate: spinValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
              }}
            >
              <Loader2 size={22} color="#fff" />
            </Animated.View>
          ) : (
            <View style={styles.primaryBtnContent}>
              <Text style={styles.primaryBtnText}>
                {mode === 'LOGIN' ? '登入' : mode === 'REGISTER' ? '註冊' : '重置密碼'}
              </Text>
              <ArrowRight size={20} color="#fff" />
            </View>
          )}
        </Pressable>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        <View style={styles.footer}>
          <Pressable onPress={() => setMode(mode === 'LOGIN' ? 'REGISTER' : 'LOGIN')}>
            <Text style={styles.link}>
              {mode === 'LOGIN' ? '還沒有帳號？註冊' : '返回登入'}
            </Text>
          </Pressable>
          {mode === 'LOGIN' && (
            <Pressable onPress={() => setMode('FORGOT')}>
              <Text style={styles.link}>忘記密碼？</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff9f5',
  },
  scroll: {
    padding: spacing.xl,
    paddingTop: 60,
  },
  logo: {
    alignItems: 'center',
    marginBottom: spacing.xl * 2,
  },
  logoIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.orange[500],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.gray[800],
  },
  subtitle: {
    fontSize: 14,
    color: colors.gray[500],
    marginTop: spacing.xs,
  },
  input: {
    height: 56,
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    borderLeftColor: 'rgba(0,0,0,0.08)',
    borderRightColor: 'rgba(255,255,255,0.85)',
    borderBottomColor: 'rgba(0,0,0,0.12)',
    paddingHorizontal: spacing.lg,
    fontSize: 16,
    marginBottom: spacing.md,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  codeInput: { flex: 1 },
  codeBtn: {
    minWidth: 100,
    height: 56,
    borderRadius: borderRadius['2xl'],
    backgroundColor: colors.orange[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeBtnDisabled: { opacity: 0.5 },
  codeBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  primaryBtn: {
    height: 56,
    borderRadius: borderRadius['2xl'],
    backgroundColor: colors.orange[500],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  primaryBtnPressed: { opacity: 0.9 },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnContent: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  link: {
    color: colors.orange[500],
    fontSize: 14,
    fontWeight: '700',
  },
});
