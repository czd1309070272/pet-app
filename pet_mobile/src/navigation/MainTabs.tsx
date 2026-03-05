import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, StyleSheet, Animated, Pressable, Modal, InteractionManager } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { createBottomTabNavigator, BottomTabBar } from '@react-navigation/bottom-tabs';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { PlusCircle, FileEdit, MessageCircle, Activity } from 'lucide-react-native';

const TAB_ICONS = {
  home: require('../../assets/icon/home.png'),
  explore: require('../../assets/icon/explore.png'),
  community: require('../../assets/icon/community.png'),
  profile: require('../../assets/icon/profile.png'),
} as const;
import type { MainTabParamList } from './types';
import HomeStack from './HomeStack';
import DiscoveryStack from './DiscoveryStack';
import CommunityStack from './CommunityStack';
import ProfileStack from './ProfileStack';
import { useTabBarVisibility } from '../context/TabBarVisibilityContext';
import { useApp } from '../context/AppContext';
import { colors } from '../theme/tokens';

const Tab = createBottomTabNavigator<MainTabParamList>();
const TAB_BAR_OFFSET = 120;

function FabPlaceholder() {
  return (
    <View style={styles.fabPlaceholder}>
      <Text style={styles.fabPlaceholderText}>FAB</Text>
    </View>
  );
}

/** 当前是否在某个 Tab 的栈内详情页（非栈根） */
function isOnDetailScreen(tabState: BottomTabBarProps['state']): boolean {
  if (!tabState?.routes?.length) return false;
  const currentRoute = tabState.routes[tabState.index];
  const nested = (currentRoute as { state?: { index?: number; routes?: unknown[] } }).state;
  if (!nested?.routes?.length) return false;
  return (nested.index ?? 0) > 0 || nested.routes.length > 1;
}

function AnimatedTabBar(props: BottomTabBarProps) {
  const { isTabBarVisible } = useTabBarVisibility();
  const translateY = useRef(new Animated.Value(0)).current;
  const onDetail = isOnDetailScreen(props.state);

  useEffect(() => {
    const visible = isTabBarVisible && !onDetail;
    Animated.timing(translateY, {
      toValue: visible ? 0 : TAB_BAR_OFFSET,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [isTabBarVisible, onDetail, translateY]);

  const visible = isTabBarVisible && !onDetail;
  return (
    <Animated.View
      style={{ transform: [{ translateY }] }}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <BottomTabBar {...props} />
    </Animated.View>
  );
}

export default function MainTabs() {
  const { isDarkMode } = useApp();
  const { reportActivity } = useTabBarVisibility();
  const dark = isDarkMode;
  const [showFabModal, setShowFabModal] = useState(false);
  const rootNav = useNavigation<any>();

  const tabBarHorizontal = 20;
  const tabBarContentHeight = 48;
  const tabBarBottomPadding = 18;
  const tabBarBottomOffset = 10;
  const tabBarHeight = tabBarContentHeight + tabBarBottomPadding;

  const activeColor = '#f97316';
  const inactiveColor = dark ? '#6b7280' : '#E5E5E5';

  const tabBarBackground = () => (
    <View style={[StyleSheet.absoluteFill, styles.glassOuter]}>
      <BlurView
        intensity={64}
        tint={dark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          dark ? styles.glassTintDark : styles.glassTintLight,
        ]}
        pointerEvents="none"
      />
      <View
        style={[
          styles.glassHighlight,
          { backgroundColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.5)' },
        ]}
        pointerEvents="none"
      />
    </View>
  );

  return (
    <>
    <Tab.Navigator
      tabBar={(props) => <AnimatedTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: tabBarBottomOffset,
          left: tabBarHorizontal,
          right: tabBarHorizontal,
          height: tabBarHeight,
          borderRadius: tabBarHeight / 2,
          borderWidth: 1,
          borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)',
          backgroundColor: 'transparent',
          paddingTop: 6,
          paddingBottom: tabBarBottomPadding,
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: dark ? 0.35 : 0.12,
          shadowRadius: 24,
        },
        tabBarBackground,
        tabBarShowLabel: true,
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarLabelStyle: { fontSize: 13, fontWeight: '800' },
        tabBarItemStyle: { paddingVertical: 2 },
        tabBarButton: (props) => {
          const { onPress, ref: _ref, ...rest } = props;
          return (
            <Pressable
              {...rest}
              onPress={(e) => {
                reportActivity();
                onPress?.(e);
              }}
            />
          );
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{
          title: '首頁',
          tabBarIcon: ({ focused }) => (
            <Image source={TAB_ICONS.home} style={[styles.tabIcon, { opacity: focused ? 1 : 0.6 }]} />
          ),
        }}
      />
      <Tab.Screen
        name="DiscoveryTab"
        component={DiscoveryStack}
        listeners={() => ({
          tabPress: (e) => {
            e.preventDefault();
            // 延遲到當前交互完成後導航，避免與社群頁的滾動/焦點邏輯競態導致卡死
            InteractionManager.runAfterInteractions(() => {
              rootNav.navigate('Main', { screen: 'DiscoveryTab', params: { screen: 'VideoFeed' } });
            });
          },
        })}
        options={{
          title: '探索',
          tabBarIcon: ({ focused }) => (
            <Image source={TAB_ICONS.explore} style={[styles.tabIcon, { opacity: focused ? 1 : 0.6 }]} />
          ),
        }}
      />
      <Tab.Screen
        name="FabTab"
        component={FabPlaceholder}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            setShowFabModal(true);
          },
        })}
        options={{
          title: '',
          tabBarIcon: () => (
            <View style={styles.fab}>
              <PlusCircle size={28} color="#fff" />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="CommunityTab"
        component={CommunityStack}
        options={{
          title: '社群',
          tabBarIcon: ({ focused }) => (
            <Image source={TAB_ICONS.community} style={[styles.tabIcon, { opacity: focused ? 1 : 0.6 }]} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{
          title: '我的',
          tabBarIcon: ({ focused }) => (
            <Image source={TAB_ICONS.profile} style={[styles.tabIcon, { opacity: focused ? 1 : 0.6 }]} />
          ),
        }}
      />
    </Tab.Navigator>

      {/* FAB 快捷入口彈窗：寫日記、寵物行為分析、社群發布 */}
      <Modal visible={showFabModal} transparent animationType="fade">
        <Pressable style={styles.fabModalOverlay} onPress={() => setShowFabModal(false)}>
          <Pressable style={[styles.fabModalCard, dark ? styles.fabModalCardDark : styles.fabModalCardLight]} onPress={() => {}}>
                <Pressable
                  onPress={() => {
                    setShowFabModal(false);
                    rootNav.navigate('Main', { screen: 'HomeTab', params: { screen: 'Diary', params: { openAdd: true } } });
                  }}
                  style={({ pressed }) => [styles.fabModalItem, pressed && styles.fabModalItemPressed]}
                >
                  <View style={[styles.fabModalIconWrap, { backgroundColor: dark ? 'rgba(249,115,22,0.2)' : '#fff7ed' }]}>
                    <FileEdit size={24} color={colors.orange[500]} />
                  </View>
                  <Text style={[styles.fabModalLabel, { color: dark ? '#f8fafc' : colors.gray[800] }]}>寫日記</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setShowFabModal(false);
                    rootNav.navigate('Main', { screen: 'HomeTab', params: { screen: 'PetBehaviorAnalysis' } });
                  }}
                  style={({ pressed }) => [styles.fabModalItem, pressed && styles.fabModalItemPressed]}
                >
                  <View style={[styles.fabModalIconWrap, { backgroundColor: dark ? 'rgba(34,197,94,0.2)' : '#dcfce7' }]}>
                    <Activity size={24} color="#22c55e" />
                  </View>
                  <Text style={[styles.fabModalLabel, { color: dark ? '#f8fafc' : colors.gray[800] }]}>寵物行為分析</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setShowFabModal(false);
                    rootNav.navigate('Main', { screen: 'CommunityTab', params: { screen: 'Community', params: { openPost: true } } });
                  }}
                  style={({ pressed }) => [styles.fabModalItem, pressed && styles.fabModalItemPressed]}
                >
                  <View style={[styles.fabModalIconWrap, { backgroundColor: dark ? 'rgba(59,130,246,0.2)' : '#dbeafe' }]}>
                    <MessageCircle size={24} color="#2563eb" />
                  </View>
                  <Text style={[styles.fabModalLabel, { color: dark ? '#f8fafc' : colors.gray[800] }]}>社群發布</Text>
                </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    width: 30,
    height: 30,
  },
  glassOuter: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  // 毛玻璃疊加層：偏淡，讓背後模糊透出來
  glassTintLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  glassTintDark: {
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  // 頂部高光線，增強玻璃邊緣感
  glassHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
  },
  fabPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabPlaceholderText: { fontSize: 16, color: '#999' },
  fab: {
    width: 48,
    height: 48,
    borderRadius: 20,
    backgroundColor: '#f97316',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    paddingBottom: 100,
    paddingHorizontal: 24,
  },
  fabModalCard: {
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 24,
    minHeight: 100,
  },
  fabModalCardLight: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 12 },
  fabModalCardDark: { backgroundColor: 'rgba(30,41,59,0.95)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  fabModalItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 16,
  },
  fabModalItemPressed: { opacity: 0.8 },
  fabModalIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  fabModalLabel: { fontSize: 14, fontWeight: '800' },
});
