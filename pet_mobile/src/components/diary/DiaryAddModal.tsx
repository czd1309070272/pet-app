import React from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  Dimensions,
  Keyboard,
  TouchableWithoutFeedback,
  Animated,
} from 'react-native';
import { X, ImageIcon, Wand2, RefreshCw, Send, Video } from 'lucide-react-native';
import { colors, spacing } from '../../theme/tokens';
import { MOOD_TAGS, MAX_DIARY_MEDIA } from './constants';
import { DraggableMediaGrid, type PostMediaItem } from '../community';

const { height: WINDOW_HEIGHT } = Dimensions.get('window');

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalKeyboardWrap: { flex: 1, justifyContent: 'flex-end' },
  modalBox: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: WINDOW_HEIGHT * 0.85,
  },
  modalPullHandleWrap: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPullHandleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  modalPullHandleBarDark: { backgroundColor: 'rgba(255,255,255,0.2)' },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 17, fontWeight: '800' },
  modalCloseBtn: { padding: spacing.xs },
  modalScroll: { flex: 1 },
  modalScrollContent: { padding: spacing.lg, paddingBottom: spacing.xl },
  modalInputWrap: {
    borderRadius: 16,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
    minHeight: 100,
  },
  modalInput: { fontSize: 15, fontWeight: '600', minHeight: 80 },
  moodSection: { marginBottom: spacing.lg },
  moodLabel: { fontSize: 12, fontWeight: '700', marginBottom: spacing.sm },
  moodTagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  moodTag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
  },
  moodTagText: { fontSize: 12, fontWeight: '700' },
  mediaSection: { marginBottom: spacing.lg },
  mediaBlock: { marginBottom: spacing.lg },
  mediaLabel: { fontSize: 12, fontWeight: '700' },
  mediaLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  modalActions: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs - 10,
    borderTopWidth: 1,
  },
  modalActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    flexShrink: 0,
  },
  modalActionBtnText: { fontSize: 15, fontWeight: '700' },
  modalActionBtnDisabled: { opacity: 0.5 },
  modalSendBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md + 2,
    borderRadius: 14,
    flexShrink: 0,
    marginLeft: 'auto',
    marginRight: spacing.lg,
  },
  modalSendBtnTextSmall: { fontSize: 15, fontWeight: '800', color: '#fff' },
  mediaHint: { fontSize: 11 },
  progressWrap: { height: 4, borderRadius: 2, overflow: 'hidden', marginTop: 6 },
  progressTrack: { height: '100%', borderRadius: 2 },
  progressFill: { height: '100%', borderRadius: 2, backgroundColor: colors.orange[500] },
});

export function DiaryAddModal({
  visible,
  onClose,
  sheetHeightMax,
  sheetHeightInitial,
  animatedSheetHeight,
  sheetPanHandlers,
  dark,
  insetsBottom,
  textColor,
  subColor,
  glassBg,
  glassBorder,
  userInput,
  onUserInputChange,
  selectedMood,
  onMoodSelect,
  postMedia,
  onReorderMedia,
  onRemoveMedia,
  isDraggingMedia,
  onDragStart,
  onDragEnd,
  canAddMedia,
  onPickImages,
  onPickVideos,
  onBeautify,
  isBeautifying,
  onSend,
  isGenerating,
  canSend,
  mediaUploadProgress,
}: {
  visible: boolean;
  onClose: () => void;
  sheetHeightMax: number;
  sheetHeightInitial: number;
  animatedSheetHeight: Animated.Value;
  sheetPanHandlers: object;
  dark: boolean;
  insetsBottom: number;
  textColor: string;
  subColor: string;
  glassBg: string;
  glassBorder: string;
  userInput: string;
  onUserInputChange: (text: string) => void;
  selectedMood: string;
  onMoodSelect: (value: string) => void;
  postMedia: PostMediaItem[];
  onReorderMedia: (fromIndex: number, toIndex: number) => void;
  onRemoveMedia: (uri: string) => void;
  isDraggingMedia: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  canAddMedia: boolean;
  onPickImages: () => void;
  onPickVideos: () => void;
  onBeautify: () => void;
  isBeautifying: boolean;
  onSend: () => void;
  isGenerating: boolean;
  canSend: boolean;
  mediaUploadProgress?: number | null;
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View style={styles.modalKeyboardWrap}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <Animated.View
              style={[
                styles.modalBox,
                {
                  backgroundColor: dark ? colors.slate[900] : '#fff',
                  paddingBottom: Math.max(insetsBottom, spacing.lg),
                  maxHeight: sheetHeightMax,
                  height: animatedSheetHeight,
                },
              ]}
            >
              <View
                style={[styles.modalPullHandleWrap, { borderBottomColor: glassBorder }]}
                {...sheetPanHandlers}
              >
                <View
                  style={[
                    styles.modalPullHandleBar,
                    dark && styles.modalPullHandleBarDark,
                  ]}
                />
              </View>
              <View style={[styles.modalHeader, { borderBottomColor: glassBorder }]}>
                <Text style={[styles.modalTitle, { color: textColor }]}>
                  添加日記
                </Text>
                <Pressable onPress={onClose} style={styles.modalCloseBtn}>
                  <X size={24} color={subColor} />
                </Pressable>
              </View>

              <ScrollView
                style={styles.modalScroll}
                contentContainerStyle={styles.modalScrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                scrollEnabled={!isDraggingMedia}
              >
                <View
                  style={[
                    styles.modalInputWrap,
                    {
                      backgroundColor: dark ? colors.slate[800] : colors.gray[50],
                    },
                  ]}
                >
                  <TextInput
                    value={userInput}
                    onChangeText={onUserInputChange}
                    placeholder="記錄下此刻的萌寵時光..."
                    placeholderTextColor={subColor}
                    style={[styles.modalInput, { color: textColor }]}
                    multiline
                    maxLength={500}
                  />
                </View>

                <View style={styles.moodSection}>
                  <Text style={[styles.moodLabel, { color: subColor }]}>心情</Text>
                  <View style={styles.moodTagsWrap}>
                    {MOOD_TAGS.map(({ value, label }) => (
                      <Pressable
                        key={value}
                        onPress={() => onMoodSelect(value)}
                        style={[
                          styles.moodTag,
                          {
                            backgroundColor:
                              selectedMood === value
                                ? 'rgba(249, 115, 22, 0.2)'
                                : glassBg,
                            borderColor:
                              selectedMood === value
                                ? 'rgba(249, 115, 22, 0.4)'
                                : glassBorder,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.moodTagText,
                            {
                              color:
                                selectedMood === value
                                  ? colors.orange[500]
                                  : subColor,
                            },
                          ]}
                        >
                          {label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View style={styles.mediaSection}>
                  <View style={styles.mediaBlock}>
                    <View style={styles.mediaLabelRow}>
                      <Text style={[styles.mediaLabel, { color: subColor }]}>
                        圖片/視頻
                      </Text>
                      <Text style={[styles.mediaHint, { color: subColor }]}>
                        圖片小於 10MB，視頻 5 分鐘以內
                      </Text>
                    </View>
                    {mediaUploadProgress != null ? (
                      <View
                        style={[
                          styles.progressWrap,
                          { backgroundColor: dark ? colors.slate[700] : colors.gray[200] },
                        ]}
                      >
                        <View style={styles.progressTrack}>
                          <View
                            style={[
                              styles.progressFill,
                              { width: `${Math.min(100, Math.max(0, mediaUploadProgress * 100))}%` },
                            ]}
                          />
                        </View>
                      </View>
                    ) : null}
                    {postMedia.length > 0 ? (
                      <DraggableMediaGrid
                        items={postMedia}
                        onReorder={onReorderMedia}
                        onRemove={onRemoveMedia}
                        onAdd={() => {}}
                        dark={dark}
                        isAddDisabled={postMedia.length >= MAX_DIARY_MEDIA}
                        hideAddButton
                        onDragStart={onDragStart}
                        onDragEnd={onDragEnd}
                      />
                    ) : null}
                  </View>
                </View>
              </ScrollView>

              <View
                style={[
                  styles.modalActions,
                  {
                    borderTopColor: glassBorder,
                    backgroundColor: dark ? colors.slate[900] : '#fff',
                  },
                ]}
              >
                <Pressable
                  onPress={onPickImages}
                  disabled={!canAddMedia}
                  style={[
                    styles.modalActionBtn,
                    { backgroundColor: glassBg, borderColor: glassBorder },
                    !canAddMedia && styles.modalActionBtnDisabled,
                  ]}
                >
                  <ImageIcon
                    size={24}
                    color={canAddMedia ? colors.orange[500] : subColor}
                  />
                </Pressable>
                <Pressable
                  onPress={onPickVideos}
                  disabled={!canAddMedia}
                  style={[
                    styles.modalActionBtn,
                    { backgroundColor: glassBg, borderColor: glassBorder },
                    !canAddMedia && styles.modalActionBtnDisabled,
                  ]}
                >
                  <Video
                    size={24}
                    color={canAddMedia ? colors.orange[500] : subColor}
                  />
                </Pressable>
                <Pressable
                  onPress={onBeautify}
                  disabled={!userInput || isBeautifying}
                  style={[
                    styles.modalActionBtn,
                    { backgroundColor: glassBg, borderColor: glassBorder },
                  ]}
                >
                  {isBeautifying ? (
                    <RefreshCw size={24} color={colors.orange[500]} />
                  ) : (
                    <Wand2 size={24} color={subColor} />
                  )}
                  <Text style={[styles.modalActionBtnText, { color: textColor }]}>
                    潤色
                  </Text>
                </Pressable>
                <Pressable
                  onPress={onSend}
                  disabled={!canSend || isGenerating}
                  style={[
                    styles.modalSendBtnSmall,
                    {
                      backgroundColor:
                        userInput || postMedia.length > 0
                          ? colors.orange[500]
                          : dark
                            ? colors.slate[800]
                            : colors.gray[500],
                    },
                  ]}
                >
                  {isGenerating ? (
                    <RefreshCw size={22} color="#fff" />
                  ) : (
                    <Send size={22} color="#fff" />
                  )}
                  <Text style={styles.modalSendBtnTextSmall}>發送</Text>
                </Pressable>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </View>
    </Modal>
  );
}
