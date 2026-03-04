import React from 'react';
import { View, Text, Modal, ScrollView, Pressable, Switch } from 'react-native';
import { BlurView } from 'expo-blur';
import { Gauge, Monitor, Download, RotateCw, X } from 'lucide-react-native';
import { SPEED_OPTIONS, QUALITY_OPTIONS } from './constants';
import { videoFeedStyles } from './styles';
import { spacing } from '../../theme/tokens';

/** 視頻設置底部上拉面板（擬態玻璃） */
export function VideoSettingsSheet({
  visible,
  onClose,
  insetsBottom,
  playbackSpeed,
  setPlaybackSpeed,
  quality,
  setQuality,
  autoPlayNext,
  setAutoPlayNext,
}: {
  visible: boolean;
  onClose: () => void;
  insetsBottom: number;
  playbackSpeed: number;
  setPlaybackSpeed: (v: number) => void;
  quality: string;
  setQuality: (v: string) => void;
  autoPlayNext: boolean;
  setAutoPlayNext: (v: boolean) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={videoFeedStyles.settingsOverlay} onPress={onClose} />
      <View style={[videoFeedStyles.settingsSheet, { paddingBottom: insetsBottom + spacing.lg }]} collapsable={false}>
        <BlurView intensity={72} tint="light" style={videoFeedStyles.settingsSheetBlur} />
        <View style={videoFeedStyles.settingsSheetGlassOverlay} pointerEvents="none" />
        <View style={videoFeedStyles.settingsSheetInner}>
          <View style={videoFeedStyles.settingsSheetHandle} />
          <View style={videoFeedStyles.settingsSheetHeader}>
            <Text style={videoFeedStyles.settingsSheetTitle}>播放設置</Text>
            <Pressable onPress={onClose} style={videoFeedStyles.settingsSheetClose}>
              <X size={24} color="#64748b" />
            </Pressable>
          </View>
          <ScrollView style={videoFeedStyles.settingsSheetContent} showsVerticalScrollIndicator={false}>
            {/* 倍速 */}
            <View style={videoFeedStyles.settingsSection}>
              <View style={[videoFeedStyles.settingsSectionTitle, videoFeedStyles.settingsSectionTitleWithChips]}>
                <Gauge size={20} color="#64748b" />
                <Text style={videoFeedStyles.settingsSectionLabel}>倍速</Text>
              </View>
              <View style={videoFeedStyles.speedChips}>
                {SPEED_OPTIONS.map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => setPlaybackSpeed(s)}
                    style={[videoFeedStyles.speedChip, playbackSpeed === s && videoFeedStyles.speedChipActive]}
                  >
                    <Text style={[videoFeedStyles.speedChipText, playbackSpeed === s && videoFeedStyles.speedChipTextActive]}>
                      {s === 1 ? '1x' : `${s}x`}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            {/* 清晰度 */}
            <View style={videoFeedStyles.settingsSection}>
              <View style={[videoFeedStyles.settingsSectionTitle, videoFeedStyles.settingsSectionTitleWithChips]}>
                <Monitor size={20} color="#64748b" />
                <Text style={videoFeedStyles.settingsSectionLabel}>清晰度</Text>
              </View>
              <View style={videoFeedStyles.qualityChips}>
                {QUALITY_OPTIONS.map((q) => (
                  <Pressable
                    key={q}
                    onPress={() => setQuality(q)}
                    style={[videoFeedStyles.qualityChip, quality === q && videoFeedStyles.qualityChipActive]}
                  >
                    <Text style={[videoFeedStyles.qualityChipText, quality === q && videoFeedStyles.qualityChipTextActive]}>{q}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            {/* 缓存视频：按鈕 */}
            <View style={videoFeedStyles.settingsSection}>
              <Pressable
                onPress={() => {}}
                style={({ pressed }) => [
                  videoFeedStyles.settingsActionRow,
                  videoFeedStyles.settingsActionRowTappable,
                  pressed && videoFeedStyles.settingsActionBtnPressed,
                ]}
              >
                <View style={videoFeedStyles.settingsSectionTitle}>
                  <Download size={20} color="#64748b" />
                  <Text style={videoFeedStyles.settingsSectionLabel}>緩存視頻</Text>
                </View>
              </Pressable>
            </View>
            {/* 自动连播 */}
            <View style={videoFeedStyles.settingsSection}>
              <View style={videoFeedStyles.settingsActionRow}>
                <View style={videoFeedStyles.settingsSectionTitle}>
                  <RotateCw size={20} color="#64748b" />
                  <Text style={videoFeedStyles.settingsSectionLabel}>自動連播</Text>
                </View>
                <Switch
                  value={autoPlayNext}
                  onValueChange={setAutoPlayNext}
                  trackColor={{ false: '#cbd5e1', true: '#22c55e' }}
                  thumbColor="#fff"
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
