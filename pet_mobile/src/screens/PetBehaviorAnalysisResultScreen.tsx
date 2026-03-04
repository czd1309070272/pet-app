import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Play, Pause, Activity } from 'lucide-react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../navigation/types';
import type { PetBehaviorAnalysisReport } from '../types';
import { ViewHeader } from '../components/shared/CommonUI';
import { useApp } from '../context/AppContext';
import { colors, borderRadius, spacing } from '../theme/tokens';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEvent } from 'expo';
import { Pressable } from 'react-native';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'PetBehaviorAnalysisResult'>;

/** 结果页视频预览 */
function ResultVideoPreview({ uri }: { uri: string }) {
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
    <View style={[styles.videoBox, { width: previewWidth, height: previewHeight }]}>
      <VideoView style={StyleSheet.absoluteFill} player={player} contentFit="contain" />
      <Pressable style={styles.videoOverlay} onPress={togglePlay}>
        {isPlaying ? (
          <Pause size={48} color="rgba(255,255,255,0.9)" />
        ) : (
          <Play size={48} color="rgba(255,255,255,0.9)" />
        )}
      </Pressable>
    </View>
  );
}

const REPORT_ITEMS: { key: keyof PetBehaviorAnalysisReport; label: string }[] = [
  { key: 'posture', label: '當前姿勢' },
  { key: 'tailPosition', label: '尾巴位置與運動趨勢' },
  { key: 'earPosition', label: '耳朵位置' },
  { key: 'legPosture', label: '腿部姿態與步態' },
  { key: 'abnormalBehaviors', label: '異常行為' },
  { key: 'energyLevel', label: '整體活力水平' },
];

export default function PetBehaviorAnalysisResultScreen({
  navigation,
  route,
}: {
  navigation: Nav;
  route: { params: { videoUri: string; report: PetBehaviorAnalysisReport } };
}) {
  const insets = useSafeAreaInsets();
  const { isDarkMode } = useApp();
  const dark = isDarkMode;
  const { videoUri, report } = route.params;

  const reportBg = dark ? 'rgba(30,41,59,0.85)' : 'rgba(255,255,255,0.7)';
  const reportBorder = dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.45)';
  const headerBorderColor = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
  const labelColor = dark ? colors.gray[400] : colors.gray[500];
  const valueColor = dark ? '#f8fafc' : colors.gray[800];
  const sectionTitleColor = dark ? '#f8fafc' : colors.gray[800];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ViewHeader title="分析報告" onBack={() => navigation.goBack()} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.videoSection}>
          <Text style={[styles.sectionTitle, { color: sectionTitleColor }]}>原視頻</Text>
          <ResultVideoPreview uri={videoUri} />
        </View>

        {report.analysisImages && report.analysisImages.length > 0 && (
          <View style={[styles.imagesSection, { marginBottom: spacing.xl }]}>
            <Text style={[styles.sectionTitle, { color: sectionTitleColor }]}>重點分析截圖</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.imagesScrollContent}
            >
              {report.analysisImages.map((img, idx) => (
                <View key={idx} style={[styles.analysisImageCard, { backgroundColor: reportBg, borderColor: reportBorder }]}>
                  <Image source={{ uri: img.url }} style={styles.analysisImage} resizeMode="cover" />
                  {img.label ? (
                    <Text style={[styles.analysisImageLabel, { color: labelColor }]}>{img.label}</Text>
                  ) : null}
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={[styles.reportSection, { backgroundColor: reportBg, borderColor: reportBorder }]}>
          <View style={[styles.reportHeader, { borderBottomColor: headerBorderColor }]}>
            <Activity size={22} color="#22c55e" />
            <Text style={[styles.reportTitle, { color: valueColor }]}>行為分析報告</Text>
          </View>
          {REPORT_ITEMS.map(({ key, label }) => (
            <View key={key} style={styles.reportItem}>
              <Text style={[styles.reportLabel, { color: labelColor }]}>{label}</Text>
              <Text style={[styles.reportValue, { color: valueColor }]}>
                {report[key] || '—'}
              </Text>
            </View>
          ))}
        </View>
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
  videoSection: {
    marginBottom: spacing.xl,
  },
  imagesSection: {},
  imagesScrollContent: {
    paddingRight: spacing.xl,
  },
  analysisImageCard: {
    width: 200,
    marginRight: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  analysisImage: {
    width: '100%',
    height: 150,
  },
  analysisImageLabel: {
    fontSize: 12,
    padding: spacing.sm,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  videoBox: {
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
  reportSection: {
    borderRadius: borderRadius['3xl'],
    borderWidth: 1,
    padding: spacing.xl,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  reportItem: {
    marginBottom: spacing.xl,
  },
  reportLabel: {
    fontSize: 13,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  reportValue: {
    fontSize: 15,
    lineHeight: 24,
  },
});
