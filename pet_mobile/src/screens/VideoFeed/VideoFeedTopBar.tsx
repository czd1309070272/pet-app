import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Home, Settings, ShoppingBag } from 'lucide-react-native';
import { videoFeedStyles } from './styles';
import { spacing } from '../../theme/tokens';

/** 頂部：左側 Home 返回主頁、設置圖標，右側商城入口 */
export function VideoFeedTopBar({
  insetsTop,
  onGoHome,
  onOpenSettings,
  onGoMall,
}: {
  insetsTop: number;
  onGoHome: () => void;
  onOpenSettings: () => void;
  onGoMall: () => void;
}) {
  return (
    <View style={[videoFeedStyles.topBar, { paddingTop: insetsTop + spacing.sm }]} pointerEvents="box-none">
      <View style={videoFeedStyles.topBarLeft}>
        <Pressable
          onPress={onGoHome}
          style={({ pressed }) => [videoFeedStyles.homeBtn, pressed && videoFeedStyles.pressed]}
        >
          <Home size={22} color="#fff" />
          <Text style={videoFeedStyles.homeBtnText}>首頁</Text>
        </Pressable>
        <Pressable
          onPress={onOpenSettings}
          style={({ pressed }) => [videoFeedStyles.settingsBtn, pressed && videoFeedStyles.pressed]}
        >
          <Settings size={22} color="#fff" />
        </Pressable>
      </View>
      <View style={videoFeedStyles.topBarSpacer} />
      <Pressable
        onPress={onGoMall}
        style={({ pressed }) => [videoFeedStyles.mallEntry, pressed && videoFeedStyles.pressed]}
      >
        <ShoppingBag size={22} color="#fff" />
        <Text style={videoFeedStyles.mallEntryText}>商城</Text>
      </Pressable>
    </View>
  );
}
