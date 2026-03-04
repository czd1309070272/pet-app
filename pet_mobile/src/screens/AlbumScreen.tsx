import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Image,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, Upload, X, Camera, Image as GalleryIcon, Loader2, Trash2, Check } from 'lucide-react-native';
import type { AlbumPhoto } from '../types';
import * as mockApi from '../api/mock';
import { useApp } from '../context/AppContext';
import { colors, borderRadius, spacing } from '../theme/tokens';

type Category = 'ALL' | 'DAILY' | 'HEALTH' | 'TRAVEL';

const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'ALL', label: '全部' },
  { id: 'DAILY', label: '日常' },
  { id: 'HEALTH', label: '健康' },
  { id: 'TRAVEL', label: '戶外' },
];

export default function AlbumScreen({ navigation }: { navigation: { goBack: () => void } }) {
  const { isDarkMode } = useApp();
  const dark = isDarkMode;
  const insets = useSafeAreaInsets();
  const [photos, setPhotos] = useState<AlbumPhoto[]>([]);
  const [category, setCategory] = useState<Category>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  useEffect(() => {
    mockApi.fetchAlbumPhotos().then((data) => {
      setPhotos(data);
      setIsLoading(false);
    });
  }, []);

  const filteredPhotos = category === 'ALL' ? photos : photos.filter((p) => p.category === category);

  const handleAddPhoto = async (type: 'GALLERY' | 'CAMERA') => {
    setShowUploadMenu(false);
    setIsUploading(true);
    try {
      const newPhoto = await mockApi.addAlbumPhoto(category === 'ALL' ? 'DAILY' : category);
      setPhotos((prev) => [newPhoto, ...prev]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePhoto = async (id: string) => {
    try {
      await mockApi.deleteAlbumPhoto(id);
      setPhotos((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const textColor = dark ? '#f8fafc' : colors.gray[800];
  const subColor = dark ? colors.gray[400] : colors.gray[500];
  const glassBg = dark ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.8)';
  const glassBorder = dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.1)';

  return (
    <View style={[styles.container, { backgroundColor: dark ? colors.slate[950] : '#fff', paddingTop: insets.top }]}>
      <View style={[styles.header, { backgroundColor: glassBg, borderBottomColor: glassBorder }]}>
        <View style={styles.headerLeft}>
          <Pressable
            onPress={isEditMode ? () => setIsEditMode(false) : () => navigation.goBack()}
            style={[styles.headerBtn, { backgroundColor: dark ? colors.slate[800] : 'rgba(255,255,255,0.9)' }]}
          >
            {isEditMode ? (
              <Check size={22} color={colors.orange[500]} />
            ) : (
              <ArrowLeft size={22} color={dark ? '#f8fafc' : colors.gray[600]} />
            )}
          </Pressable>
          <View>
            <Text style={[styles.headerTitle, { color: textColor }]}>
              {isEditMode ? '管理相冊' : '萌寵時光館'}
            </Text>
            <Text style={[styles.headerSub, { color: colors.orange[500] }]}>
              {isEditMode ? '編輯模式' : `Archive · ${photos.length} Photos`}
            </Text>
          </View>
        </View>
        {!isEditMode && (
          <Pressable onPress={() => setShowUploadMenu(true)} style={styles.addBtn}>
            <Plus size={20} color="#fff" />
          </Pressable>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: spacing.xl * 2 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {!isEditMode && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat.id}
                onPress={() => setCategory(cat.id)}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: category === cat.id ? colors.orange[500] : (dark ? colors.slate[800] : colors.gray[100]),
                  },
                ]}
              >
                <Text style={[styles.categoryChipText, { color: category === cat.id ? '#fff' : subColor }]}>{cat.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        <View style={styles.grid}>
          {!isEditMode && (
            <Pressable
              onPress={() => setShowUploadMenu(true)}
              style={[styles.gridItem, styles.uploadPlaceholder, { backgroundColor: dark ? colors.slate[800] : colors.gray[50], borderColor: glassBorder }]}
            >
              <View style={[styles.uploadPlaceholderIcon, { backgroundColor: dark ? colors.slate[700] : '#fff' }]}>
                <Upload size={24} color={subColor} />
              </View>
              <Text style={[styles.uploadPlaceholderText, { color: subColor }]}>Upload New</Text>
            </Pressable>
          )}
          {filteredPhotos.map((photo) => (
            <Pressable
              key={photo.id}
              onPress={() => (isEditMode ? undefined : setViewingImage(photo.url))}
              onLongPress={() => setIsEditMode(true)}
              style={[
                styles.gridItem,
                { backgroundColor: glassBg, borderColor: glassBorder },
                isEditMode && styles.gridItemEdit,
              ]}
            >
              <Image source={{ uri: photo.url }} style={styles.gridImage} resizeMode="cover" />
              {!isEditMode && (
                <View style={styles.gridBadge}>
                  <Text style={styles.gridBadgeText}>{photo.category}</Text>
                </View>
              )}
              {isEditMode && (
                <Pressable
                  onPress={() => handleDeletePhoto(photo.id)}
                  style={styles.deletePhotoBtn}
                >
                  <Trash2 size={16} color="#fff" />
                </Pressable>
              )}
            </Pressable>
          ))}
        </View>

        {(isLoading || isUploading) && (
          <View style={styles.loadingWrap}>
            <Loader2 size={48} color={colors.orange[500]} />
            <Text style={[styles.loadingText, { color: subColor }]}>
              {isUploading ? 'Saving Moment...' : 'Loading Moments...'}
            </Text>
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      <Modal visible={!!showUploadMenu} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowUploadMenu(false)}>
          <Pressable onPress={(e) => e.stopPropagation()} style={[styles.uploadMenu, { backgroundColor: dark ? colors.slate[900] : '#fff', paddingBottom: 48 + insets.bottom }]}>
            <View style={styles.uploadMenuHeader}>
              <Text style={[styles.uploadMenuTitle, { color: textColor }]}>選擇上傳方式</Text>
              <Pressable onPress={() => setShowUploadMenu(false)}>
                <X size={24} color={subColor} />
              </Pressable>
            </View>
            <Pressable
              onPress={() => handleAddPhoto('CAMERA')}
              style={[styles.uploadMenuOption, { backgroundColor: 'rgba(249, 115, 22, 0.1)', borderColor: 'rgba(249, 115, 22, 0.2)' }]}
            >
              <View style={styles.uploadMenuOptionIcon}>
                <Camera size={24} color="#fff" />
              </View>
              <View>
                <Text style={[styles.uploadMenuOptionTitle, { color: textColor }]}>立即拍照</Text>
                <Text style={[styles.uploadMenuOptionSub, { color: subColor }]}>開啟相機捕捉現時精彩</Text>
              </View>
            </Pressable>
            <Pressable
              onPress={() => handleAddPhoto('GALLERY')}
              style={[styles.uploadMenuOption, { backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.2)' }]}
            >
              <View style={[styles.uploadMenuOptionIcon, { backgroundColor: '#3b82f6' }]}>
                <GalleryIcon size={24} color="#fff" />
              </View>
              <View>
                <Text style={[styles.uploadMenuOptionTitle, { color: textColor }]}>本地相冊上傳</Text>
                <Text style={[styles.uploadMenuOptionSub, { color: subColor }]}>從手機相冊中選取回憶</Text>
              </View>
            </Pressable>
            <Pressable onPress={() => setShowUploadMenu(false)}>
              <Text style={[styles.uploadMenuCancel, { color: subColor }]}>取消操作</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={!!viewingImage} transparent animationType="fade">
        <Pressable style={styles.viewerOverlay} onPress={() => setViewingImage(null)}>
          {viewingImage && (
            <Image source={{ uri: viewingImage }} style={styles.viewerImage} resizeMode="contain" />
          )}
          <Pressable
            style={[styles.viewerClose, { top: 40 + insets.top }]}
            onPress={() => setViewingImage(null)}
          >
            <X size={28} color="#fff" />
          </Pressable>
        </Pressable>
      </Modal>

      {isEditMode && (
        <Pressable
          onPress={() => setIsEditMode(false)}
          style={[styles.doneBtn, { backgroundColor: colors.orange[500], bottom: 40 + insets.bottom }]}
        >
          <Check size={18} color="#fff" />
          <Text style={styles.doneBtnText}>完成管理</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  headerSub: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.orange[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.xl, paddingBottom: spacing.xl * 2 },
  categoryRow: { marginBottom: spacing.xl },
  categoryChip: {
    marginRight: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
  },
  categoryChipText: { fontSize: 11, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg },
  gridItem: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
  },
  gridItemEdit: { opacity: 0.95 },
  gridImage: { width: '100%', height: '100%' },
  gridBadge: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  gridBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  uploadPlaceholder: {
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadPlaceholderIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  uploadPlaceholderText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  deletePhotoBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingWrap: { alignItems: 'center', paddingVertical: 48, gap: spacing.lg },
  loadingText: { fontSize: 14, fontWeight: '800', letterSpacing: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  uploadMenu: {
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: spacing.xl,
    paddingBottom: 48,
  },
  uploadMenuHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
  uploadMenuTitle: { fontSize: 18, fontWeight: '800' },
  uploadMenuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xl,
    borderRadius: 28,
    borderWidth: 1,
    marginBottom: spacing.md,
    gap: spacing.lg,
  },
  uploadMenuOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.orange[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadMenuOptionTitle: { fontSize: 16, fontWeight: '800' },
  uploadMenuOptionSub: { fontSize: 12, fontWeight: '600' },
  uploadMenuCancel: { fontSize: 14, fontWeight: '800', textAlign: 'center', marginTop: spacing.md, letterSpacing: 1 },
  viewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerImage: { maxWidth: '100%', maxHeight: '100%' },
  viewerClose: {
    position: 'absolute',
    right: spacing.xl,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  doneBtn: {
    position: 'absolute',
    bottom: 40,
    left: '50%',
    marginLeft: -80,
    width: 160,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  doneBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});
