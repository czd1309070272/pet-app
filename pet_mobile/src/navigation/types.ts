import type { PetProfile, Order, PetBehaviorAnalysisReport } from '../types';

export type RootStackParamList = {
  Auth: undefined;
  Main: { screen?: keyof MainTabParamList; params?: object } | undefined;
};

export type MainTabParamList = {
  HomeTab: { screen?: keyof HomeStackParamList; params?: object } | undefined;
  /** 可指定初始 screen，例如 { screen: 'VideoFeed' } 探索首屏為短視頻，{ screen: 'Discovery' } 為商城 */
  DiscoveryTab: { screen?: keyof DiscoveryStackParamList } | undefined;
  FabTab: undefined;
  CommunityTab: { screen?: keyof CommunityStackParamList; params?: object } | undefined;
  ProfileTab: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  PetProfile: { pet: PetProfile };
  Diary: { filterDate?: string | null; openAdd?: boolean } | undefined;
  PetBehaviorAnalysis: undefined;
  PetBehaviorAnalysisResult: { videoUri: string; report: PetBehaviorAnalysisReport };
  Medication: undefined;
  Calendar: undefined;
  Wallet: undefined;
  Appointment: undefined;
  /** 健康檢測 + 成分分析 + 報告翻譯 三合一，可選 initialTab */
  Detect: { initialTab?: 'HEALTH' | 'SCANNER' | 'TRANSLATOR' } | undefined;
  HistoryReport: { type: 'HEALTH' | 'SCANNER' | 'TRANSLATOR' };
  AIConsultant: undefined;
  ArticleList: undefined;
  ArticleDetail: { articleId: string };
  StarryMemorial: { pet: PetProfile };
  Album: undefined;
};

export type DiscoveryStackParamList = {
  VideoFeed: undefined;
  Discovery: undefined;
  ProductDetail: { productId: string };
  Cart: undefined;
};

export type CommunityStackParamList = {
  Community: { openPost?: boolean } | undefined;
  CommunityHistory: undefined;
};

export type ProfileStackParamList = {
  Profile: { openAddPet?: boolean } | undefined;
  Settings: undefined;
  PersonalInfo: undefined;
  Address: undefined;
  Orders: { initialTab?: string };
  Logistics: { order: Order };
  Membership: undefined;
  Album: undefined;
  Insurance: undefined;
  HistoryReport: { type: 'HEALTH' | 'SCANNER' | 'TRANSLATOR' };
  /** 从「我的」进入时在 Profile 栈内 push，返回回到「我的」 */
  Cart: undefined;
  Medication: undefined;
  Wallet: undefined;
  Appointment: undefined;
};
