/**
 * 发布弹窗内可拖拽排序的 9 宫格媒体网格
 */
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Image, Pressable, Modal, StyleSheet, PanResponder } from 'react-native';
import { Plus, Play, X } from 'lucide-react-native';
import type { PostMediaItem } from './types';
import { COMMUNITY_LAYOUT, MEDIA_GRID, MAX_MEDIA } from './constants';
import { colors, borderRadius, spacing } from '../../theme/tokens';

const { IMG_GAP, LONG_PRESS_MS } = COMMUNITY_LAYOUT;
const { modalCellSize } = MEDIA_GRID;

export interface DraggableMediaGridProps {
  items: PostMediaItem[];
  onReorder: (fromIndex: number, toIndex: number) => void;
  onRemove: (uri: string) => void;
  onAdd: () => void;
  dark: boolean;
  isAddDisabled?: boolean;
  /** 为 true 时不渲染网格内的 + 按钮（由外部提供图片/视频按钮） */
  hideAddButton?: boolean;
}

export function DraggableMediaGrid({
  items,
  onReorder,
  onRemove,
  onAdd,
  dark,
  isAddDisabled = false,
  hideAddButton = false,
}: DraggableMediaGridProps) {
  const gridRef = useRef<View>(null);
  const [gridLayout, setGridLayout] = useState<{ x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState<{ index: number; pageX: number; pageY: number } | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSwapIndex = useRef<number | null>(null);
  const dragSourceIndexRef = useRef<number | null>(null);

  const cellSize = modalCellSize;
  const cols = 3;

  const getCellIndexFromPosition = useCallback(
    (pageX: number, pageY: number) => {
      if (!gridLayout) return -1;
      const relX = pageX - gridLayout.x;
      const relY = pageY - gridLayout.y;
      const col = Math.floor(relX / (cellSize + IMG_GAP));
      const row = Math.floor(relY / (cellSize + IMG_GAP));
      if (col < 0 || col >= cols || row < 0) return -1;
      const idx = row * cols + col;
      return idx < items.length ? idx : -1;
    },
    [gridLayout, cellSize, items.length]
  );

  const createPanResponder = useCallback(
    (index: number) =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: (_, g) => {
          const startX = g.x0;
          const startY = g.y0;
          longPressTimer.current = setTimeout(() => {
            longPressTimer.current = null;
            lastSwapIndex.current = null;
            dragSourceIndexRef.current = index;
            setDragging({ index, pageX: startX, pageY: startY });
            try {
              const Haptics = require('expo-haptics')?.default;
              Haptics?.impactAsync?.('medium').catch(() => {});
            } catch { /* haptics not available */ }
          }, LONG_PRESS_MS);
        },
        onPanResponderMove: (_, g) => {
          if (longPressTimer.current) {
            if (Math.abs(g.dx) + Math.abs(g.dy) > 8) {
              clearTimeout(longPressTimer.current);
              longPressTimer.current = null;
            }
            return;
          }
          if (dragging && dragSourceIndexRef.current === index) {
            const targetIdx = getCellIndexFromPosition(g.moveX, g.moveY);
            if (targetIdx >= 0 && targetIdx !== index && targetIdx !== lastSwapIndex.current) {
              lastSwapIndex.current = targetIdx;
              onReorder(index, targetIdx);
              dragSourceIndexRef.current = targetIdx;
              setDragging((prev) => (prev ? { ...prev, index: targetIdx, pageX: g.moveX, pageY: g.moveY } : null));
            } else {
              setDragging((prev) => (prev ? { ...prev, pageX: g.moveX, pageY: g.moveY } : null));
            }
          }
        },
        onPanResponderRelease: () => {
          if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
          }
          dragSourceIndexRef.current = null;
          setDragging(null);
          lastSwapIndex.current = null;
        },
        onPanResponderTerminate: () => {
          if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
          }
          dragSourceIndexRef.current = null;
          setDragging(null);
        },
      }),
    [dragging, getCellIndexFromPosition, onReorder]
  );

  const handleGridLayout = useCallback(() => {
    gridRef.current?.measureInWindow((x, y) => setGridLayout({ x, y }));
  }, []);

  useEffect(() => {
    if (dragging) handleGridLayout();
  }, [dragging, handleGridLayout]);

  return (
    <View style={styles.wrap}>
      <View ref={gridRef} onLayout={handleGridLayout} style={[styles.grid, { gap: IMG_GAP }]}>
        {items.map((item, index) => {
          const cellSz = modalCellSize;
          const pan = createPanResponder(index);
          const isDragging = dragging?.index === index;
          return (
            <View
              key={item.uri}
              style={[
                styles.cell,
                { width: cellSz, height: cellSz },
                isDragging && styles.draggingCell,
              ]}
            >
              <View {...pan.panHandlers} style={{ flex: 1 }}>
                {item.type === 'video' ? (
                  <View style={[styles.thumb, styles.videoBg]}>
                    {item.thumbnailUri ? (
                      <>
                        <Image source={{ uri: item.thumbnailUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                        <View style={styles.videoPlayOverlay}>
                          <View style={styles.playIconWrap}>
                            <Play size={18} color="#fff" fill="#fff" strokeWidth={0} />
                          </View>
                        </View>
                      </>
                    ) : (
                      <View style={styles.playIconWrap}>
                        <Play size={18} color="#fff" fill="#fff" strokeWidth={0} />
                      </View>
                    )}
                  </View>
                ) : (
                  <Image source={{ uri: item.uri }} style={styles.thumb} resizeMode="cover" />
                )}
              </View>
              <Pressable onPress={() => onRemove(item.uri)} style={styles.removeBtn}>
                <X size={14} color="#fff" />
              </Pressable>
            </View>
          );
        })}
        {items.length < MAX_MEDIA && !hideAddButton && (
          <Pressable
            onPress={onAdd}
            disabled={isAddDisabled}
            style={[
              styles.addCell,
              { width: modalCellSize, height: modalCellSize },
              dark && styles.addCellDark,
              isAddDisabled && styles.addCellDisabled,
            ]}
          >
            <Plus size={26} color={colors.gray[500]} />
          </Pressable>
        )}
      </View>
      {dragging && (
        <Modal transparent visible animationType="none">
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <View
              style={[
                styles.dragOverlay,
                {
                  width: cellSize,
                  height: cellSize,
                  left: dragging.pageX - cellSize / 2,
                  top: dragging.pageY - cellSize / 2,
                },
              ]}
            >
              {items[dragging.index] &&
                (items[dragging.index].type === 'video' ? (
                  <View style={[styles.thumb, styles.videoBg]}>
                    {items[dragging.index].thumbnailUri ? (
                      <Image
                        source={{ uri: items[dragging.index].thumbnailUri! }}
                        style={StyleSheet.absoluteFill}
                        resizeMode="cover"
                      />
                    ) : null}
                    <View style={styles.videoPlayOverlay}>
                      <View style={styles.playIconWrap}>
                        <Play size={18} color="#fff" fill="#fff" strokeWidth={0} />
                      </View>
                    </View>
                  </View>
                ) : (
                  <Image
                    source={{ uri: items[dragging.index].uri }}
                    style={styles.thumb}
                    resizeMode="cover"
                  />
                ))}
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { borderRadius: borderRadius.lg, overflow: 'hidden', backgroundColor: '#f1f5f9' },
  thumb: { width: '100%', height: '100%' },
  videoBg: { backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
  videoPlayOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  playIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCell: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCellDark: { backgroundColor: 'rgba(30,41,59,0.6)', borderColor: 'rgba(255,255,255,0.06)' },
  addCellDisabled: { opacity: 0.5 },
  draggingCell: { opacity: 0.5 },
  dragOverlay: {
    position: 'absolute',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 12,
  },
});
