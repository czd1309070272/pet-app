import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  StyleSheet,
  Keyboard,
  Platform,
  Alert,
  Animated,
  PanResponder,
  InteractionManager,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar, Plus } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../navigation/types';
import type { DiaryEntry } from '../types';
import * as mockApi from '../api/mock';
import { ViewHeader } from '../components/shared/CommonUI';
import { useApp } from '../context/AppContext';
import { colors, spacing } from '../theme/tokens';
import { COMMUNITY_LAYOUT } from '../components/community/constants';
import { FullscreenVideoModal, type PostMediaItem } from '../components/community';
import {
  DiaryEmptyState,
  DiaryFilterBar,
  DiaryAddModal,
  DiaryImageViewerModal,
  getOrderedMedia,
  MAX_DIARY_MEDIA,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_DURATION_MS,
} from '../components/diary';
import { DiaryEntryCard } from '../components/diary/DiaryEntryCard';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Diary'>;

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
  const [postMedia, setPostMedia] = useState<PostMediaItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDraggingMedia, setIsDraggingMedia] = useState(false);
  const [viewingVideoUri, setViewingVideoUri] = useState<string | null>(null);
  const [isBeautifying, setIsBeautifying] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [imageViewerUrls, setImageViewerUrls] = useState<string[]>([]);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);
  const [mediaUploadProgress, setMediaUploadProgress] = useState<number | null>(null);
  const [entryIdForMood, setEntryIdForMood] = useState<string | null>(null);
  const [moodSelectMode, setMoodSelectMode] = useState(false);
  const [selectedMoodImageUrls, setSelectedMoodImageUrls] = useState<string[]>([]);
  const [generatingVisible, setGeneratingVisible] = useState(false);
  const [generatingCurrent, setGeneratingCurrent] = useState(0);
  const [generatingTotal, setGeneratingTotal] = useState(0);
  const [generatingPhase, setGeneratingPhase] = useState<'progress' | 'done'>('progress');
  const [generatedResults, setGeneratedResults] = useState<
    Record<string, { comicUrls: string[] }>
  >({});
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const entryGridContentWidth =
    windowWidth - insets.left - insets.right - spacing.md * 2 - spacing.sm * 2;
  const entryGridCellSize = Math.floor(
    (entryGridContentWidth - COMMUNITY_LAYOUT.IMG_GAP * 2) / 3
  );

  const sheetHeightMax = windowHeight - insets.top;
  const sheetHeightInitial = Math.floor(sheetHeightMax * 0.55);
  const sheetHeightMin = Math.floor(sheetHeightMax * 0.4);
  const animatedSheetHeight = useRef(new Animated.Value(sheetHeightInitial)).current;
  const dragStartHeightRef = useRef(sheetHeightInitial);
  const sheetMaxRef = useRef(sheetHeightMax);
  const sheetMinRef = useRef(sheetHeightMin);
  const sheetInitialRef = useRef(sheetHeightInitial);
  sheetMaxRef.current = sheetHeightMax;
  sheetMinRef.current = sheetHeightMin;
  sheetInitialRef.current = sheetHeightInitial;

  useEffect(() => {
    if (addModalVisible) animatedSheetHeight.setValue(sheetHeightInitial);
  }, [addModalVisible, sheetHeightInitial, animatedSheetHeight]);

  const STEP_MS = 1500;
  useEffect(() => {
    if (!generatingVisible) return;
    const t = setTimeout(() => {
      if (generatingPhase === 'progress') {
        if (generatingCurrent < generatingTotal) {
          setGeneratingCurrent((c) => c + 1);
        } else if (generatingTotal > 0) {
          setGeneratingPhase('done');
        }
      } else {
        if (entryIdForMood && selectedMoodImageUrls.length > 0) {
          setGeneratedResults((prev) => ({
            ...prev,
            [entryIdForMood]: {
            comicUrls: [...selectedMoodImageUrls],
            },
          }));
        }
        setGeneratingVisible(false);
        setEntryIdForMood(null);
        setMoodSelectMode(false);
        setSelectedMoodImageUrls([]);
      }
    }, STEP_MS);
    return () => clearTimeout(t);
  }, [
    generatingVisible,
    generatingPhase,
    generatingCurrent,
    generatingTotal,
    entryIdForMood,
    selectedMoodImageUrls,
  ]);

  const sheetPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 4,
      onPanResponderGrant: () => {
        animatedSheetHeight.stopAnimation((v) => {
          dragStartHeightRef.current =
            typeof v === 'number' ? v : sheetInitialRef.current;
        });
      },
      onPanResponderMove: (_, g) => {
        const maxH = sheetMaxRef.current;
        const minH = sheetMinRef.current;
        const newH = Math.min(
          maxH,
          Math.max(minH, dragStartHeightRef.current - g.dy)
        );
        animatedSheetHeight.setValue(newH);
      },
      onPanResponderRelease: () => {
        animatedSheetHeight.stopAnimation((v) => {
          dragStartHeightRef.current =
            typeof v === 'number' ? v : sheetInitialRef.current;
        });
      },
    })
  ).current;

  const openImageViewer = (urls: string[], index: number) => {
    setImageViewerUrls(urls);
    setImageViewerIndex(index);
    setImageViewerVisible(true);
  };

  const isAssetVideo = useCallback(
    (a: {
      type?: string | null;
      duration?: number | null;
      mimeType?: string | null;
      fileName?: string | null;
      uri?: string;
    }) => {
      if (a.type === 'video' || a.type === 'pairedVideo') return true;
      if (a.duration != null && a.duration > 0) return true;
      const mime = (a.mimeType ?? '').toLowerCase();
      if (mime.startsWith('video/')) return true;
      const name = (a.fileName ?? a.uri ?? '').toLowerCase();
      if (/\.(mp4|mov|avi|webm|mkv|m4v|3gp)(\?|$)/i.test(name)) return true;
      return false;
    },
    []
  );

  const appendAssetsToPostMedia = useCallback(
    (
      assets: {
        uri: string;
        type?: string | null;
        duration?: number | null;
        mimeType?: string | null;
        fileName?: string | null;
      }[],
      asType?: 'image' | 'video'
    ) => {
      setPostMedia((prev) => {
        const maxNew = MAX_DIARY_MEDIA - prev.length;
        if (maxNew <= 0) return prev;
        const added: PostMediaItem[] = assets
          .slice(0, maxNew)
          .filter((a) => a.uri)
          .map((a) => ({
            uri: a.uri,
            type: asType ?? (isAssetVideo(a) ? 'video' : 'image'),
          }));
        return [...prev, ...added];
      });
    },
    [isAssetVideo]
  );

  const pickImagesOnly = useCallback(async () => {
    if (postMedia.length >= MAX_DIARY_MEDIA) {
      Alert.alert('提示', `視頻與圖片合計最多 ${MAX_DIARY_MEDIA} 個`);
      return;
    }
    requestAnimationFrame(() => {
      setTimeout(async () => {
        try {
          const { status } =
            await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') return;
          setMediaUploadProgress(0.1);
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            allowsMultipleSelection: true,
            quality: 0.8,
            selectionLimit: MAX_DIARY_MEDIA - postMedia.length,
          });
          if (!result.canceled && result.assets?.length) {
            setMediaUploadProgress(0.4);
            const assets = result.assets;
            const valid = assets.filter((a) => {
              const size = (a as { fileSize?: number }).fileSize;
              if (size == null) return true;
              return size <= MAX_IMAGE_BYTES;
            });
            const skipped = assets.length - valid.length;
            if (skipped > 0) {
              Alert.alert('提示', `有 ${skipped} 張圖片超過 10MB 已跳過`);
            }
            if (valid.length > 0) {
              setMediaUploadProgress(0.7);
              requestAnimationFrame(() => {
                appendAssetsToPostMedia(valid, 'image');
                setMediaUploadProgress(1);
                setTimeout(() => setMediaUploadProgress(null), 400);
              });
            } else {
              setMediaUploadProgress(null);
            }
          } else {
            setMediaUploadProgress(null);
          }
        } catch (e) {
          setMediaUploadProgress(null);
          console.warn(e);
        }
      }, 200);
    });
  }, [postMedia.length, appendAssetsToPostMedia]);

  const pickVideosOnly = useCallback(async () => {
    if (postMedia.length >= MAX_DIARY_MEDIA) {
      Alert.alert('提示', `視頻與圖片合計最多 ${MAX_DIARY_MEDIA} 個`);
      return;
    }
    const limit = MAX_DIARY_MEDIA - postMedia.length;
    requestAnimationFrame(() => {
      setTimeout(async () => {
        try {
          const { status } =
            await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') return;
          setMediaUploadProgress(0.1);
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['videos'],
            allowsMultipleSelection: Platform.OS !== 'ios',
            selectionLimit: Platform.OS === 'ios' ? 1 : limit,
            allowsEditing: Platform.OS === 'ios',
            ...(Platform.OS === 'ios' && {
              presentationStyle:
                ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN,
            }),
          });
          if (!result.canceled && result.assets?.length) {
            setMediaUploadProgress(0.4);
            const assets = result.assets;
            const valid = assets.filter((a) => {
              const durationMs =
                (a as { duration?: number }).duration ?? 0;
              return durationMs <= MAX_VIDEO_DURATION_MS;
            });
            const skipped = assets.length - valid.length;
            if (skipped > 0) {
              Alert.alert('提示', '有視頻超過 5 分鐘已跳過，請選擇 5 分鐘以內的視頻');
            }
            if (valid.length > 0) {
              setMediaUploadProgress(0.7);
              requestAnimationFrame(() => {
                appendAssetsToPostMedia(valid, 'video');
                setMediaUploadProgress(1);
                setTimeout(() => setMediaUploadProgress(null), 400);
              });
            } else {
              setMediaUploadProgress(null);
            }
          } else {
            setMediaUploadProgress(null);
          }
        } catch (e) {
          setMediaUploadProgress(null);
          const msg = String((e as Error)?.message ?? '');
          if (msg.includes('3164') || msg.includes('PHPhotosError')) {
            Alert.alert(
              '無法加載視頻',
              '該視頻可能存儲在 iCloud 且未下載到本機。請先在「照片」中打開該視頻，等待下載完成後再試。'
            );
          } else {
            console.warn(e);
          }
        }
      }, 200);
    });
  }, [postMedia.length, appendAssetsToPostMedia]);

  useEffect(() => {
    const videosToProcess = postMedia.filter(
      (m) => m.type === 'video' && !m.thumbnailUri
    );
    if (videosToProcess.length === 0) return;
    let cancelled = false;
    const task = InteractionManager.runAfterInteractions(() => {
      if (cancelled) return;
      Promise.all(
        videosToProcess.map(async (item) => {
          try {
            const { uri: thumbUri } = await VideoThumbnails.getThumbnailAsync(
              item.uri,
              { time: 0 }
            );
            return { videoUri: item.uri, thumbnailUri: thumbUri };
          } catch {
            return { videoUri: item.uri, thumbnailUri: null as string | null };
          }
        })
      ).then((results) => {
        if (cancelled) return;
        setPostMedia((prev) =>
          prev.map((m) => {
            const r = results.find((x) => x.videoUri === m.uri);
            if (r?.thumbnailUri && m.type === 'video')
              return { ...m, thumbnailUri: r.thumbnailUri };
            return m;
          })
        );
      });
    });
    return () => {
      cancelled = true;
      task.cancel();
    };
  }, [postMedia]);

  const removePostMedia = useCallback((uri: string) => {
    setPostMedia((prev) => prev.filter((m) => m.uri !== uri));
  }, []);

  const reorderPostMedia = useCallback((fromIndex: number, toIndex: number) => {
    setPostMedia((prev) => {
      const arr = [...prev];
      const [removed] = arr.splice(fromIndex, 1);
      arr.splice(toIndex, 0, removed);
      return arr;
    });
  }, []);

  useEffect(() => {
    mockApi.fetchDiaryEntries().then(setEntries);
  }, []);

  useEffect(() => {
    if (route.params?.openAdd) {
      setAddModalVisible(true);
    }
  }, [route.params?.openAdd]);

  const filteredEntries = filterDate
    ? entries.filter((e) => e.date === filterDate)
    : entries;

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
    const hasMedia = postMedia.length > 0;
    if (!userInput && !hasMedia) return;
    setIsGenerating(true);
    try {
      const imageUrlsFromType = postMedia
        .filter((m) => m.type === 'image')
        .map((m) => m.uri);
      const imageUrls =
        imageUrlsFromType.length > 0
          ? imageUrlsFromType
          : postMedia
              .filter((m) => m.type !== 'video')
              .map((m) => m.uri);
      const videoUrls = postMedia
        .filter((m) => m.type === 'video')
        .map((m) => m.uri);
      const videoThumbnailUrls = postMedia
        .filter((m) => m.type === 'video')
        .map((m) => m.thumbnailUri);
      const firstVideo = videoUrls[0] ?? null;
      const firstImage = imageUrls[0] ?? firstVideo ?? null;
      const mediaOrder = (() => {
        const order = postMedia
          .map((m) => m.type)
          .filter((t): t is 'image' | 'video' => t === 'image' || t === 'video');
        if (order.length > 0) return order;
        return [
          ...imageUrls.map(() => 'image' as const),
          ...videoUrls.map(() => 'video' as const),
        ];
      })();
      const newEntry = await mockApi.createDiaryEntry(
        userInput,
        null,
        firstImage,
        imageUrls.length > 0 ? imageUrls : null,
        selectedMood ?? 'happy',
        videoUrls.length > 0 ? videoUrls[0] : null,
        mediaOrder,
        videoThumbnailUrls[0] ?? null,
        videoUrls.length > 0 ? videoUrls : null,
        videoThumbnailUrls.length > 0 ? videoThumbnailUrls : null
      );
      const entryToAdd: DiaryEntry = {
        ...newEntry,
        imageUrl: firstImage ?? newEntry.imageUrl ?? undefined,
        imageUrls:
          imageUrls.length > 0
            ? [...imageUrls]
            : newEntry.imageUrls && newEntry.imageUrls.length > 0
              ? newEntry.imageUrls
              : firstImage
                ? [firstImage]
                : undefined,
        videoUrl: newEntry.videoUrl ?? firstVideo ?? undefined,
        videoUrls:
          newEntry.videoUrls ?? (videoUrls.length > 0 ? videoUrls : undefined),
        videoThumbnailUrl:
          newEntry.videoThumbnailUrl ?? videoThumbnailUrls[0],
        videoThumbnailUrls:
          newEntry.videoThumbnailUrls ??
          (videoThumbnailUrls.length > 0
            ? (videoThumbnailUrls as (string | undefined)[])
            : undefined),
        mediaOrder: newEntry.mediaOrder ?? mediaOrder,
      };
      setEntries((prev) => [entryToAdd, ...prev]);
      setUserInput('');
      setPostMedia([]);
      setSelectedMood('happy');
      setAddModalVisible(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const canAddMedia = postMedia.length < MAX_DIARY_MEDIA;
  const closeAddModal = () => {
    Keyboard.dismiss();
    setAddModalVisible(false);
    setUserInput('');
    setPostMedia([]);
    setSelectedMood('happy');
  };

  const performDelete = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setGeneratedResults((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setConfirmDeleteId(null);
  };

  const handleMoodBarPress = useCallback(() => {
    if (!moodSelectMode) {
      setMoodSelectMode(true);
      setSelectedMoodImageUrls([]);
      return;
    }
    if (selectedMoodImageUrls.length === 0) {
      setMoodSelectMode(false);
      return;
    }
    setGeneratingTotal(selectedMoodImageUrls.length);
    setGeneratingCurrent(0);
    setGeneratingPhase('progress');
    setGeneratingVisible(true);
  }, [moodSelectMode, selectedMoodImageUrls.length]);

  const handleMoodImageToggle = useCallback((uri: string) => {
    setSelectedMoodImageUrls((prev) =>
      prev.includes(uri) ? prev.filter((u) => u !== uri) : [...prev, uri]
    );
  }, []);

  const handleDeleteGeneratedResult = useCallback((entryId: string) => {
    setGeneratedResults((prev) => {
      const next = { ...prev };
      delete next[entryId];
      return next;
    });
  }, []);

  const handleRegenerateComic = useCallback((entryId: string) => {
    setGeneratedResults((prev) => {
      const next = { ...prev };
      delete next[entryId];
      return next;
    });
    setEntryIdForMood(entryId);
    setMoodSelectMode(true);
    setSelectedMoodImageUrls([]);
  }, []);

  const handleEditGeneratedComic = useCallback((_entryId: string) => {
    // 编辑生成漫画：可在此打开编辑弹窗或跳转编辑页
  }, []);

  const textColor = dark ? '#f8fafc' : colors.gray[800];
  const subColor = dark ? colors.gray[400] : colors.gray[500];
  const glassBg = dark ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.9)';
  const glassBorder = dark
    ? 'rgba(255,255,255,0.08)'
    : 'rgba(255,255,255,0.2)';

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
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing.md },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ViewHeader
          title="情緒價值日記"
          onBack={() => navigation.goBack()}
          rightElement={
            <Pressable
              onPress={() => navigation.navigate('Calendar')}
              style={[
                styles.calendarBtn,
                { backgroundColor: glassBg, borderColor: glassBorder },
              ]}
            >
              <Calendar size={22} color={colors.orange[500]} />
            </Pressable>
          }
        />

        {filterDate && (
          <DiaryFilterBar
            filterDate={filterDate}
            subColor={subColor}
            onReplaceDate={() => navigation.navigate('Calendar')}
          />
        )}

        {filteredEntries.length === 0 ? (
          <DiaryEmptyState dark={dark} glassBg={glassBg} />
        ) : (
          filteredEntries.map((entry) => {
            const images =
              entry.imageUrls && entry.imageUrls.length > 0
                ? entry.imageUrls.filter(Boolean)
                : entry.imageUrl
                  ? [entry.imageUrl]
                  : [];
            let orderedMedia = getOrderedMedia(entry);
            if (orderedMedia.length === 0 && images.length > 0) {
              orderedMedia = images.map((uri) => ({ type: 'image' as const, uri }));
            }
            return (
              <DiaryEntryCard
                key={entry.id}
                entryId={entry.id}
                orderedMedia={orderedMedia}
                images={images}
                entryDate={entry.date}
                entryStyle={entry.style}
                content={entry.content}
                cellSize={entryGridCellSize}
                dark={dark}
                glassBg={glassBg}
                glassBorder={glassBorder}
                textColor={textColor}
                subColor={subColor}
                showDeleteConfirm={confirmDeleteId === entry.id}
                onDeleteRequest={() => setConfirmDeleteId(entry.id)}
                onDeleteConfirm={() => performDelete(entry.id)}
                onDeleteCancel={() => setConfirmDeleteId(null)}
                onVideoPress={setViewingVideoUri}
                onImagePress={openImageViewer}
                onEntryPress={
                  images.length > 0
                    ? () => {
                        setEntryIdForMood((prev) => {
                          if (prev === entry.id) {
                            setMoodSelectMode(false);
                            setSelectedMoodImageUrls([]);
                            return null;
                          }
                          return entry.id;
                        });
                      }
                    : undefined
                }
                showMoodPopup={entryIdForMood === entry.id}
                moodSelectMode={entryIdForMood === entry.id && moodSelectMode}
                selectedMoodImageUrls={
                  entryIdForMood === entry.id ? selectedMoodImageUrls : []
                }
                onMoodBarPress={
                  entryIdForMood === entry.id ? handleMoodBarPress : undefined
                }
                onMoodImageToggle={
                  entryIdForMood === entry.id ? handleMoodImageToggle : undefined
                }
                generatedResult={generatedResults[entry.id]}
                onDeleteGeneratedComic={() => handleDeleteGeneratedResult(entry.id)}
                onRegenerateComic={() => handleRegenerateComic(entry.id)}
                onEditGeneratedComic={() => handleEditGeneratedComic(entry.id)}
              />
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

      <DiaryAddModal
        visible={addModalVisible}
        onClose={closeAddModal}
        sheetHeightMax={sheetHeightMax}
        sheetHeightInitial={sheetHeightInitial}
        animatedSheetHeight={animatedSheetHeight}
        sheetPanHandlers={sheetPanResponder.panHandlers}
        dark={dark}
        insetsBottom={insets.bottom}
        textColor={textColor}
        subColor={subColor}
        glassBg={glassBg}
        glassBorder={glassBorder}
        userInput={userInput}
        onUserInputChange={setUserInput}
        selectedMood={selectedMood}
        onMoodSelect={setSelectedMood}
        postMedia={postMedia}
        onReorderMedia={reorderPostMedia}
        onRemoveMedia={removePostMedia}
        isDraggingMedia={isDraggingMedia}
        onDragStart={() => setIsDraggingMedia(true)}
        onDragEnd={() => setIsDraggingMedia(false)}
        canAddMedia={canAddMedia}
        onPickImages={pickImagesOnly}
        onPickVideos={pickVideosOnly}
        onBeautify={handleBeautify}
        isBeautifying={isBeautifying}
        onSend={handleGenerate}
        isGenerating={isGenerating}
        canSend={Boolean(userInput || postMedia.length > 0)}
        mediaUploadProgress={mediaUploadProgress}
      />

      <DiaryImageViewerModal
        visible={imageViewerVisible}
        urls={imageViewerUrls}
        currentIndex={imageViewerIndex}
        onClose={() => setImageViewerVisible(false)}
        onIndexChange={setImageViewerIndex}
      />

      {viewingVideoUri ? (
        <FullscreenVideoModal
          videoUri={viewingVideoUri}
          onClose={() => setViewingVideoUri(null)}
        />
      ) : null}

      <Modal
        visible={generatingVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.generatingOverlay}>
          <View style={[styles.generatingCard, { backgroundColor: dark ? colors.slate[900] : '#fff' }]}>
            <ActivityIndicator size="large" color={colors.orange[500]} />
            <Text style={[styles.generatingTitle, { color: dark ? '#f8fafc' : colors.gray[800] }]}>
              {generatingPhase === 'done'
                ? '生成完成'
                : generatingCurrent === 0
                  ? '正在生成...'
                  : `${generatingCurrent}/${generatingTotal} 已完成`}
            </Text>
            <Text style={[styles.generatingSub, { color: dark ? colors.gray[400] : colors.gray[500] }]}>
              {generatingPhase === 'done'
                ? '心里话 / 漫画已生成'
                : '请稍候'}
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  calendarBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'ios'
      ? {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        }
      : { elevation: 8 }),
  },
  generatingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  generatingCard: {
    borderRadius: 24,
    paddingVertical: spacing.xl * 1.5,
    paddingHorizontal: spacing.xl * 2,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 260,
  },
  generatingTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: spacing.lg,
  },
  generatingSub: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
});
