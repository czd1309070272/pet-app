// API base URL - 阶段二改为从 config 读取
export const url_base = '/api';

export enum View {
  HOME = 'HOME',
  HEALTH_SCAN = 'HEALTH_SCAN',
  SCANNER = 'SCANNER',
  TRANSLATOR = 'TRANSLATOR',
  DIARY = 'DIARY',
  INSURANCE = 'INSURANCE',
  MAP = 'MAP',
  COMMUNITY = 'COMMUNITY',
  PROFILE = 'PROFILE',
  SETTINGS = 'SETTINGS',
  CALENDAR = 'CALENDAR',
  PET_PROFILE = 'PET_PROFILE',
  HISTORY_HEALTH = 'HISTORY_HEALTH',
  HISTORY_SCANNER = 'HISTORY_SCANNER',
  HISTORY_TRANSLATOR = 'HISTORY_TRANSLATOR',
  MEDICATION = 'MEDICATION',
  WALLET = 'WALLET',
  APPOINTMENT = 'APPOINTMENT',
  MEMBERSHIP = 'MEMBERSHIP',
  ALBUM = 'ALBUM',
  DISCOVERY = 'DISCOVERY',
  AI_CONSULTANT = 'AI_CONSULTANT',
  PRODUCT_DETAIL = 'PRODUCT_DETAIL',
  CART = 'CART',
  COMMUNITY_HISTORY = 'COMMUNITY_HISTORY',
  ORDERS = 'ORDERS',
  LOGISTICS = 'LOGISTICS',
  ADDRESS = 'ADDRESS',
  PERSONAL_INFO = 'PERSONAL_INFO',
  STARRY_MEMORIAL = 'STARRY_MEMORIAL',
  ARTICLE_DETAIL = 'ARTICLE_DETAIL',
  ARTICLE_LIST = 'ARTICLE_LIST',
}

export interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  coverImage: string;
  author: string;
  date: string;
  category: string;
  readTime: string;
  likes: number;
}

export interface Address {
  id: string;
  receiverName: string;
  phone: string;
  area: string;
  detail: string;
  isDefault: boolean;
  label?: 'HOME' | 'WORK' | 'SCHOOL';
}

export interface CommunityHistoryItem {
  id: string;
  postId: number;
  author: string;
  authorAvatar: string;
  contentSnippet: string;
  time: string;
  type: 'WATCH' | 'LIKE' | 'COMMENT';
  commentText?: string;
  image?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  selected: boolean;
}

export interface Product {
  id: string;
  productId: string;
  name: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  category: 'FOOD' | 'TREAT' | 'HEALTH' | 'TOY';
  tag?: string;
  rating: number;
  sales: number;
  description?: string;
  detailImages?: string[];
}

export interface DiaryEntry {
  id: string;
  date: string;
  content: string;
  style: string;
  imageUrl?: string;
  /** 多图时使用，列表优先用此项；无则用 imageUrl */
  imageUrls?: string[];
  /** 视频 URI，与图片可同时存在（兼容旧数据，多视频时取第一个） */
  videoUrl?: string;
  /** 视频封面（第一帧）URI，用于列表展示（兼容旧数据） */
  videoThumbnailUrl?: string;
  /** 多个视频 URI，与 mediaOrder 配合还原顺序 */
  videoUrls?: string[];
  /** 多个视频封面 URI，与 videoUrls 一一对应（可能暂无封面） */
  videoThumbnailUrls?: (string | undefined)[];
  /** 媒体顺序，与 postMedia 拖拽顺序一致，用于还原九宫格顺序 */
  mediaOrder?: ('image' | 'video')[];
  petName?: string;
}

export interface Medication {
  id: string;
  name: string;
  date: string;
  time: string;
  dosage: string;
  isTaken: boolean;
  petName: string;
}

export interface Appointment {
  id: string;
  hospitalName: string;
  date: string;
  time: string;
  petName: string;
  type: string;
}

export interface Expense {
  id: string;
  amount: number;
  category: 'FOOD' | 'HEALTH' | 'PLAY' | 'BEAUTY';
  date: string;
  description: string;
  petName: string;
}

export interface WeightEntry {
  date: string;
  weight: number;
}

export interface Clinic {
  name: string;
  distance: string;
  is24h: boolean;
  address: string;
  phone: string;
}

export interface InsurancePolicy {
  id: string;
  petName: string;
  policyNumber: string;
  planName: string;
  expiryDate: string;
  coverage: number;
  status: 'ACTIVE' | 'EXPIRED' | 'PENDING';
  imageUrl: string;
}

export type OrderStatus =
  | 'PENDING_PAY'
  | 'PENDING_SHIP'
  | 'PENDING_RECEIVE'
  | 'PENDING_REVIEW'
  | 'REFUND'
  | 'COMPLETED';

export interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

export interface Order {
  id: string;
  status: OrderStatus;
  items: OrderItem[];
  totalPrice: number;
  date: string;
  trackingNumber?: string;
  addressId: number;
}

export interface LogisticsStep {
  time: string;
  status: string;
  desc: string;
  isCompleted?: boolean;
}

export interface UserInfo {
  id: string;
  username: string;
  name: string;
  avatar: string;
  isVIP: boolean;
  vipLevel: string;
  vipExpiry: string;
  phone?: string;
  email?: string;
  gender?: string;
  googleBound?: boolean;
  appleBound?: boolean;
  level?: number;
  token?: string;
  Expires_in?: number;
}

export interface PetProfile {
  id: string;
  name: string;
  breed: string;
  avatar: string;
  isMemorial: boolean;
  gender: string;
  birthday: string;
  hobbies: string;
  memorialDate?: string;
}

export interface AlbumPhoto {
  id: string;
  url: string;
  category: 'DAILY' | 'HEALTH' | 'TRAVEL' | 'ALL';
  date: string;
}

export interface Comment {
  id: string;
  author: string;
  avatar: string;
  content: string;
  time: string;
  likes: number;
  isLiked: boolean;
  isVIP?: boolean;
  vipLevel?: string;
  replyToName?: string;
  replies?: Comment[];
  replyToContent?: string;
  top_comment_id?: string;
}

export interface Post {
  id: number;
  author: string;
  avatar: string;
  time: string;
  content: string;
  fullContent?: string;
  images: string[];
  /** 视频列表 */
  videos?: string[];
  /** 媒体顺序（图片+视频混合时的展示顺序），有则优先用于渲染 */
  orderedMedia?: string[];
  likes: number;
  comments: number;
  isLiked: boolean;
  isV?: boolean;
  isVIP?: boolean;
  vipLevel?: string;
  userTags: string[];
  commentList: Comment[];
}

export interface HealthScanResult {
  status: 'Healthy' | 'Observation';
  desc: string;
  suggestions: string[];
  resultUrl: string;
  /** 報告編號 */
  reportNo?: string;
  /** 圖像分析摘要 */
  visualSummary?: string;
  /** 風險等級 */
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  /** 檢測結論說明 */
  diagnosis?: string;
}

export interface ScannerResult {
  riskIngredients: string[];
  safeIngredients: string[];
  resultUrl: string;
  summary: string;
}

/** 单组大白话翻译：解释 + 建议 */
export interface TranslatorExplainBlock {
  explanation: string;
  suggestions: string[];
}

export interface TranslatorResult {
  /** 原文术语片段（兼容：无 originalFragments 时用 termExcerpts 作为单条） */
  termExcerpts?: string;
  /** 原文片段，可能多条 */
  originalFragments?: string[];
  /** 单组结果时使用（兼容旧字段） */
  explanation?: string;
  suggestions?: string[];
  /** 大白话翻译解释+建议，可能多组 */
  translateBlocks?: TranslatorExplainBlock[];
}

/** 寵物行為分析報告 - 對應後端返回結構 */
export interface PetBehaviorAnalysisReport {
  /** 當前姿勢：站立、坐下、趴下、弓背、警戒等 */
  posture: string;
  /** 尾巴位置和運動趨勢：高翹搖擺=開心；低垂夾緊=害怕；快速左右=興奮 */
  tailPosition: string;
  /** 耳朵位置：前傾=好奇；後貼=緊張/恐懼 */
  earPosition: string;
  /** 腿部姿態和步態：正常行走、跛行、跳躍、僵硬 */
  legPosture: string;
  /** 是否有異常行為：頻繁舔爪、抖身、轉圈、抓地等，可能表示焦慮、癢、疼痛 */
  abnormalBehaviors: string;
  /** 整體活力水平：高能量、低能量、放鬆 */
  energyLevel: string;
  /** 分析到的異常或重點截圖（可選標籤說明） */
  analysisImages?: { url: string; label?: string }[];
}
