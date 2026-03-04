import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Video, Camera, Image as ImageIcon, X, Play, Pause } from 'lucide-react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../navigation/types';
import type { PetBehaviorAnalysisReport } from '../types';
import { ViewHeader } from '../components/shared/CommonUI';
import { useApp } from '../context/AppContext';
import { colors, borderRadius, spacing } from '../theme/tokens';
import { pickVideoFromCamera, pickVideoFromAlbum } from '../utils/imagePicker';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEvent } from 'expo';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'PetBehaviorAnalysis'>;

/** 本地视频预览组件 */
function VideoPreview({ uri, onRemove }: { uri: string; onRemove: () => void }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
  });
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
  const { width } = useWindowDimensions();
  const previewWidth = width - 2 * spacing.xl;
  const previewHeight = previewWidth * (9 / 16);

  const togglePlay = () => {
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  return (
    <View style={styles.videoPreviewWrap}>
      <View style={[styles.videoPreviewBox, { width: previewWidth, height: previewHeight }]}>
        <VideoView
          style={StyleSheet.absoluteFill}
          player={player}
          contentFit="contain"
        />
        <Pressable style={styles.videoOverlay} onPress={togglePlay}>
          {isPlaying ? (
            <Pause size={48} color="rgba(255,255,255,0.9)" />
          ) : (
            <Play size={48} color="rgba(255,255,255,0.9)" />
          )}
        </Pressable>
        <Pressable style={styles.videoRemoveBtn} onPress={onRemove}>
          <X size={20} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

export default function PetBehaviorAnalysisScreen({
  navigation,
}: {
  navigation: Nav;
}) {
  const insets = useSafeAreaInsets();
  const { isDarkMode } = useApp();
  const dark = isDarkMode;
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const glassBg = dark ? 'rgba(30,41,59,0.85)' : 'rgba(255,255,255,0.7)';
  const glassBorder = dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.45)';
  const textColor = dark ? '#f8fafc' : colors.gray[800];
  const subColor = dark ? colors.gray[400] : colors.gray[500];

  const SHOOT_TIP = '為獲得更準確的分析結果，建議盡量保持手機水平，並從寵物的側面進行拍攝。';
  const ALBUM_TIP = '為獲得更準確的分析結果，建議選擇畫面盡量水平、且能清楚看到寵物側面姿態的視頻。';

  const pickFromCamera = async () => {
    Alert.alert('拍攝提示', SHOOT_TIP, [
      { text: '取消', style: 'cancel' },
      { text: '知道了', onPress: async () => {
        const result = await pickVideoFromCamera();
        if (result) setVideoUri(result.uri);
      } },
    ]);
  };

  const pickFromAlbum = async () => {
    Alert.alert('選擇提示', ALBUM_TIP, [
      { text: '取消', style: 'cancel' },
      { text: '知道了', onPress: async () => {
        const result = await pickVideoFromAlbum();
        if (result) setVideoUri(result.uri);
      } },
    ]);
  };

  const handleStartAnalysis = async () => {
    if (!videoUri) {
      Alert.alert('提示', '請先上傳寵物行為視頻');
      return;
    }
    setIsUploading(true);
    try {
      // TODO: 替換為實際後端 API 調用，例如：
      // const report = await api.analyzePetBehavior(videoUri);
      const report: PetBehaviorAnalysisReport = await new Promise((resolve) => {
        setTimeout(
          () =>
            resolve({
              posture: '站立',
              tailPosition: '尾巴高翹輕微搖擺，表現開心放鬆',
              earPosition: '耳朵前傾，呈好奇狀態',
              legPosture: '正常行走，步態自然',
              abnormalBehaviors: '未發現明顯異常行為',
              energyLevel: '高能量，活潑好動',
              analysisImages: [
                { url: 'https://picsum.photos/seed/behavior1/400/300', label: '姿勢分析' },
                { url: 'https://picsum.photos/seed/behavior2/400/300', label: '尾部狀態' },
                { url: 'https://picsum.photos/seed/behavior3/400/300', label: '步態關鍵幀' },
              ],
            }),
          1200
        );
      });
      navigation.navigate('PetBehaviorAnalysisResult', { videoUri, report });
    } catch (err) {
      Alert.alert('分析失敗', '請稍後再試');
    } finally {
      setIsUploading(false);
    }
  };

  const removeVideo = () => setVideoUri(null);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ViewHeader title="寵物行為分析" onBack={() => navigation.goBack()} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.desc, { color: subColor }]}>
          上傳寵物行為視頻，AI 將為您分析寵物的行為模式與情緒狀態
        </Text>

        {videoUri ? (
          <VideoPreview uri={videoUri} onRemove={removeVideo} />
        ) : (
          <View style={[styles.uploadArea, { backgroundColor: glassBg, borderColor: glassBorder }]}>
            <View style={[styles.uploadIconWrap, { backgroundColor: dark ? 'rgba(34,197,94,0.2)' : '#dcfce7' }]}>
              <Video size={40} color="#22c55e" />
            </View>
            <Text style={[styles.uploadHint, { color: textColor }]}>選擇視頻進行行為分析</Text>
            <View style={styles.uploadActions}>
              <Pressable
                onPress={pickFromCamera}
                style={({ pressed }) => [
                  styles.uploadBtn,
                  { backgroundColor: dark ? 'rgba(34,197,94,0.25)' : '#dcfce7', borderColor: '#22c55e', opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <Camera size={22} color="#22c55e" />
                <Text style={[styles.uploadBtnText, { color: '#22c55e' }]}>拍攝視頻</Text>
              </Pressable>
              <Pressable
                onPress={pickFromAlbum}
                style={({ pressed }) => [
                  styles.uploadBtn,
                  { backgroundColor: dark ? 'rgba(34,197,94,0.25)' : '#dcfce7', borderColor: '#22c55e', opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <ImageIcon size={22} color="#22c55e" />
                <Text style={[styles.uploadBtnText, { color: '#22c55e' }]}>從相冊選擇</Text>
              </Pressable>
            </View>
          </View>
        )}

        {videoUri && (
          <View style={styles.analysisSection}>
            <Pressable
              onPress={handleStartAnalysis}
              disabled={isUploading}
              style={({ pressed }) => [
                styles.analyzeBtn,
                { opacity: pressed || isUploading ? 0.85 : 1 },
              ]}
            >
              {isUploading ? (
                <>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.analyzeBtnText}>上傳中...</Text>
                </>
              ) : (
                <>
                  <Video size={22} color="#fff" />
                  <Text style={styles.analyzeBtnText}>開始分析</Text>
                </>
              )}
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: spacing.xl,
    paddingBottom: 48,
  },
  desc: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  uploadArea: {
    borderRadius: borderRadius['3xl'],
    borderWidth: 1,
    padding: spacing['2xl'],
    alignItems: 'center',
    minHeight: 200,
    justifyContent: 'center',
  },
  uploadIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  uploadHint: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: spacing.xl,
  },
  uploadActions: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
  },
  uploadBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  videoPreviewWrap: {
    marginBottom: spacing.xl,
  },
  videoPreviewBox: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoRemoveBtn: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  analysisSection: {
    marginTop: spacing.lg,
  },
  analyzeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: '#22c55e',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
  },
  analyzeBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});
