import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle, Modal } from 'react-native';
import { ChevronLeft, X, ArrowRight } from 'lucide-react-native';
import { getErrorDetail } from '../../constants/errorConfig';
import { colors, borderRadius, spacing } from '../../theme/tokens';
import { useApp } from '../../context/AppContext';

export const GlassCard: React.FC<{
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}> = ({ children, style, onPress }) => {
  const dark = useApp().isDarkMode;
  const content = (
    <View
      style={[
        styles.glassCard,
        {
          backgroundColor: dark ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.7)',
          borderColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.45)',
        },
      ]}
    >
      {children}
    </View>
  );
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={[styles.glassCardWrap, style]}>
        {content}
      </Pressable>
    );
  }
  return <View style={[styles.glassCardWrap, style]}>{content}</View>;
};

const styles = StyleSheet.create({
  glassCard: {
    borderRadius: borderRadius['3xl'],
    padding: spacing.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  glassCardWrap: {
    borderRadius: borderRadius['3xl'],
    overflow: 'hidden',
  },
});

export const ViewHeader: React.FC<{
  title: string;
  onBack: () => void;
  rightElement?: React.ReactNode;
}> = ({ title, onBack, rightElement }) => {
  const dark = useApp().isDarkMode;
  const textColor = dark ? '#f8fafc' : colors.gray[800];
  return (
    <View style={headerStyles.container}>
      <View style={headerStyles.left}>
        <Pressable
          onPress={onBack}
          style={({ pressed }) => [
            headerStyles.backBtn,
            {
              backgroundColor: dark ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.7)',
              borderColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.6)',
              opacity: pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.96 : 1 }],
            },
          ]}
        >
          <ChevronLeft size={24} color={dark ? colors.gray[400] : colors.gray[600]} />
        </Pressable>
        <Text style={[headerStyles.title, { color: textColor }]}>{title}</Text>
      </View>
      <View style={headerStyles.right}>{rightElement}</View>
    </View>
  );
};

const headerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  backBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  right: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});

export const ActionButton: React.FC<{
  onPress: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'glass';
  style?: ViewStyle;
  disabled?: boolean;
}> = ({ onPress, children, variant = 'primary', style, disabled }) => {
  const dark = useApp().isDarkMode;
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        actionBtnStyles.base,
        isPrimary
          ? { backgroundColor: colors.orange[500] }
          : {
              backgroundColor: dark ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.7)',
              borderWidth: 1,
              borderColor: dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.4)',
            },
        disabled && actionBtnStyles.disabled,
        { opacity: pressed ? 0.92 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
        style,
      ]}
    >
      <View style={actionBtnStyles.content}>{children}</View>
    </Pressable>
  );
};

const actionBtnStyles = StyleSheet.create({
  base: {
    minHeight: 56,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  disabled: {
    opacity: 0.5,
  },
});

export const ErrorModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  code?: number;
  onRetry?: () => void;
}> = ({ isOpen, onClose, code, onRetry }) => {
  const dark = useApp().isDarkMode;
  const detail = getErrorDetail(code);
  const Icon = detail.icon;
  const bgColor = dark ? colors.slate[900] : '#fff';
  const textColor = dark ? '#f8fafc' : colors.gray[800];
  const subTextColor = dark ? colors.gray[400] : colors.gray[500];

  if (!isOpen) return null;

  return (
    <Modal visible={isOpen} transparent animationType="fade">
      <Pressable style={errorModalStyles.overlay} onPress={onClose}>
        <View style={errorModalStyles.center}>
          <Pressable onPress={(e) => e.stopPropagation()} style={errorModalStyles.cardWrap}>
            <View style={[errorModalStyles.card, { backgroundColor: bgColor }]}>
              <View style={[errorModalStyles.iconWrap, { backgroundColor: dark ? '#1e293b' : colors.gray[50] }]}>
                <Icon size={40} color={detail.iconColor} />
              </View>
              <Text style={[errorModalStyles.title, { color: textColor }]}>{detail.title}</Text>
              <Text style={[errorModalStyles.message, { color: subTextColor }]}>{detail.message}</Text>
              <Pressable
                onPress={onRetry ?? onClose}
                style={({ pressed }) => [
                  errorModalStyles.primaryBtn,
                  { opacity: pressed ? 0.95 : 1 },
                ]}
              >
                <View style={errorModalStyles.primaryBtnContent}>
                  <Text style={errorModalStyles.primaryBtnText}>{detail.actionLabel}</Text>
                  <ArrowRight size={18} color="#fff" />
                </View>
              </Pressable>
              <Pressable onPress={onClose} style={errorModalStyles.closeBtn}>
                <Text style={errorModalStyles.closeBtnText}>關閉窗口</Text>
              </Pressable>
              <Pressable style={errorModalStyles.xBtn} onPress={onClose}>
                <X size={20} color={colors.gray[400]} />
              </Pressable>
            </View>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
};

const errorModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  center: {
    width: '100%',
    maxWidth: 400,
  },
  cardWrap: {
    borderRadius: borderRadius['4xl'],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  card: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: borderRadius['3xl'],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xl,
  },
  primaryBtn: {
    width: '100%',
    paddingVertical: 16,
    backgroundColor: colors.orange[500],
    borderRadius: borderRadius['2xl'],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  primaryBtnContent: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  closeBtn: {
    paddingVertical: 12,
  },
  closeBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.gray[400],
    letterSpacing: 2,
  },
  xBtn: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
  },
});
