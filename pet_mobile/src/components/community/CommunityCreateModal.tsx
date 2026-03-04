/**
 * 发布新动态弹窗
 */
import React from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { Send, X, Plus } from 'lucide-react-native';
import type { PostMediaItem } from './types';
import { DraggableMediaGrid } from './DraggableMediaGrid';
import { MODAL_TAGS } from './constants';
import { colors, borderRadius, spacing } from '../../theme/tokens';

export interface CommunityCreateModalProps {
  visible: boolean;
  dark: boolean;
  postContent: string;
  postTags: string[];
  postMedia: PostMediaItem[];
  isPosting: boolean;
  keyboardHeight: number;
  textPrimary: string;
  textSecondary: string;
  onClose: () => void;
  onContentChange: (v: string) => void;
  onTagToggle: (tag: string) => void;
  onMediaReorder: (from: number, to: number) => void;
  onMediaRemove: (uri: string) => void;
  onMediaAdd: () => void;
  onSubmit: () => void;
  onDismissKeyboard: () => void;
}

export function CommunityCreateModal({
  visible,
  dark,
  postContent,
  postTags,
  postMedia,
  isPosting,
  keyboardHeight,
  textPrimary,
  textSecondary,
  onClose,
  onContentChange,
  onTagToggle,
  onMediaReorder,
  onMediaRemove,
  onMediaAdd,
  onSubmit,
  onDismissKeyboard,
}: CommunityCreateModalProps) {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={[styles.keyboardAvoid, postMedia.length === 0 && { marginBottom: keyboardHeight }]}>
        <TouchableWithoutFeedback onPress={onDismissKeyboard}>
          <View style={[styles.content, dark && styles.contentDark]}>
            <View style={styles.header}>
              <View style={styles.titleRow}>
                <View style={styles.titleIcon}>
                  <Send size={18} color="#fff" />
                </View>
                <Text style={[styles.title, { color: textPrimary }]}>發布新動態</Text>
              </View>
              <Pressable
                onPress={onClose}
                style={[styles.close, dark && { backgroundColor: 'rgba(30,41,59,0.6)' }]}
              >
                <X size={20} color={textSecondary} />
              </Pressable>
            </View>
            <TextInput
              style={[styles.textArea, { color: textPrimary }, dark && styles.textAreaDark]}
              placeholder="這一刻想說點什麼呢... (支持使用 #標籤)"
              placeholderTextColor={textSecondary}
              value={postContent}
              onChangeText={onContentChange}
              multiline
              numberOfLines={4}
            />
            <View style={styles.tagRow}>
              {MODAL_TAGS.map((tag) => (
                <Pressable
                  key={tag}
                  onPress={() => onTagToggle(tag)}
                  style={[
                    styles.tagChip,
                    postTags.includes(tag) ? styles.tagChipActive : dark ? styles.tagChipDark : styles.tagChipLight,
                  ]}
                >
                  <Text style={[styles.tagChipText, { color: postTags.includes(tag) ? '#fff' : textSecondary }]}>
                    {tag}
                  </Text>
                </Pressable>
              ))}
            </View>
            {postMedia.length > 0 && (
              <DraggableMediaGrid
                items={postMedia}
                onReorder={onMediaReorder}
                onRemove={onMediaRemove}
                onAdd={onMediaAdd}
                dark={dark}
              />
            )}
            <View style={styles.actions}>
              {postMedia.length === 0 && (
                <Pressable onPress={onMediaAdd} style={[styles.cameraBtn, dark && styles.cameraBtnDark]}>
                  <Plus size={22} color={textSecondary} />
                </Pressable>
              )}
              <Pressable
                onPress={onSubmit}
                disabled={isPosting || !postContent.trim()}
                style={[
                  styles.postBtn,
                  (!postContent.trim() || isPosting) && styles.postBtnDisabled,
                ]}
              >
                {isPosting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Send size={18} color="#fff" />
                    <Text style={styles.postBtnText}>發布到社群</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  keyboardAvoid: { flex: 1, justifyContent: 'flex-end' },
  content: {
    backgroundColor: '#fff',
    borderTopLeftRadius: borderRadius['3xl'],
    borderTopRightRadius: borderRadius['3xl'],
    padding: spacing.xl,
    paddingBottom: 48,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 16,
  },
  contentDark: { backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  titleIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.orange[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 18, fontWeight: '800' },
  close: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  textArea: {
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    borderRadius: borderRadius['2xl'],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    fontSize: 15,
    minHeight: 110,
    textAlignVertical: 'top',
  },
  textAreaDark: { backgroundColor: 'rgba(30,41,59,0.6)', borderColor: 'rgba(255,255,255,0.06)' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: spacing.md },
  tagChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  tagChipActive: { backgroundColor: colors.orange[500] },
  tagChipLight: { backgroundColor: 'rgba(0,0,0,0.06)' },
  tagChipDark: { backgroundColor: 'rgba(30,41,59,0.6)' },
  tagChipText: { fontSize: 13, fontWeight: '700' },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  cameraBtn: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  cameraBtnDark: { backgroundColor: 'rgba(30,41,59,0.6)', borderColor: 'rgba(255,255,255,0.06)' },
  postBtn: {
    flex: 1,
    height: 52,
    backgroundColor: colors.orange[500],
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  postBtnDisabled: { opacity: 0.5 },
  postBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
