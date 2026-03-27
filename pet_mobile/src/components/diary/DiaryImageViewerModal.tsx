import React from 'react';
import {
  View,
  Text,
  Image,
  Modal,
  Pressable,
  FlatList,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { X } from 'lucide-react-native';
import { spacing } from '../../theme/tokens';

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
  },
  header: {
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
  indexText: { fontSize: 16, fontWeight: '700', color: 'rgba(255,255,255,0.9)' },
  closeBtn: { padding: spacing.sm },
  singleWrap: { flex: 1, justifyContent: 'center' },
});

export function DiaryImageViewerModal({
  visible,
  urls,
  currentIndex,
  onClose,
  onIndexChange,
}: {
  visible: boolean;
  urls: string[];
  currentIndex: number;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
}) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { width: windowWidth, height: windowHeight }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.header}>
          <Text style={styles.indexText}>
            {urls.length > 1 ? `${currentIndex + 1}/${urls.length}` : ''}
          </Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <X size={28} color="#fff" />
          </Pressable>
        </View>
        {urls.length > 1 ? (
          <FlatList
            data={urls}
            horizontal
            pagingEnabled
            initialScrollIndex={currentIndex}
            getItemLayout={(_, index) => ({
              length: windowWidth,
              offset: windowWidth * index,
              index,
            })}
            keyExtractor={(uri, i) => uri + i}
            onMomentumScrollEnd={(e) => {
              const i = Math.round(e.nativeEvent.contentOffset.x / windowWidth);
              onIndexChange?.(Math.min(i, urls.length - 1));
            }}
            renderItem={({ item }) => (
              <View
                style={{
                  width: windowWidth,
                  height: windowHeight,
                  justifyContent: 'center',
                }}
              >
                <Image
                  source={{ uri: item }}
                  style={{
                    width: windowWidth,
                    height: windowHeight,
                  }}
                  resizeMode="contain"
                />
              </View>
            )}
          />
        ) : (
          urls.length > 0 && (
            <View style={styles.singleWrap}>
              <Image
                source={{ uri: urls[0] }}
                style={{
                  width: windowWidth,
                  height: windowHeight,
                }}
                resizeMode="contain"
              />
            </View>
          )
        )}
      </View>
    </Modal>
  );
}
