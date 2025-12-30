
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
  STARRY_MEMORIAL = 'STARRY_MEMORIAL'
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

export type OrderStatus = 'PENDING_PAY' | 'PENDING_SHIP' | 'PENDING_RECEIVE' | 'PENDING_REVIEW' | 'REFUND' | 'COMPLETED';

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
}

export interface LogisticsStep {
  time: string;
  status: string;
  desc: string;
  isCompleted?: boolean;
}
