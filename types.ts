// export const url_base = 'http://192.168.31.70:8000';
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
  ARTICLE_LIST = 'ARTICLE_LIST'
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
  date: string; // 格式: YYYY-MM-DD
  content: string;
  style: string;
  imageUrl?: string;
  petName?: string;
}

export interface Medication {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  time: string;
  dosage: string;
  isTaken: boolean;
  petName: string;
}

export interface Appointment {
  id: string;
  hospitalName: string;
  date: string; // YYYY-MM-DD
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
  'PENDING_PAY' |       // 待支付
  'PENDING_SHIP' |      // 待发货
  'PENDING_RECEIVE' |   // 待收货
  'PENDING_REVIEW' |    // 待评价
  'REFUND' |            // 退款中/已退款
  'COMPLETED';          // 已完成

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
  gender?: string;
  googleBound?: boolean;
  appleBound?: boolean;
  level?: number;
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
  replyToContent?: string;  // 添加被回复内容字段
}

export interface Post {
  id: number;
  author: string;
  avatar: string;
  time: string;
  content: string;
  fullContent?: string;
  images: string[];
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
}

export interface ScannerResult {
  riskIngredients: string[];
  safeIngredients: string[];
  resultUrl: string;
  summary: string;
}

export interface TranslatorResult {
  explanation: string;
  suggestions: string[];
  termExcerpts: string;
}
