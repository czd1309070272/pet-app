
import { 
  DiaryEntry, Medication, Appointment, Expense, WeightEntry, Clinic, InsurancePolicy, 
  Product, CartItem, CommunityHistoryItem, Order, OrderStatus, Address, 
  UserInfo, PetProfile, AlbumPhoto, Post, Comment 
} from './types';

// Re-export AI functions and types
export * from './services/aiFeatures';
// Re-export all types so components using `backend.Type` work correctly
export * from './types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const DEFAULT_USER: UserInfo = {
  id: 'u_001',
  username: 'mochi_owner',
  name: '陳大萌',
  avatar: 'https://picsum.photos/seed/owner/200',
  isVIP: true,
  vipLevel: 'SVIP',
  vipExpiry: '2026-12-31',
  phone: '13800138000',
  gender: '保密',
  googleBound: true,
  appleBound: false,
  level: 15
};

let activeUser: UserInfo | null = { ...DEFAULT_USER };

// --- Auth ---

export const login = async (username: string, password: string): Promise<UserInfo> => {
  await delay(1000);
  activeUser = { ...DEFAULT_USER, username, name: 'LoginUser' };
  return activeUser;
};

export const register = async (username: string, password: string, regType: string, name?: string): Promise<UserInfo> => {
  await delay(1000);
  activeUser = { ...DEFAULT_USER, username, name: name || 'NewUser', isVIP: false };
  return activeUser;
};

export const getCurrentUser = async (): Promise<UserInfo | null> => {
  await delay(500);
  return activeUser;
};

export const updateUserProfile = async (data: Partial<UserInfo>): Promise<UserInfo> => {
  await delay(800);
  if (activeUser) {
    activeUser = { ...activeUser, ...data };
  }
  return activeUser!;
};

export const logout = async (): Promise<void> => {
  await delay(500);
  activeUser = null;
};

// --- Pets ---

let mockPets: PetProfile[] = [
  { id: 'p1', name: '麻薯', breed: '布偶貓', avatar: 'https://picsum.photos/seed/cat1/200', isMemorial: false, gender: '小公主', birthday: '2021-05-20', hobbies: '睡覺, 吃罐頭' },
  { id: 'p2', name: '豆腐', breed: '比熊', avatar: 'https://picsum.photos/seed/dog1/200', isMemorial: false, gender: '小王子', birthday: '2022-08-15', hobbies: '追球, 散步' },
  { id: 'p3', name: '糯米', breed: '英短', avatar: 'https://picsum.photos/seed/cat2/200', isMemorial: true, gender: '小天使', birthday: '2015-02-10', hobbies: '曬太陽', memorialDate: '2024-01-10' },
];

export const fetchPets = async (): Promise<PetProfile[]> => {
  await delay(500);
  // Return copy to prevent reference issues
  return [...mockPets];
};

export const addPet = async (pet: Omit<PetProfile, 'id'>): Promise<PetProfile> => {
  await delay(800);
  const newPet = { ...pet, id: 'p_' + Date.now() };
  mockPets.push(newPet);
  return newPet;
};

export const fetchPetProfile = async (): Promise<PetProfile> => {
  await delay(500);
  return mockPets[0]; // Default return first pet
};

export const updatePetProfile = async (data: Partial<PetProfile>): Promise<PetProfile> => {
  await delay(800);
  const index = mockPets.findIndex(p => p.id === (data.id || mockPets[0].id));
  if (index !== -1) {
    mockPets[index] = { ...mockPets[index], ...data };
    return mockPets[index];
  }
  return mockPets[0];
};

export const updatePetWeight = async (weight: number): Promise<WeightEntry[]> => {
  await delay(500);
  // Add new weight entry
  return fetchWeightHistory().then(history => [...history, { date: new Date().toISOString().split('T')[0], weight }]);
};

export const moveToMemorial = async (petId: string): Promise<PetProfile> => {
  await delay(800);
  const pet = mockPets.find(p => p.id === petId);
  if (pet) {
    pet.isMemorial = true;
    pet.memorialDate = new Date().toISOString().split('T')[0];
    return pet;
  }
  throw new Error("Pet not found");
};

// --- File Upload Simulation ---

/**
 * 模擬文件上傳接口
 * 在真實後端中，這裡應該使用 FormData 將文件 POST 到服務器
 */
export const uploadFile = async (file: File): Promise<string> => {
  await delay(1000); // 模擬上傳延遲
  console.log("Uploading file to backend:", file.name, file.size);
  // 返回一個可訪問的 URL (此處使用 Blob URL 模擬)
  return URL.createObjectURL(file);
};

// --- Diary ---

let mockEntries: DiaryEntry[] = [
  { id: 'd1', date: '2025-03-24', content: '今天帶麻薯去公園玩，它好像很喜歡追蝴蝶。', style: '台式療癒風', imageUrl: 'https://picsum.photos/seed/diary1/400/300' },
  { id: 'd2', date: '2025-03-22', content: '豆腐偷吃了桌上的麵包，被我發現後一臉無辜。', style: '幽默風' }
];

export const fetchDiaryEntries = async (): Promise<DiaryEntry[]> => {
  await delay(500);
  return [...mockEntries];
};

/**
 * 創建日記條目
 * 支持傳入 File 對象進行上傳，或傳入已有的圖片 URL (如來自相冊)
 */
export const createDiaryEntry = async (
  content: string, 
  file?: File | null, 
  existingImageUrl?: string | null
): Promise<DiaryEntry> => {
  let imageUrl = existingImageUrl;

  // 如果有新文件，先上傳
  if (file) {
    imageUrl = await uploadFile(file);
  }

  // 模擬後端保存邏輯
  await delay(500); 
  
  const newEntry: DiaryEntry = {
    id: Date.now().toString(),
    date: new Date().toISOString().split('T')[0],
    content,
    style: '台式療癒風',
    imageUrl: imageUrl || undefined
  };
  
  mockEntries.unshift(newEntry);
  return newEntry;
};

// --- Health & Meds ---

export const fetchMedications = async (): Promise<Medication[]> => {
  await delay(500);
  return [
    { id: 'm1', name: '內驅蟲藥', date: new Date().toISOString().split('T')[0], time: '09:00', dosage: '1粒', isTaken: false, petName: '麻薯' },
    { id: 'm2', name: '魚油', date: '2025-03-25', time: '20:00', dosage: '2ml', isTaken: false, petName: '豆腐' }
  ];
};

export const fetchAppointments = async (): Promise<Appointment[]> => {
  await delay(500);
  return [
    { id: 'a1', hospitalName: '愛心寵物醫院', date: '2025-04-01', time: '10:00', petName: '麻薯', type: '疫苗接種' }
  ];
};

export const fetchWeightHistory = async (): Promise<WeightEntry[]> => {
  await delay(500);
  return [
    { date: '2025-01-01', weight: 3.8 },
    { date: '2025-02-01', weight: 4.0 },
    { date: '2025-03-01', weight: 4.2 },
  ];
};

export const fetchInsurancePolicies = async (): Promise<InsurancePolicy[]> => {
  await delay(800);
  return [
    { id: 'ins1', petName: '麻薯', policyNumber: 'POL-882910', planName: '全方位醫療險', expiryDate: '2025-12-31', coverage: 50000, status: 'ACTIVE', imageUrl: '' }
  ];
};

export const saveInsurancePolicy = async (petName: string, file: File): Promise<InsurancePolicy> => {
  await delay(1500);
  return {
    id: 'ins_' + Date.now(),
    petName,
    policyNumber: 'POL-' + Math.floor(Math.random() * 100000),
    planName: 'AI 識別險種',
    expiryDate: '2026-01-01',
    coverage: 20000,
    status: 'ACTIVE',
    imageUrl: URL.createObjectURL(file)
  };
};

export const fetchNearbyClinics = async (): Promise<Clinic[]> => {
  await delay(800);
  return [
    { name: '中環24小時急診', distance: '0.8km', is24h: true, address: '中環皇后大道中100號', phone: '2345 6789' },
    { name: '愛寵專科診所', distance: '1.2km', is24h: false, address: '灣仔軒尼詩道50號', phone: '2876 5432' }
  ];
};

// --- Wallet ---

export const fetchExpenses = async (): Promise<Expense[]> => {
  await delay(500);
  return [
    { id: 'e1', amount: 350, category: 'FOOD', date: '2025-03-20', description: '購買貓糧', petName: '麻薯' },
    { id: 'e2', amount: 800, category: 'HEALTH', date: '2025-03-15', description: '年度體檢', petName: '豆腐' }
  ];
};

// --- Community ---

let mockPosts: Post[] = [
  { 
    id: 1, 
    author: '貓貓教主', 
    avatar: 'https://picsum.photos/seed/u1/100', 
    time: '2小時前', 
    content: '今天天氣真好，帶主子出來曬太陽！#日常 #曬貓', 
    fullContent: '今天天氣真好，帶主子出來曬太陽！#日常 #曬貓 \n\n 陽光灑在毛髮上金光閃閃的，太好看了！',
    images: ['https://picsum.photos/seed/p1/400', 'https://picsum.photos/seed/p2/400'], 
    likes: 128, 
    comments: 32, 
    isLiked: false, 
    isVIP: true, 
    vipLevel: 'SVIP', 
    userTags: ['#日常', '#曬貓'],
    commentList: [
      { id: 'c1', author: '路人甲', avatar: 'https://picsum.photos/seed/u2/100', content: '好可愛的貓貓！', time: '1小時前', likes: 5, isLiked: false }
    ] 
  }
];

export const fetchCommunityPosts = async (): Promise<Post[]> => {
  await delay(800);
  // Return deep copy to prevent reference sharing issues with frontend state
  return JSON.parse(JSON.stringify(mockPosts));
};

export const createCommunityPost = async (content: string, image: string | null, tags: string[]): Promise<Post> => {
  await delay(1000);
  const newPost: Post = {
    id: Date.now(),
    author: activeUser?.name || 'Me',
    avatar: activeUser?.avatar || '',
    time: '剛剛',
    content,
    fullContent: content,
    images: image ? [image] : [],
    likes: 0,
    comments: 0,
    isLiked: false,
    userTags: tags,
    commentList: [],
    isVIP: activeUser?.isVIP,
    vipLevel: activeUser?.vipLevel
  };
  mockPosts.unshift(newPost);
  return newPost;
};

export const toggleLikePost = async (postId: number): Promise<{ likes: number, isLiked: boolean }> => {
  await delay(300);
  const post = mockPosts.find(p => p.id === postId);
  if (post) {
    post.isLiked = !post.isLiked;
    post.likes += post.isLiked ? 1 : -1;
    return { likes: post.likes, isLiked: post.isLiked };
  }
  return { likes: 0, isLiked: false };
};

export const addComment = async (postId: number, content: string): Promise<Comment> => {
  await delay(500);
  const newComment: Comment = {
    id: 'c_' + Date.now(),
    author: activeUser?.name || 'Me',
    avatar: activeUser?.avatar || '',
    content,
    time: '剛剛',
    likes: 0,
    isLiked: false,
    isVIP: activeUser?.isVIP,
    replies: []
  };
  const post = mockPosts.find(p => p.id === postId);
  if (post) {
    post.commentList.unshift(newComment);
    post.comments++;
  }
  return newComment;
};

export const toggleLikeComment = async (postId: number, commentId: string): Promise<{ likes: number, isLiked: boolean }> => {
  await delay(300);
  // Simplified logic, usually requires recursion for replies
  return { likes: 1, isLiked: true };
};

export const addReply = async (postId: number, commentId: string, content: string): Promise<Comment | null> => {
  await delay(500);
  return {
    id: 'r_' + Date.now(),
    author: activeUser?.name || 'Me',
    avatar: activeUser?.avatar || '',
    content,
    time: '剛剛',
    likes: 0,
    isLiked: false,
    replyToName: 'Someone'
  };
};

export const fetchCommunityHistory = async (type: string): Promise<CommunityHistoryItem[]> => {
  await delay(500);
  return [
    { id: 'h1', postId: 1, author: '貓貓教主', authorAvatar: 'https://picsum.photos/seed/u1/100', contentSnippet: '今天天氣真好...', time: '2小時前', type: 'WATCH' }
  ];
};

// --- Shop & Orders ---

let mockCart: CartItem[] = [];
let mockOrders: Order[] = [];

export const fetchProducts = async (category?: string): Promise<Product[]> => {
  await delay(800);
  let products: Product[] = [
    { id: 'prod1', name: '皇家成貓糧', price: 280, originalPrice: 320, imageUrl: 'https://picsum.photos/seed/prod1/300', category: 'FOOD', rating: 4.8, sales: 1200 },
    { id: 'prod2', name: '凍乾雞胸肉', price: 58, imageUrl: 'https://picsum.photos/seed/prod2/300', category: 'TREAT', rating: 4.9, sales: 5000 },
    { id: 'prod3', name: '自動飲水機', price: 199, imageUrl: 'https://picsum.photos/seed/prod3/300', category: 'HEALTH', rating: 4.5, sales: 300 }
  ];
  if (category) {
    products = products.filter(p => p.category === category);
  }
  return products;
};

export const fetchProductById = async (id: string): Promise<Product | null> => {
  await delay(500);
  const products = await fetchProducts();
  return products.find(p => p.id === id) || null;
};

export const fetchCart = async (): Promise<CartItem[]> => {
  await delay(300);
  return mockCart;
};

export const addToCart = async (product: Product, quantity: number): Promise<void> => {
  await delay(300);
  const existing = mockCart.find(i => i.productId === product.id);
  if (existing) {
    existing.quantity += quantity;
  } else {
    mockCart.push({
      id: 'cart_' + Date.now(),
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
  await delay(200);
  const item = mockCart.find(i => i.id === id);
  if (item) Object.assign(item, updates);
};

export const removeFromCart = async (id: string): Promise<void> => {
  await delay(200);
  mockCart = mockCart.filter(i => i.id !== id);
};

export const createOrderFromCart = async (items: CartItem[], status: OrderStatus): Promise<Order> => {
  await delay(1000);
  const order: Order = {
    id: 'ORD-' + Date.now(),
    status,
    items: items.map(i => ({ name: i.name, price: i.price, quantity: i.quantity, imageUrl: i.imageUrl })),
    totalPrice: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    date: new Date().toISOString().split('T')[0],
    trackingNumber: status === 'PENDING_SHIP' ? undefined : 'SF' + Date.now()
  };
  mockOrders.unshift(order);
  return order;
};

export const clearSelectedCartItems = async (): Promise<void> => {
  mockCart = mockCart.filter(i => !i.selected);
};

export const fetchOrders = async (status?: OrderStatus): Promise<Order[]> => {
  await delay(800);
  if (status) return mockOrders.filter(o => o.status === status);
  return mockOrders;
};

// --- Address ---

let mockAddresses: Address[] = [
  { id: 'addr1', receiverName: '陳大萌', phone: '13800138000', area: '中西區', detail: '皇后大道中100號', isDefault: true, label: 'HOME' }
];

export const fetchAddresses = async (): Promise<Address[]> => {
  await delay(500);
  return mockAddresses;
};

export const saveAddress = async (addr: Address): Promise<Address> => {
  await delay(500);
  if (addr.id) {
    const idx = mockAddresses.findIndex(a => a.id === addr.id);
    if (idx !== -1) mockAddresses[idx] = addr;
  } else {
    addr.id = 'addr_' + Date.now();
    mockAddresses.push(addr);
  }
  return addr;
};

export const deleteAddress = async (id: string): Promise<void> => {
  await delay(300);
  mockAddresses = mockAddresses.filter(a => a.id !== id);
};

// --- Album ---

let mockAlbum: AlbumPhoto[] = [
  { id: 'ph1', url: 'https://picsum.photos/seed/album1/400', category: 'DAILY', date: '2025-03-20' },
  { id: 'ph2', url: 'https://picsum.photos/seed/album2/400', category: 'TRAVEL', date: '2025-03-18' }
];

export const fetchAlbumPhotos = async (): Promise<AlbumPhoto[]> => {
  await delay(500);
  // Return copy to ensure frontend state doesn't hold reference to backend storage
  return [...mockAlbum];
};

export const addAlbumPhoto = async (category: 'DAILY' | 'HEALTH' | 'TRAVEL' | 'ALL', file?: File): Promise<AlbumPhoto> => {
  // 如果傳入了 File，則進行模擬上傳
  let url = `https://picsum.photos/seed/album${Date.now()}/400`;
  if (file) {
    url = await uploadFile(file);
  } else {
    await delay(800); // 模擬網絡請求
  }

  const newPhoto: AlbumPhoto = {
    id: 'ph_' + Date.now(),
    url,
    category,
    date: new Date().toISOString().split('T')[0]
  };
  mockAlbum.unshift(newPhoto);
  return newPhoto;
};

export const deleteAlbumPhoto = async (id: string): Promise<void> => {
  await delay(300);
  mockAlbum = mockAlbum.filter(p => p.id !== id);
};
