import React, { useCallback } from 'react';
import { View, FlatList, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVideoFeedList } from './useVideoFeedList';
import { VideoCell } from './VideoCell';
import { RefreshPromptOverlay } from './RefreshPromptOverlay';
import { VideoFeedTopBar } from './VideoFeedTopBar';
import { VideoSettingsSheet } from './VideoSettingsSheet';
import { videoFeedStyles } from './styles';
import { SCREEN_HEIGHT } from './constants';
import type { VideoFeedItem } from './types';
import type { Nav } from './useVideoFeedList';

export default function VideoFeedScreen({ navigation }: { navigation: Nav }) {
  const insets = useSafeAreaInsets();
  const {
    listRef,
    videos,
    feedMountKey,
    isScreenFocused,
    refreshing,
    showPullPrompt,
    listScrollEnabled,
    viewableIndex,
    showSettingsSheet,
    setShowSettingsSheet,
    playbackSpeed,
    setPlaybackSpeed,
    quality,
    setQuality,
    autoPlayNext,
    setAutoPlayNext,
    handleScroll,
    goToHome,
    goToMall,
    pullRefreshResponder,
    handleLike,
    handleCollect,
    handleComment,
    handleShare,
    onViewableItemsChanged,
    viewabilityConfig,
  } = useVideoFeedList(navigation);

  const renderItem = useCallback(
    ({ item, index }: { item: VideoFeedItem; index: number }) => (
      <VideoCell
        item={item}
        index={index}
        isActive={viewableIndex === index}
        isScreenFocused={isScreenFocused}
        onLike={handleLike}
        onCollect={handleCollect}
        onComment={handleComment}
        onShare={handleShare}
      />
    ),
    [viewableIndex, isScreenFocused, handleLike, handleCollect, handleComment, handleShare]
  );

  return (
    <View style={videoFeedStyles.container} {...pullRefreshResponder.panHandlers}>
      <FlatList
        key={feedMountKey}
        ref={listRef}
        data={videos}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        scrollEnabled={listScrollEnabled}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        getItemLayout={(_, index) => ({ length: SCREEN_HEIGHT, offset: SCREEN_HEIGHT * index, index })}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        bounces={false}
        overScrollMode="never"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        initialNumToRender={2}
        windowSize={5}
        maxToRenderPerBatch={2}
        removeClippedSubviews={Platform.OS === 'ios'}
      />

      <RefreshPromptOverlay
        visible={showPullPrompt}
        refreshing={refreshing}
        insetsTop={insets.top}
      />

      <VideoFeedTopBar
        insetsTop={insets.top}
        onGoHome={goToHome}
        onOpenSettings={() => setShowSettingsSheet(true)}
        onGoMall={goToMall}
      />

      <VideoSettingsSheet
        visible={showSettingsSheet}
        onClose={() => setShowSettingsSheet(false)}
        insetsBottom={insets.bottom}
        playbackSpeed={playbackSpeed}
        setPlaybackSpeed={setPlaybackSpeed}
        quality={quality}
        setQuality={setQuality}
        autoPlayNext={autoPlayNext}
        setAutoPlayNext={setAutoPlayNext}
      />
    </View>
  );
}
