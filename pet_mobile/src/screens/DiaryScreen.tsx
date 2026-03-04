import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  Image,
  Modal,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Alert,
  FlatList,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Heart, Send, Image as ImageIcon, Wand2, RefreshCw, Trash2, X, Calendar, Plus, Video } from 'lucide-react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../navigation/types';
import type { DiaryEntry } from '../types';
import * as mockApi from '../api/mock';
import { ViewHeader } from '../components/shared/CommonUI';
import { useApp } from '../context/AppContext';
import { colors, borderRadius, spacing, shadowGlass } from '../theme/tokens';
import { pickFromCamera, pickMultipleFromAlbum, pickVideoFromCamera, pickVideoFromAlbum } from '../utils/imagePicker';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Diary'>;

const MOOD_TAGS: { label: string; value: string }[] = [
  { label: '開心', value: 'happy' },
  { label: '放鬆', value: 'relaxed' },
  { label: '治癒', value: 'healing' },
  { label: '想念', value: 'miss' },
  { label: '平靜', value: 'calm' },
];

export default function DiaryScreen({
  navigation,
  route,
}: {
  navigation: Nav;
  route: { params?: { filterDate?: string | null; openAdd?: boolean } };
}) {
  const filterDate = route.params?.filterDate ?? null;
  const { isDarkMode } = useApp();
  const dark = isDarkMode;
  const insets = useSafeAreaInsets();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [selectedMood, setSelectedMood] = useState<string>('happy');
  const [selectedImageUrls, setSelectedImageUrls] = useState<string[]>([]);
  const [selectedVideoUri, setSelectedVideoUri] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isBeautifying, setIsBeautifying] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [imageViewerUrls, setImageViewerUrls] = useState<string[]>([]);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const openImageViewer = (urls: string[], index: number) => {
    setImageViewerUrls(urls);
    setImageViewerIndex(index);
    setImageViewerVisible(true);
  };

  useEffect(() => {
    mockApi.fetchDiaryEntries().then(setEntries);
  }, []);

  useEffect(() => {
    if (route.params?.openAdd) {
      setAddModalVisible(true);
    }
  }, [route.params?.openAdd]);

  const filteredEntries = filterDate ? entries.filter((e) => e.date === filterDate) : entries;

  const handleBeautify = async () => {
    if (!userInput) return;
    setIsBeautifying(true);
    try {
      const beautified = await mockApi.beautifyDiary(userInput);
      setUserInput(beautified);
    } catch (e) {
      console.error(e);
    } finally {
      setIsBeautifying(false);
    }
  };

  const handleGenerate = async () => {
    const hasMedia = selectedImageUrls.length > 0 || selectedVideoUri;
    if (!userInput && !hasMedia) return;
    setIsGenerating(true);
    try {
      const firstImage = selectedImageUrls[0] ?? selectedVideoUri ?? null;
      const newEntry = await mockApi.createDiaryEntry(
        userInput,
        null,
        firstImage,
        selectedImageUrls.length > 0 ? selectedImageUrls : null,
        selectedMood ?? 'happy'
      );
      const entryToAdd: DiaryEntry = {
        ...newEntry,
        imageUrl: newEntry.imageUrl ?? firstImage ?? undefined,
        imageUrls: (newEntry.imageUrls && newEntry.imageUrls.length > 0)
          ? newEntry.imageUrls
          : (firstImage ? [firstImage] : undefined),
      };
      setEntries((prev) => [entryToAdd, ...prev]);
      setUserInput('');
      setSelectedImageUrls([]);
      setSelectedVideoUri(null);
      setSelectedMood('happy');
      setAddModalVisible(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const MAX_IMAGES = 9;
  const addImage = () => {
    if (selectedImageUrls.length >= MAX_IMAGES) {
      Alert.alert('提示', `最多只能添加 ${MAX_IMAGES} 張圖片`);
      return;
    }
    Alert.alert('添加圖片', '選擇來源', [
      { text: '相機拍攝', onPress: async () => {
        const result = await pickFromCamera();
        if (result) setSelectedImageUrls((prev) => (prev.length >= MAX_IMAGES ? prev : [...prev, result.uri]));
      }},
      { text: '從相冊選擇', onPress: async () => {
        const result = await pickMultipleFromAlbum(MAX_IMAGES, selectedImageUrls.length);
        if (result?.uris?.length) setSelectedImageUrls((prev) => [...prev, ...result.uris].slice(0, MAX_IMAGES));
      }},
      { text: '取消', style: 'cancel' as const },
    ]);
  };
  const removeImage = (index: number) => {
    setSelectedImageUrls((prev) => prev.filter((_, i) => i !== index));
  };
  const addVideo = () => {
    Alert.alert('添加視頻', '選擇來源', [
      { text: '相機拍攝', onPress: async () => {
        const result = await pickVideoFromCamera();
        if (result) setSelectedVideoUri(result.uri);
      }},
      { text: '從相冊選擇', onPress: async () => {
        const result = await pickVideoFromAlbum();
        if (result) setSelectedVideoUri(result.uri);
      }},
      { text: '取消', style: 'cancel' as const },
    ]);
  };
  const removeVideo = () => setSelectedVideoUri(null);
  const closeAddModal = () => {
    setAddModalVisible(false);
    setUserInput('');
    setSelectedImageUrls([]);
    setSelectedVideoUri(null);
    setSelectedMood('happy');
  };


  const performDelete = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setConfirmDeleteId(null);
  };

  const textColor = dark ? '#f8fafc' : colors.gray[800];
  const subColor = dark ? colors.gray[400] : colors.gray[500];
  const glassBg = dark ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.9)';
  const glassBorder = dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.2)';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: dark ? colors.slate[950] : '#f8fafc',
          paddingTop: insets.top - spacing.xl,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + spacing.md }]}
        showsVerticalScrollIndicator={false}
      >
        <ViewHeader
          title="情緒價值日記"
          onBack={() => navigation.goBack()}
          rightElement={
            <Pressable
              onPress={() => navigation.navigate('Calendar')}
              style={[styles.calendarBtn, { backgroundColor: glassBg, borderColor: glassBorder }]}
            >
              <Calendar size={22} color={colors.orange[500]} />
            </Pressable>
          }
        />

        {filterDate && (
          <View style={[styles.filterBar, { backgroundColor: 'rgba(249, 115, 22, 0.1)', borderColor: 'rgba(249, 115, 22, 0.2)' }]}>
            <Text style={styles.filterBarText}>正在回味: {filterDate}</Text>
            <Pressable onPress={() => navigation.navigate('Calendar')}>
              <Text style={[styles.filterBarLink, { color: subColor }]}>更換日期</Text>
            </Pressable>
          </View>
        )}

        {filteredEntries.length === 0 ? (
          <View style={styles.empty}>
            <View style={[styles.emptyIconWrap, { backgroundColor: glassBg }]}>
              <Heart size={32} color={subColor} />
            </View>
            <Text style={[styles.emptyTitle, { color: textColor }]}>這天還沒有記錄喔</Text>
            <Text style={[styles.emptySub, { color: subColor }]}>試著寫下今天發生的趣事吧...</Text>
          </View>
        ) : (
          filteredEntries.map((entry) => {
            const images = (entry.imageUrls && entry.imageUrls.length > 0)
              ? entry.imageUrls.filter(Boolean)
              : (entry.imageUrl ? [entry.imageUrl] : []);
            const maxCells = 9;
            const overflowCount = images.length > maxCells ? images.length - (maxCells - 1) : 0;
            const imageCellCount = overflowCount > 0 ? maxCells - 1 : images.length;
            const showGrid = images.length > 1;

            return (
            <View
              key={entry.id}
              style={[styles.entryCardShadowWrap, dark ? shadowGlass.dark : shadowGlass.light]}
            >
              <View style={[styles.entryCard, { backgroundColor: glassBg, borderColor: glassBorder, borderTopColor: dark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.55)' }]}>
              {images.length > 0 && (
                showGrid ? (
                  <View style={styles.entryImageGridWrap}>
                    {Array.from({ length: imageCellCount }).map((_, i) => {
                      const uri = images[i];
                      return uri ? (
                        <Pressable
                          key={`${entry.id}-img-${i}`}
                          style={styles.entryImageGridCell}
                          onPress={() => openImageViewer(images, i)}
                        >
                          <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                        </Pressable>
                      ) : null;
                    })}
                    {overflowCount > 0 && (
                      <Pressable
                        style={styles.entryImageGridCell}
                        onPress={() => openImageViewer(images, maxCells - 1)}
                      >
                        <View style={[StyleSheet.absoluteFill, styles.entryImageGridOverlay]}>
                          <Text style={styles.entryImageGridOverlayText}>+{overflowCount}</Text>
                        </View>
                      </Pressable>
                    )}
                  </View>
                ) : (
                  <View style={styles.entryImageSingleWrap}>
                    <Pressable onPress={() => openImageViewer(images, 0)}>
                      <Image source={{ uri: images[0] }} style={styles.entryImage} resizeMode="cover" />
                    </Pressable>
                  </View>
                )
              )}
              <View style={styles.entryBody}>
                <View style={styles.entryHead}>
                  <Text style={[styles.entryDate, { color: subColor }]}>{entry.date}</Text>
                  <View style={styles.entryHeadRight}>
                    <View style={[styles.styleTag, { backgroundColor: 'rgba(249, 115, 22, 0.1)', borderColor: 'rgba(249, 115, 22, 0.2)' }]}>
                      <Text style={styles.styleTagText}>{entry.style}</Text>
                    </View>
                    {confirmDeleteId === entry.id ? (
                      <View style={styles.deleteConfirmRow}>
                        <Pressable onPress={() => performDelete(entry.id)} style={styles.deleteConfirmBtn}>
                          <Text style={styles.deleteConfirmBtnText}>確認</Text>
                        </Pressable>
                        <Pressable onPress={() => setConfirmDeleteId(null)} style={styles.deleteCancelBtn}>
                          <Text style={[styles.deleteCancelBtnText, { color: subColor }]}>取消</Text>
                        </Pressable>
                      </View>
                    ) : (
                      <Pressable onPress={() => setConfirmDeleteId(entry.id)}>
                        <Trash2 size={14} color={subColor} />
                      </Pressable>
                    )}
                  </View>
                </View>
                <Text style={[styles.entryContent, { color: textColor }]}>{entry.content}</Text>
                <View style={styles.entryActions}>
                  <Pressable style={styles.entryAction}>
                    <Heart size={16} color={subColor} />
                    <Text style={[styles.entryActionText, { color: subColor }]}>收藏</Text>
                  </Pressable>
                  <Pressable style={styles.entryAction}>
                    <Text style={[styles.entryActionText, { color: subColor }]}>分享</Text>
                  </Pressable>
                </View>
              </View>
              </View>
            </View>
            );
          })
        )}
        <View style={{ height: 24 }} />
      </ScrollView>

      <Pressable
        onPress={() => setAddModalVisible(true)}
        style={[
          styles.fab,
          {
            right: spacing.lg + insets.right,
            bottom: Math.max(insets.bottom, spacing.xl) + 80,
            backgroundColor: colors.orange[500],
          },
        ]}
      >
        <Plus size={28} color="#fff" strokeWidth={2.5} />
      </Pressable>

      <Modal
        visible={addModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeAddModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalBackdrop} onPress={closeAddModal} />
          <View
            style={[
              styles.modalBox,
              {
                backgroundColor: dark ? colors.slate[900] : '#fff',
                paddingBottom: Math.max(insets.bottom, spacing.lg),
              },
            ]}
          >
            <View style={[styles.modalHeader, { borderBottomColor: glassBorder }]}>
              <Text style={[styles.modalTitle, { color: textColor }]}>添加日記</Text>
              <Pressable onPress={closeAddModal} style={styles.modalCloseBtn}>
                <X size={24} color={subColor} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={[styles.modalInputWrap, { backgroundColor: dark ? colors.slate[800] : colors.gray[50] }]}>
                <TextInput
                  value={userInput}
                  onChangeText={setUserInput}
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
                    onPress={() => setSelectedMood(value)}
                    style={[
                      styles.moodTag,
                      {
                        backgroundColor: selectedMood === value ? 'rgba(249, 115, 22, 0.2)' : glassBg,
                        borderColor: selectedMood === value ? 'rgba(249, 115, 22, 0.4)' : glassBorder,
                      },
                    ]}
                  >
                    <Text style={[styles.moodTagText, { color: selectedMood === value ? colors.orange[500] : subColor }]}>
                      {label}
                    </Text>
                  </Pressable>
                ))}
                </View>
              </View>

              {(selectedVideoUri || selectedImageUrls.length > 0) && (
                <View style={styles.mediaSection}>
                  {selectedVideoUri && (
                    <View style={styles.mediaBlock}>
                      <Text style={[styles.mediaLabel, { color: subColor }]}>視頻</Text>
                      <View style={[styles.videoPreview, { backgroundColor: dark ? colors.slate[800] : colors.gray[50], borderColor: glassBorder }]}>
                        <Video size={40} color={subColor} />
                        <Text style={[styles.videoPlaceholderText, { color: subColor }]}>已選擇視頻</Text>
                        <Pressable onPress={removeVideo} style={[styles.previewRemove, styles.previewRemoveVideo]}>
                          <X size={14} color="#fff" />
                        </Pressable>
                      </View>
                    </View>
                  )}
                  {selectedImageUrls.length > 0 && (
                    <View style={styles.mediaBlock}>
                      <Text style={[styles.mediaLabel, { color: subColor }]}>圖片 ({selectedImageUrls.length})</Text>
                      <View style={styles.imageGrid}>
                        {selectedImageUrls.map((uri, index) => (
                          <View key={`${uri}-${index}`} style={styles.imageGridItem}>
                            <Image source={{ uri }} style={styles.imageGridThumb} resizeMode="cover" />
                            <Pressable onPress={() => removeImage(index)} style={[styles.previewRemove, styles.previewRemoveGrid]}>
                              <X size={12} color="#fff" />
                            </Pressable>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              )}

              <View style={[styles.modalActions, { borderTopColor: glassBorder }]}>
                <Pressable onPress={addImage} style={[styles.modalActionBtn, { backgroundColor: glassBg, borderColor: glassBorder }]}>
                  <ImageIcon size={20} color={colors.orange[500]} />
                  <Text style={[styles.modalActionBtnText, { color: textColor }]}>添加圖片</Text>
                </Pressable>
                <Pressable onPress={addVideo} style={[styles.modalActionBtn, { backgroundColor: glassBg, borderColor: glassBorder }]}>
                  <Video size={20} color={colors.orange[500]} />
                  <Text style={[styles.modalActionBtnText, { color: textColor }]}>添加視頻</Text>
                </Pressable>
                <Pressable
                  onPress={handleBeautify}
                  disabled={!userInput || isBeautifying}
                  style={[styles.modalActionBtn, { backgroundColor: glassBg, borderColor: glassBorder }]}
                >
                  {isBeautifying ? (
                    <RefreshCw size={20} color={colors.orange[500]} />
                  ) : (
                    <Wand2 size={20} color={subColor} />
                  )}
                  <Text style={[styles.modalActionBtnText, { color: textColor }]}>潤色</Text>
                </Pressable>
                <Pressable
                  onPress={handleGenerate}
                  disabled={(!userInput && selectedImageUrls.length === 0 && !selectedVideoUri) || isGenerating}
                  style={[
                    styles.modalSendBtnSmall,
                    {
                      backgroundColor:
                        userInput || selectedImageUrls.length > 0 || selectedVideoUri
                          ? colors.orange[500]
                          : (dark ? colors.slate[800] : colors.gray[500]),
                    },
                  ]}
                >
                  {isGenerating ? (
                    <RefreshCw size={18} color="#fff" />
                  ) : (
                    <Send size={18} color="#fff" />
                  )}
                  <Text style={styles.modalSendBtnTextSmall}>發送</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={imageViewerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setImageViewerVisible(false)}
      >
        <View style={[styles.imageViewerOverlay, { width: windowWidth, height: windowHeight }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setImageViewerVisible(false)} />
          <View style={styles.imageViewerHeader}>
            <Text style={styles.imageViewerIndex}>
              {imageViewerUrls.length > 1 ? `${imageViewerIndex + 1}/${imageViewerUrls.length}` : ''}
            </Text>
            <Pressable onPress={() => setImageViewerVisible(false)} style={styles.imageViewerClose}>
              <X size={28} color="#fff" />
            </Pressable>
          </View>
          {imageViewerUrls.length > 1 ? (
            <FlatList
              data={imageViewerUrls}
              horizontal
              pagingEnabled
              initialScrollIndex={imageViewerIndex}
              getItemLayout={(_, index) => ({ length: windowWidth, offset: windowWidth * index, index })}
              keyExtractor={(uri, i) => uri + i}
              onMomentumScrollEnd={(e) => {
                const i = Math.round(e.nativeEvent.contentOffset.x / windowWidth);
                setImageViewerIndex(Math.min(i, imageViewerUrls.length - 1));
              }}
              renderItem={({ item }) => (
                <View style={{ width: windowWidth, height: windowHeight, justifyContent: 'center' }}>
                  <Image source={{ uri: item }} style={{ width: windowWidth, height: windowHeight }} resizeMode="contain" />
                </View>
              )}
            />
          ) : (
            imageViewerUrls.length > 0 && (
              <View style={styles.imageViewerSingle}>
                <Image source={{ uri: imageViewerUrls[0] }} style={{ width: windowWidth, height: windowHeight }} resizeMode="contain" />
              </View>
            )
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.xl, paddingBottom: spacing.md },
  calendarBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    marginBottom: spacing.xl,
  },
  filterBarText: { fontSize: 12, fontWeight: '700', color: colors.orange[600] },
  filterBarLink: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  empty: { alignItems: 'center', paddingVertical: 48, gap: spacing.lg },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: 14, fontWeight: '800' },
  emptySub: { fontSize: 12, fontWeight: '600' },
  entryCardShadowWrap: {
    marginBottom: spacing.xl,
    borderRadius: 32,
    overflow: 'visible',
  },
  entryCard: {
    borderRadius: 32,
    borderWidth: 1,
    overflow: 'hidden',
  },
  entryImageSingleWrap: { width: '100%', alignItems: 'center' },
  entryImage: { width: '100%', height: 192 },
  entryImageGridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: spacing.sm,
    gap: spacing.sm,
  },
  entryImageGridCell: {
    width: (Dimensions.get('window').width - spacing.xl * 2 - spacing.sm * 2 - spacing.sm * 2 * 2) / 3,
    height: (Dimensions.get('window').width - spacing.xl * 2 - spacing.sm * 2 - spacing.sm * 2 * 2) / 3,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  entryImageGridOverlay: {
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  entryImageGridOverlayText: { fontSize: 20, fontWeight: '800', color: '#fff' },
  imageViewerOverlay: {
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
  },
  imageViewerHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl + 40,
    zIndex: 1,
  },
  imageViewerIndex: { fontSize: 16, fontWeight: '700', color: 'rgba(255,255,255,0.9)' },
  imageViewerClose: { padding: spacing.sm },
  imageViewerSingle: { flex: 1, justifyContent: 'center' },
  entryBody: { padding: spacing.xl },
  entryHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  entryDate: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  entryHeadRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  styleTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  styleTagText: { fontSize: 9, fontWeight: '800', color: colors.orange[500] },
  deleteConfirmRow: { flexDirection: 'row', gap: 8 },
  deleteConfirmBtn: { backgroundColor: '#ef4444', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  deleteConfirmBtnText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  deleteCancelBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  deleteCancelBtnText: { fontSize: 10, fontWeight: '800' },
  entryContent: { fontSize: 15, fontWeight: '700', lineHeight: 24, marginBottom: spacing.lg },
  entryActions: { flexDirection: 'row', gap: spacing.xl, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  entryAction: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  entryActionText: { fontSize: 10, fontWeight: '700' },
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'ios'
      ? { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }
      : { elevation: 8 }),
  },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalBox: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: Dimensions.get('window').height * 0.85,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  modalCloseBtn: { padding: spacing.sm },
  modalScroll: { maxHeight: 400 },
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
  mediaLabel: { fontSize: 12, fontWeight: '700', marginBottom: spacing.sm },
  videoPreview: {
    height: 120,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlaceholderText: { fontSize: 12, marginTop: spacing.sm },
  previewRemove: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewRemoveVideo: { top: spacing.sm, right: spacing.sm },
  previewRemoveGrid: { top: 4, right: 4, width: 22, height: 22, borderRadius: 11 },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  imageGridItem: { position: 'relative' },
  imageGridThumb: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  modalActions: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xs,
    borderTopWidth: 1,
  },
  modalActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    flexShrink: 0,
  },
  modalActionBtnText: { fontSize: 13, fontWeight: '700' },
  modalSendBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
    flexShrink: 0,
    marginLeft: 'auto',
  },
  modalSendBtnTextSmall: { fontSize: 13, fontWeight: '800', color: '#fff' },
});
