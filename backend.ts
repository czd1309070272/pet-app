
import { DiaryEntry, Medication, Appointment, Expense, WeightEntry, Clinic, InsurancePolicy, Product, CartItem, CommunityHistoryItem, Order, OrderStatus, Address } from './types';
// Import Google GenAI SDK as per guidelines
import { GoogleGenAI, Type } from "@google/genai";

/**
 * 模擬延遲函數
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- 數據隔離工具 ---
const clone = <T>(data: T): T => JSON.parse(JSON.stringify(data));

// --- 身份驗證數據接口 ---
export interface UserInfo {
  id: string;
  username: string; // 賬號名
  name: string;
  avatar: string;
  gender: string;
  phone: string;
  title: string;
  level: number;
  isVIP: boolean;
  vipLevel: string;
  vipExpiry: string;
  googleBound: boolean;
  appleBound: boolean;
}

// --- 內存存儲用戶信息，模擬持久化 ---
let activeUser: UserInfo | null = null;

const DEFAULT_USER: UserInfo = { 
  id: 'u123', 
  username: 'pawpal_888',
  name: '陳大萌', 
  avatar: 'https://picsum.photos/seed/owner/200', 
  gender: '男',
  phone: '13800138000',
  title: '資深鏟屎官', 
  level: 15,
  isVIP: true,
  vipLevel: 'SVIP',
  vipExpiry: '2025-12-31',
  googleBound: true,
  appleBound: false
};

// --- 地址數據 ---
let mockAddresses: Address[] = [
  {
    id: 'addr_1',
    receiverName: '陳大萌',
    phone: '138****8888',
    area: '香港特別行政區 中西區',
    detail: '中環康樂廣場8號 交易廣場 1座',
    isDefault: true,
    label: 'HOME'
  },
  {
    id: 'addr_2',
    receiverName: '陳小萌',
    phone: '139****1234',
    area: '香港特別行政區 灣仔區',
    detail: '軒尼詩道500號 希慎廣場 15樓',
    isDefault: false,
    label: 'WORK'
  }
];

export const fetchAddresses = async (): Promise<Address[]> => {
  await delay(600);
  return clone(mockAddresses);
};

export const saveAddress = async (address: Address): Promise<void> => {
  await delay(800);
  if (address.isDefault) {
    mockAddresses.forEach(a => a.isDefault = false);
  }
  const idx = mockAddresses.findIndex(a => a.id === address.id);
  if (idx > -1) {
    mockAddresses[idx] = address;
  } else {
    mockAddresses.push({ ...address, id: 'addr_' + Date.now() });
  }
};

export const deleteAddress = async (id: string): Promise<void> => {
  await delay(500);
  mockAddresses = mockAddresses.filter(a => a.id !== id);
};

// --- 社群歷史數據 ---
let mockCommunityHistory: CommunityHistoryItem[] = [
  {
    id: 'h1',
    postId: 1,
    author: '皮皮麻麻',
    authorAvatar: 'https://picsum.photos/seed/p1/100',
    contentSnippet: '大家有推薦的貓砂嗎？最近換了一款味道好重...',
    time: '2小時前',
    type: 'WATCH',
    image: 'https://picsum.photos/seed/catlitter1/600/600'
  },
  {
    id: 'h2',
    postId: 2,
    author: '測試官豆豆',
    authorAvatar: 'https://picsum.photos/seed/tester/100',
    contentSnippet: '這是一條自動生成的測試動態，用來驗證標籤系統...',
    time: '4小時前',
    type: 'LIKE',
    image: 'https://picsum.photos/seed/tp1/600/600'
  },
  {
    id: 'h3',
    postId: 1,
    author: '皮皮麻麻',
    authorAvatar: 'https://picsum.photos/seed/p1/100',
    contentSnippet: '大家有推薦的貓砂嗎？...',
    time: '1天前',
    type: 'COMMENT',
    commentText: '我試過 pidan 的，除臭效果挺好！',
    image: 'https://picsum.photos/seed/catlitter1/600/600'
  }
];

export const fetchCommunityHistory = async (type?: 'WATCH' | 'LIKE' | 'COMMENT'): Promise<CommunityHistoryItem[]> => {
  await delay(600);
  if (type) return clone(mockCommunityHistory.filter(h => h.type === type));
  return clone(mockCommunityHistory);
};

// --- 購物車數據 ---
let mockCart: CartItem[] = [
  {
    id: 'c1',
    productId: 'p1',
    name: 'PawPal 專屬天然低敏凍乾糧',
    price: 158,
    quantity: 1,
    imageUrl: 'https://picsum.photos/seed/catfood/400/400',
    selected: true
  }
];

export const fetchCart = async (): Promise<CartItem[]> => {
  await delay(600);
  return clone(mockCart);
};

export const addToCart = async (product: Product, quantity: number = 1): Promise<void> => {
  await delay(500);
  const existing = mockCart.find(item => item.productId === product.id);
  if (existing) {
    existing.quantity += quantity;
  } else {
    mockCart.push({
      id: 'c' + Date.now(),
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity,
      imageUrl: product.imageUrl,
      selected: true
    });
  }
};

export const updateCartItem = async (id: string, updates: Partial<CartItem>): Promise<void> => {
  const item = mockCart.find(i => i.id === id);
  if (item) Object.assign(item, updates);
};

export const removeFromCart = async (id: string): Promise<void> => {
  mockCart = mockCart.filter(i => i.id !== id);
};

export const clearSelectedCartItems = async (): Promise<void> => {
  mockCart = mockCart.filter(item => !item.selected);
};

// --- 訂單接口 ---
let mockOrders: Order[] = [
  {
    id: 'ORD-20250322-01',
    status: 'PENDING_SHIP',
    items: [
      {
        name: 'PawPal 專屬天然低敏凍乾糧',
        price: 158,
        quantity: 1,
        imageUrl: 'https://picsum.photos/seed/catfood/400/400'
      }
    ],
    totalPrice: 158,
    date: '2025-03-22 10:30',
    trackingNumber: 'SF1234567890'
  },
  {
    id: 'ORD-20250320-02',
    status: 'PENDING_PAY',
    items: [
      {
        name: '智能感應羽毛逗貓棒',
        price: 128,
        quantity: 1,
        imageUrl: 'https://picsum.photos/seed/cattoy/400/400'
      }
    ],
    totalPrice: 128,
    date: '2025-03-20 15:45'
  }
];

export const fetchOrders = async (status?: OrderStatus): Promise<Order[]> => {
  await delay(800);
  if (status && (status as string) !== 'ALL') {
    return clone(mockOrders.filter(o => o.status === status));
  }
  return clone(mockOrders);
};

export const createOrderFromCart = async (items: CartItem[], status: OrderStatus): Promise<Order> => {
  await delay(1000);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const newOrder: Order = {
    id: `ORD-${new Date().getTime()}`,
    status,
    items: items.map(i => ({
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      imageUrl: i.imageUrl
    })),
    totalPrice: total,
    date: new Date().toLocaleString()
  };
  mockOrders = [newOrder, ...mockOrders];
  return clone(newOrder);
};

export interface PetProfile {
  id: string;
  name: string;
  breed: string;
  gender: string;
  birthday: string;
  hobbies: string;
  avatar: string;
  isMemorial?: boolean;
  memorialDate?: string;
}

export interface AlbumPhoto {
  id: string;
  url: string;
  category: 'DAILY' | 'HEALTH' | 'TRAVEL';
}

export interface HealthScanResult {
  status: 'Healthy' | 'Observation';
  desc: string;
  suggestions: string[];
  resultUrl: string;
}

export interface ScannerResult {
  hasRisk: boolean;
  safeIngredients: string[];
  resultUrl: string;
  summary: string;
}

export interface TranslatorResult {
  explanation: string;
  suggestions: string[];
  termExcerpts: string;
}

// AI Utility: Convert file to Gemini Part for multi-modal requests
const fileToGenerativePart = async (file: File | Blob) => {
  const base64 = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: {
      data: base64,
      mimeType: file.type || 'image/jpeg',
    },
  };
};

export const login = async (username: string, password: string): Promise<UserInfo> => {
  await delay(1200);
  // 登入時默認模擬為 VIP，方便展示效果
  localStorage.setItem('isLoggedIn', 'true');
  localStorage.setItem('isVIP', 'true');
  localStorage.setItem('vipLevel', 'SVIP');
  activeUser = { ...DEFAULT_USER };
  return activeUser;
};

export const getCurrentUser = async (): Promise<UserInfo | null> => {
  const hasToken = localStorage.getItem('isLoggedIn') === 'true';
  if (!hasToken) return null;
  
  if (!activeUser) {
    activeUser = { ...DEFAULT_USER };
  }

  const isVipSaved = localStorage.getItem('isVIP') === 'true';
  activeUser.isVIP = isVipSaved;

  return activeUser;
};

export const updateUserProfile = async (data: Partial<UserInfo>): Promise<UserInfo> => {
  await delay(1000);
  if (!activeUser) activeUser = { ...DEFAULT_USER };
  activeUser = { ...activeUser, ...data };
  return activeUser;
};

export const logout = async (): Promise<void> => {
  await delay(500);
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('isVIP');
  activeUser = null;
};

// --- 寵物檔案數據 ---
let mockPets: PetProfile[] = [
  {
    id: 'pet_1',
    name: '麻薯',
    breed: '英短',
    gender: '小公主 (已絕育)',
    birthday: '2022-12-15',
    hobbies: '追羽毛球, 躺平',
    avatar: 'https://picsum.photos/seed/cat1/300'
  },
  {
    id: 'pet_2',
    name: '豆腐',
    breed: '薩摩耶',
    gender: '小王子 (已絕育)',
    birthday: '2023-01-20',
    hobbies: '拆家, 賣萌',
    avatar: 'https://picsum.photos/seed/dog2/300'
  },
  {
    id: 'pet_3',
    name: '糯米',
    breed: '金毛',
    gender: '小王子 (已絕育)',
    birthday: '2015-05-10',
    hobbies: '接盤子, 游泳',
    avatar: 'https://picsum.photos/seed/dog3/300',
    isMemorial: true,
    memorialDate: '2024-02-14'
  }
];

export const fetchPets = async (): Promise<PetProfile[]> => {
  await delay(600);
  return clone(mockPets);
};

export const addPet = async (pet: Omit<PetProfile, 'id'>): Promise<PetProfile> => {
  await delay(1500);
  const newPet = { ...pet, id: 'pet_' + Date.now() };
  mockPets = [...mockPets, newPet];
  return clone(newPet);
};

export const moveToMemorial = async (id: string): Promise<PetProfile> => {
  await delay(1200);
  const idx = mockPets.findIndex(p => p.id === id);
  if (idx !== -1) {
    mockPets[idx].isMemorial = true;
    mockPets[idx].memorialDate = new Date().toISOString().split('T')[0];
    return clone(mockPets[idx]);
  }
  throw new Error("Pet not found");
};

// 為了兼容之前的代碼
export const fetchPetProfile = async (): Promise<PetProfile> => {
  await delay(600);
  return clone(mockPets[0]);
};

export const updatePetProfile = async (data: Partial<PetProfile>): Promise<PetProfile> => {
  await delay(1200);
  const idx = mockPets.findIndex(p => p.id === data.id || p.name === data.name);
  if (idx !== -1) {
    mockPets[idx] = { ...mockPets[idx], ...data };
    return clone(mockPets[idx]);
  }
  return clone(mockPets[0]);
};

// --- 商品數據 ---
let mockProducts: Product[] = [
  {
    id: 'p1',
    name: 'PawPal 專屬天然低敏凍乾糧',
    price: 158,
    originalPrice: 199,
    imageUrl: 'https://picsum.photos/seed/catfood/400/400',
    category: 'FOOD',
    tag: 'AI 推薦',
    rating: 4.9,
    sales: 1205,
    description: '這是一款專為敏感腸胃設計的天然糧，採用低敏配方。',
    detailImages: [
      'https://picsum.photos/seed/p1d1/600/800',
      'https://picsum.photos/seed/p1d2/600/800',
      'https://picsum.photos/seed/p1d3/600/800'
    ]
  },
  {
    id: 'p2',
    name: '深海鱈魚皮手工零食 (50g)',
    price: 39,
    imageUrl: 'https://picsum.photos/seed/cattreat/400/400',
    category: 'TREAT',
    tag: '熱銷',
    rating: 4.8,
    sales: 3500,
    description: '100% 天然深海鱈魚皮，含豐富 Omega-3。',
    detailImages: ['https://picsum.photos/seed/p2d1/600/800']
  },
  {
    id: 'p3',
    name: '銀離子除臭噴霧 (無酒精)',
    price: 68,
    originalPrice: 88,
    imageUrl: 'https://picsum.photos/seed/health/400/400',
    category: 'HEALTH',
    tag: '特價',
    rating: 4.7,
    sales: 850,
    description: '物理除臭，對寵物和人類都安全無害。'
  },
  {
    id: 'p4',
    name: '智能感應羽毛逗貓棒',
    price: 128,
    imageUrl: 'https://picsum.photos/seed/cattoy/400/400',
    category: 'TOY',
    tag: '新品',
    rating: 5.0,
    sales: 420,
    description: '自動感應，多種運動模式讓貓咪不再無聊。'
  },
  {
    id: 'p5',
    name: '澳洲進口無穀物犬糧',
    price: 288,
    imageUrl: 'https://picsum.photos/seed/dogfood/400/400',
    category: 'FOOD',
    tag: '大包裝',
    rating: 4.9,
    sales: 610,
    description: '高品質澳洲進口糧，提供全面的營養支持。'
  }
];

export const fetchProducts = async (category?: Product['category']): Promise<Product[]> => {
  await delay(800);
  if (category) return clone(mockProducts.filter(p => p.category === category));
  return clone(mockProducts);
};

export const fetchProductById = async (id: string): Promise<Product | null> => {
  await delay(500);
  const p = mockProducts.find(prod => prod.id === id);
  return p ? clone(p) : null;
};

// --- 相冊數據 ---
let mockPhotos: AlbumPhoto[] = [
  { id: '1', url: 'https://picsum.photos/seed/cat_daily1/400', category: 'DAILY' },
  { id: '2', url: 'https://picsum.photos/seed/cat_health1/400', category: 'HEALTH' },
  { id: '3', url: 'https://picsum.photos/seed/cat_travel1/400', category: 'TRAVEL' },
  { id: '4', url: 'https://picsum.photos/seed/cat_daily2/400', category: 'DAILY' },
  { id: '5', url: 'https://picsum.photos/seed/cat_daily3/400', category: 'DAILY' },
];

export const fetchAlbumPhotos = async (): Promise<AlbumPhoto[]> => {
  await delay(500);
  return clone(mockPhotos);
};

export const addAlbumPhoto = async (category: AlbumPhoto['category']): Promise<AlbumPhoto> => {
  await delay(1000);
  const newPhoto: AlbumPhoto = {
    id: Date.now().toString(),
    url: `https://picsum.photos/seed/pet_new_${Date.now()}/400`,
    category
  };
  mockPhotos = [newPhoto, ...mockPhotos];
  return clone(newPhoto);
};

export const deleteAlbumPhoto = async (id: string): Promise<void> => {
  await delay(500);
  mockPhotos = mockPhotos.filter(p => p.id !== id);
};

// --- 保單相關數據 ---

let mockPolicies: InsurancePolicy[] = [
  {
    id: 'pol_1',
    petName: '麻薯',
    policyNumber: 'HKP-8827361',
    planName: '全面醫療保障 A 款',
    expiryDate: '2026-03-20',
    coverage: 50000,
    status: 'ACTIVE',
    imageUrl: 'https://picsum.photos/seed/policy1/600/800'
  }
];

export const fetchInsurancePolicies = async (): Promise<InsurancePolicy[]> => {
  await delay(800);
  return clone(mockPolicies);
};

export const saveInsurancePolicy = async (petName: string, imageFile: File | Blob): Promise<InsurancePolicy> => {
  await delay(2500); // 模擬 AI 識別與上傳時間
  const newPolicy: InsurancePolicy = {
    id: 'pol_' + Date.now(),
    petName,
    policyNumber: 'AI-' + Math.floor(1000000 + Math.random() * 9000000),
    planName: 'AI 識別中標計計劃',
    expiryDate: '2026-12-31',
    coverage: 30000,
    status: 'ACTIVE',
    imageUrl: URL.createObjectURL(imageFile) // 模擬上傳後的 URL
  };
  mockPolicies = [newPolicy, ...mockPolicies];
  return clone(newPolicy);
};

// --- 體重成長相關 ---
let mockWeightHistory: WeightEntry[] = [
  { date: '01-10', weight: 3.8 },
  { date: '02-15', weight: 4.0 },
  { date: '03-20', weight: 4.2 }
];

export const fetchWeightHistory = async (): Promise<WeightEntry[]> => {
  await delay(500);
  return clone(mockWeightHistory);
};

export const updatePetWeight = async (weight: number): Promise<WeightEntry[]> => {
  await delay(1000);
  const today = new Date();
  const dateStr = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  // 如果今天已經記過，則更新今天的體重，否則新增一條
  const existingIdx = mockWeightHistory.findIndex(w => w.date === dateStr);
  if (existingIdx >= 0) {
    mockWeightHistory[existingIdx].weight = weight;
  } else {
    mockWeightHistory.push({ date: dateStr, weight });
  }
  
  return clone(mockWeightHistory);
};

// --- 社群相關 ---
export interface Comment { 
  id: string; 
  author: string; 
  avatar: string; 
  content: string; 
  time: string; 
  likes: number; 
  isLiked?: boolean; 
  replies?: Comment[]; 
  isVIP?: boolean; 
  vipLevel?: string; 
  replyToName?: string; // xxxx 回复 @ xxxx
  // Added isV property to Comment interface
  isV?: boolean;
}
export interface Post { 
  id: number; 
  author: string; 
  avatar: string; 
  tag: string; 
  userTags: string[]; 
  content: string; 
  fullContent: string; 
  images: string[]; 
  likes: number; 
  isLiked?: boolean; 
  comments: number; 
  time: string; 
  commentList: Comment[]; 
  isV?: boolean; 
  isVIP?: boolean; 
  vipLevel?: string; 
}

let mockPosts: Post[] = [
  {
    id: 1,
    author: '皮皮麻麻',
    avatar: 'https://picsum.photos/seed/p1/100',
    tag: '新手求助',
    userTags: ['#寵物', '#貓咪日常'],
    content: '大家有推薦的貓砂嗎？...',
    fullContent: '大家有推薦的貓砂嗎？最近換了一款味道好重，麻薯都不進去上廁所了QQ。我試過豆腐砂和礦砂，但麻薯好像比較挑剔，有沒有那種除臭效果強又沒有刺鼻化學味的推薦呢？',
    images: ['https://picsum.photos/seed/catlitter1/600/600'],
    likes: 124,
    isLiked: false,
    comments: 3,
    time: '1小時前',
    commentList: [
      { 
        id: 'c1', 
        author: '小魚', 
        avatar: 'https://picsum.photos/seed/u1/100', 
        content: '推 pidan，除臭效果挺好！', 
        time: '45分前', 
        likes: 12, 
        replies: [
          {
            id: 'r1',
            author: '測試官豆豆',
            avatar: 'https://picsum.photos/seed/tester/100',
            content: '我也覺得這款不錯，就是稍微有點揚塵。',
            time: '30分前',
            likes: 5,
            replyToName: '小魚',
            isV: true
          },
          {
            id: 'r2',
            author: '萌寵達人',
            avatar: 'https://picsum.photos/seed/u4/100',
            content: '可以試試混合砂，效果更佳。',
            time: '10分前',
            likes: 2,
            replyToName: '測試官豆豆'
          },
          {
            id: 'r3',
            author: '皮皮麻麻',
            avatar: 'https://picsum.photos/seed/p1/100',
            content: '謝謝建議！我去看看。',
            time: '剛剛',
            likes: 1,
            replyToName: '萌寵達人'
          }
        ], 
        isVIP: true, 
        vipLevel: 'SVIP' 
      },
      {
        id: 'c2',
        author: '阿強',
        avatar: 'https://picsum.photos/seed/u2/100',
        content: '聽說膨潤土的比較好，但是容易帶出沙盆。',
        time: '30分前',
        likes: 8,
        replies: []
      }
    ],
    isVIP: true,
    vipLevel: 'SVIP'
  },
  {
    id: 2,
    author: '測試官豆豆',
    avatar: 'https://picsum.photos/seed/tester/100',
    tag: '生活分享',
    userTags: ['#測試貼文', '#新功能驗證', '#PawPal_AI'],
    content: '這是一條自動生成的測試動態，用來驗證標籤系統是否正常工作！✨',
    fullContent: '這是一條自動生成的測試動態，用來驗證標籤系統是否正常工作！標籤顯示為藍色並且支持搜索。如果你看到這條動態，說明系統已經準備就緒。我們上傳了 9 張圖來測試九宮格顯示邏輯。',
    images: [
      'https://picsum.photos/seed/tp1/600/600',
      'https://picsum.photos/seed/tp2/600/600',
      'https://picsum.photos/seed/tp3/600/600',
      'https://picsum.photos/seed/tp4/600/600',
      'https://picsum.photos/seed/tp5/600/600',
      'https://picsum.photos/seed/tp6/600/600',
      'https://picsum.photos/seed/tp7/600/600',
      'https://picsum.photos/seed/tp8/600/600',
      'https://picsum.photos/seed/tp9/600/600',
    ],
    likes: 99,
    isLiked: true,
    comments: 0,
    time: '剛剛',
    commentList: [],
    isV: true
  }
];

export const fetchCommunityPosts = async () => { await delay(800); return clone(mockPosts); };

export const createCommunityPost = async (content: string, imageUrl: string | null, tags: string[]) => {
  await delay(1200);
  const user = await getCurrentUser();
  const newPost: Post = {
    id: Date.now(),
    author: user?.name || '陳大萌',
    avatar: user?.avatar || 'https://picsum.photos/seed/owner/200',
    tag: '動態',
    userTags: tags,
    content: content.slice(0, 50) + (content.length > 50 ? '...' : ''),
    fullContent: content,
    images: imageUrl ? [imageUrl] : [],
    likes: 0,
    isLiked: false,
    comments: 0,
    time: '剛剛',
    commentList: [],
    isVIP: user?.isVIP,
    vipLevel: user?.vipLevel
  };
  mockPosts = [newPost, ...mockPosts];
  return clone(newPost);
};

export const toggleLikePost = async (postId: number) => { 
  await delay(200); 
  const p = mockPosts.find(x => x.id === postId); 
  if(p) { p.isLiked = !p.isLiked; p.likes += p.isLiked ? 1 : -1; return { likes: p.likes, isLiked: p.isLiked }; }
  return { likes: 0, isLiked: false };
};

export const toggleLikeComment = async (postId: number, commentId: string) => {
  await delay(200);
  const p = mockPosts.find(x => x.id === postId);
  if (p) {
    const findCommentRecursive = (list: Comment[]): Comment | undefined => {
      for (const c of list) {
        if (c.id === commentId) return c;
        if (c.replies) {
          const found = findCommentRecursive(c.replies);
          if (found) return found;
        }
      }
      return undefined;
    };
    const target = findCommentRecursive(p.commentList);
    if (target) {
      target.isLiked = !target.isLiked;
      target.likes += target.isLiked ? 1 : -1;
      return { likes: target.likes, isLiked: target.isLiked };
    }
  }
  return { likes: 0, isLiked: false };
};

export const addComment = async (postId: number, content: string) => {
  await delay(600);
  const user = await getCurrentUser();
  const comment: Comment = {
    id: 'c' + Date.now(),
    author: user?.name || '我',
    avatar: user?.avatar || 'https://picsum.photos/seed/owner/200',
    content,
    time: '剛剛',
    likes: 0,
    isLiked: false,
    replies: [],
    isVIP: user?.isVIP,
    vipLevel: user?.vipLevel
  };
  const p = mockPosts.find(x => x.id === postId);
  if (p) {
    p.commentList.unshift(comment);
    p.comments += 1;
  }
  return clone(comment);
};

export const addReply = async (postId: number, commentId: string, content: string) => {
  await delay(600);
  const user = await getCurrentUser();
  const p = mockPosts.find(x => x.id === postId);
  if (!p) return null;
  
  // 扁平化邏輯：尋找目標評論所屬的根評論
  let rootComment: Comment | undefined;
  let targetComment: Comment | undefined;

  for (const c of p.commentList) {
    if (c.id === commentId) {
      rootComment = c;
      targetComment = c;
      break;
    }
    // 檢查子評論
    const found = c.replies?.find(r => r.id === commentId);
    if (found) {
      rootComment = c;
      targetComment = found;
      break;
    }
  }
  
  if (!rootComment || !targetComment) return null;

  const r: Comment = { 
    id: 'r'+Date.now(), 
    author: user?.name || '我', 
    avatar: user?.avatar || 'https://picsum.photos/seed/owner/200', 
    content, 
    time: '剛剛', 
    likes: 0, 
    isLiked: false, 
    replies: [],
    isVIP: user?.isVIP,
    vipLevel: user?.vipLevel,
    replyToName: targetComment.author // 顯示回复 @xxx
  };

  // 始終添加到根評論的 replies 列表中，不增加層級
  if (!rootComment.replies) rootComment.replies = [];
  rootComment.replies.push(r);
  p.comments += 1;

  return clone(r);
};

// --- 其他原有接口 ---
export const fetchDiaryEntries = async () => { await delay(500); return clone([]); };
export const saveDiaryEntry = async (e: any) => { await delay(500); return { ...e, id: '1' }; };
export const fetchMedications = async () => { await delay(500); return clone([]); };
export const fetchAppointments = async () => { await delay(500); return clone([]); };
export const fetchExpenses = async () => { await delay(500); return clone([]); };
export const fetchNearbyClinics = async () => { await delay(500); return clone([]); };

// Real AI Implementation for beautifyDiary using Gemini API
export const beautifyDiary = async (content: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `請將這段寵物日記內容進行美化，語氣要充滿「台式療癒風」，多用「啦、喔、嗚嗚、💖、✨」等詞彙，讓文字更有情緒價值和畫面感。原文：${content}`,
    config: {
      systemInstruction: "你是一位資長的寵物博主，擅長撰寫溫塊、治癒的台式簡體/繁體中文內容。你的回覆應該簡短有力，富有情感。",
      temperature: 0.8,
    },
  });
  return response.text || content;
};

// Real AI Implementation for chatWithAI using Gemini API with history support
export const chatWithAI = async (message: string, history: {role: 'user' | 'model', text: string}[], petName: string = '毛孩子'): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Convert our history format to Gemini contents format
  const contents = history.map(h => ({
    role: h.role,
    parts: [{ text: h.text }]
  }));
  
  // Add current message
  contents.push({
    role: 'user',
    parts: [{ text: message }]
  });

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: contents,
    config: {
      systemInstruction: `你是一位全能的寵物專家，名字叫「PawPal AI 顧問」。你說話語氣溫柔、專業且富有同理心。目前正在為寵物 ${petName} 提供諮詢。
      
      風格規範：
      1. **簡約易懂**：不堆砌術語，像朋友一樣交流。
      2. **結構清晰**：使用 Markdown 格式排版（如：**粗體**標題、無序列表）。
      3. **要點突出**：核心建議置於首位，每條建議不超過 3 個重點。
      4. **溫暖親切**：適當使用表情符號（如 🐾, ✨, 💖）。
      5. **保持對話性**：記住之前的對話內容，提供連續的建議。`,
      temperature: 0.7,
    },
  });
  
  return response.text || "抱歉，我現在有點走神，請再跟我說一次。";
};

// Real AI Implementation for performAIHealthScan using Gemini API (Multi-modal)
export const performAIHealthScan = async (mode: 'STOOL' | 'SKIN', petName: string, file: File): Promise<HealthScanResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const imagePart = await fileToGenerativePart(file);
  const prompt = mode === 'STOOL' 
    ? `這是寵物${petName}的糞便照片。請進行健康檢測分析，並提供具體的健康描述和護理建議。`
    : `這是寵物${petName}的皮膚照片。請進行皮膚健康檢測分析，檢查是否有真菌、濕疹 or 寄生蟲跡象。`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts: [imagePart, { text: prompt }] },
    config: {
      systemInstruction: "你是一位專業的寵物健康 AI 助手。請分析圖片並給出結構化結果。狀態只能是 'Healthy' 或 'Observation'。",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          status: { type: Type.STRING, description: "健康狀態: Healthy 或 Observation" },
          desc: { type: Type.STRING, description: "對當前狀況的通俗描述" },
          suggestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "給主人的後續建議清單" },
        },
        required: ["status", "desc", "suggestions"],
      },
    },
  });

  const result = JSON.parse(response.text || "{}");
  return {
    status: (result.status as 'Healthy' | 'Observation') || 'Healthy',
    desc: result.desc || '分析完成，未發現明顯異常。',
    suggestions: result.suggestions || ['持續觀察寵物精神狀況'],
    resultUrl: URL.createObjectURL(file)
  };
};

// Real AI Implementation for performScannerAnalysis using Gemini API (Multi-modal)
export const performScannerAnalysis = async (file: File): Promise<ScannerResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const imagePart = await fileToGenerativePart(file);
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts: [imagePart, { text: "請分析這張寵物食品成分表。是否有有害添加劑或過敏風險？列出安全成分和摘要。" }] },
    config: {
      systemInstruction: "你是一位寵物營養專家。請識別成分表中的安全成分與潛在風險。",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          hasRisk: { type: Type.BOOLEAN, description: "是否含有風險成分" },
          safeIngredients: { type: Type.ARRAY, items: { type: Type.STRING }, description: "識別出的安全、健康成分" },
          summary: { type: Type.STRING, description: "成分分析總結與風險說明" },
        },
        required: ["hasRisk", "safeIngredients", "summary"],
      },
    },
  });

  const result = JSON.parse(response.text || "{}");
  return {
    hasRisk: !!result.hasRisk,
    safeIngredients: result.safeIngredients || [],
    summary: result.summary || '無法解析成分表內容。',
    resultUrl: URL.createObjectURL(file)
  };
};

// Real AI Implementation for performTranslatorAnalysis using Gemini API (Multi-modal)
export const performTranslatorAnalysis = async (petName: string, file: File): Promise<TranslatorResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const imagePart = await fileToGenerativePart(file);
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts: [imagePart, { text: `請解讀這份寵物${petName}的化驗單或診療報告，用「大白話」解釋給主人聽。` }] },
    config: {
      systemInstruction: "你是一位溫柔的寵物醫生助手。你的任務是將晦澀的醫療術語翻譯成通俗易懂的文字。",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          explanation: { type: Type.STRING, description: "通俗易懂的報告解釋" },
          suggestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "後續護理建議" },
          termExcerpts: { type: Type.STRING, description: "原文中的關鍵醫療術語片段" },
        },
        required: ["explanation", "suggestions", "termExcerpts"],
      },
    },
  });

  const result = JSON.parse(response.text || "{}");
  return {
    explanation: result.explanation || '報告內容較為複雜，建議諮詢線下醫師。',
    suggestions: result.suggestions || ['定期複檢'],
    termExcerpts: result.termExcerpts || '無'
  };
};
