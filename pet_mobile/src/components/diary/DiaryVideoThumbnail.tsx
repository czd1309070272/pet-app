import React, { useState, useEffect } from 'react';
import { View, Image, Pressable, StyleSheet } from 'react-native';
import { Play } from 'lucide-react-native';
import * as VideoThumbnails from 'expo-video-thumbnails';

const videoThumbCache = new Map<string, string>();

const styles = StyleSheet.create({
  playWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export function DiaryVideoThumbnail({
  videoUri,
  thumbnailUri,
  style,
  playSize = 28,
  onPress,
}: {
  videoUri: string;
  thumbnailUri?: string;
  style?: object;
  playSize?: number;
  onPress: () => void;
}) {
  const [thumb, setThumb] = useState<string | null>(
    () => thumbnailUri ?? videoThumbCache.get(videoUri) ?? null
  );

  useEffect(() => {
    if (thumb) return;
    let cancelled = false;
    VideoThumbnails.getThumbnailAsync(videoUri, { time: 0 })
      .then(({ uri }) => {
        if (!cancelled) {
          videoThumbCache.set(videoUri, uri);
          setThumb(uri);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [videoUri, thumb, thumbnailUri]);

  return (
    <Pressable
      onPress={onPress}
      style={[{ backgroundColor: '#1e293b', overflow: 'hidden' }, style]}
    >
      {thumb ? (
        <>
          <Image
            source={{ uri: thumb }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
          <View
            style={[
              StyleSheet.absoluteFill,
              { justifyContent: 'center', alignItems: 'center' },
            ]}
          >
            <View style={styles.playWrap}>
              <Play size={playSize} color="#fff" fill="#fff" strokeWidth={0} />
            </View>
          </View>
        </>
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            { justifyContent: 'center', alignItems: 'center' },
          ]}
        >
          <View style={styles.playWrap}>
            <Play size={playSize} color="#fff" fill="#fff" strokeWidth={0} />
          </View>
        </View>
      )}
    </Pressable>
  );
}
