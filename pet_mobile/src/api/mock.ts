/**
 * 阶段一 Mock API - 与 backend 同名的函数，返回静态数据，供页面迁移时使用
 */
import type {
  UserInfo,
  PetProfile,
  WeightEntry,
  DiaryEntry,
  Medication,
  Appointment,
  Expense,
  Article,
  AlbumPhoto,
  Product,
  CartItem,
  Order,
  Address,
  HealthScanResult,
  ScannerResult,
  TranslatorResult,
} from '../types';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const MOCK_USER: UserInfo = {
  id: 'u_001',
  username: 'mochi_owner',
  name: '陳大萌',
  avatar: 'https://picsum.photos/seed/owner/200',
  isVIP: true,
  vipLevel: 'SVIP',
  vipExpiry: '2026-12-31',
  phone: '13800138000',
  token: 'mock_token',
  level: 1,
};

const MOCK_PETS: PetProfile[] = [
  {
    id: 'p_001',
    name: '寶貝',
    breed: '橘貓',
    avatar: 'https://picsum.photos/seed/cat1/200',
    isMemorial: false,
    gender: '男',
    birthday: '2020-05-01',
    hobbies: '睡覺、吃罐頭',
  },
];

const GRID_IMG = (n: number) => `https://picsum.photos/seed/diary${n}/200`;
let MOCK_ENTRIES: DiaryEntry[] = [
  { id: 'e_1', date: '2025-02-20', content: '今天帶毛孩去公園散步', style: 'happy', petName: '寶貝' },
  {
    id: 'e_2',
    date: '2025-02-22',
    content: '三張圖的萌寵日記～',
    style: 'happy',
    petName: '寶貝',
    imageUrl: GRID_IMG(1),
    imageUrls: [GRID_IMG(1), GRID_IMG(2), GRID_IMG(3)],
  },
  {
    id: 'e_3',
    date: '2025-02-23',
    content: '六張圖的宮格測試',
    style: 'relaxed',
    petName: '寶貝',
    imageUrl: GRID_IMG(10),
    imageUrls: [GRID_IMG(10), GRID_IMG(11), GRID_IMG(12), GRID_IMG(13), GRID_IMG(14), GRID_IMG(15)],
  },
  {
    id: 'e_4',
    date: '2025-02-24',
    content: '超過六張圖，最後一格顯示 +N',
    style: 'happy',
    petName: '寶貝',
    imageUrl: GRID_IMG(20),
    imageUrls: [GRID_IMG(20), GRID_IMG(21), GRID_IMG(22), GRID_IMG(23), GRID_IMG(24), GRID_IMG(25), GRID_IMG(26), GRID_IMG(27)],
  },
];

let MOCK_MEDICATIONS: Medication[] = [
  { id: 'm_1', name: '維生素', date: '2025-02-23', time: '08:00', dosage: '1粒', isTaken: false, petName: '寶貝' },
];

const MOCK_APPOINTMENTS: Appointment[] = [
  { id: 'a_1', hospitalName: '萌寵醫院', date: '2025-02-25', time: '10:00', petName: '寶貝', type: '體檢' },
];

let MOCK_EXPENSES: Expense[] = [
  { id: 'x_1', amount: 299, category: 'FOOD', date: '2025-02-22', description: '罐頭', petName: '寶貝' },
];

const MOCK_ARTICLES: Article[] = [
  {
    id: 'art_1',
    title: '寵物營養指南',
    summary: '如何為毛孩選擇合適的糧食',
    content: '科學養寵不僅是責任，更是一種愛的體現。水分與營養的均衡攝入對毛孩至關重要。\n\n建議將本文提到的水分優化方案與您的寵物日常飲食相結合，持續觀察兩週，您會發現毛孩子的狀態有顯著提升。',
    coverImage: 'https://picsum.photos/seed/article1/400/200',
    author: 'PawPal',
    date: '2025-02-01',
    category: '健康',
    readTime: '5 分鐘',
    likes: 128,
  },
];

let MOCK_ALBUM: AlbumPhoto[] = [
  { id: 'ph_1', url: 'https://picsum.photos/seed/album1/300', category: 'DAILY', date: '2025-02-20' },
  { id: 'ph_2', url: 'https://picsum.photos/seed/album2/300', category: 'DAILY', date: '2025-02-19' },
  { id: 'ph_3', url: 'https://picsum.photos/seed/album3/300', category: 'DAILY', date: '2025-02-18' },
];

const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod_1',
    productId: 'prod_1',
    name: '鮮食罐頭',
    price: 89,
    imageUrl: 'https://picsum.photos/seed/prod1/200',
    category: 'FOOD',
    rating: 4.8,
    sales: 1200,
    tag: '熱賣',
    description: '此產品由 PawPal 專業研發團隊精心挑選，旨在為香港的都市萌寵提供最均衡的營養與最舒適的體驗。100% 安全認證，符合國際進口標準。',
    detailImages: ['https://picsum.photos/seed/prod1/400', 'https://picsum.photos/seed/prod1b/400', 'https://picsum.photos/seed/prod1c/400'],
  },
  { id: 'prod_2', productId: 'prod_2', name: '凍乾雞肉粒', price: 128, originalPrice: 158, imageUrl: 'https://picsum.photos/seed/prod2/200', category: 'TREAT', rating: 4.9, sales: 890 },
  { id: 'prod_3', productId: 'prod_3', name: '關節保健配方', price: 199, imageUrl: 'https://picsum.photos/seed/prod3/200', category: 'HEALTH', rating: 4.7, sales: 456 },
  { id: 'prod_4', productId: 'prod_4', name: '逗貓棒套裝', price: 49, imageUrl: 'https://picsum.photos/seed/prod4/200', category: 'TOY', rating: 4.6, sales: 2100 },
  { id: 'prod_5', productId: 'prod_5', name: '成犬主糧 2kg', price: 168, imageUrl: 'https://picsum.photos/seed/prod5/200', category: 'FOOD', rating: 4.8, sales: 3200, tag: '新品' },
  { id: 'prod_6', productId: 'prod_6', name: '潔齒骨', price: 69, imageUrl: 'https://picsum.photos/seed/prod6/200', category: 'TREAT', rating: 4.5, sales: 1500 },
];

let mockCartItems: CartItem[] = [];
let MOCK_ORDERS: Order[] = [];
let MOCK_ADDRESSES: Address[] = [
  { id: 'addr_1', receiverName: '陳大萌', phone: '138****8000', area: '中西區', detail: '旺角道 123 號 5 樓', isDefault: true, label: 'HOME' },
  { id: 'addr_2', receiverName: '陳大萌', phone: '138****8000', area: '灣仔區', detail: '銅鑼灣某某大廈 8 樓', isDefault: false, label: 'WORK' },
];

export async function getCurrentUser(): Promise<UserInfo | null> {
  await delay(300);
  // 阶段一：返回 null 以显示登录页；改为 return MOCK_USER 可跳过登录
  return null;
}

export async function login(_username: string, _password: string): Promise<UserInfo> {
  await delay(800);
  return MOCK_USER;
}

export async function register(
  _username: string,
  _password: string,
  _regType: string,
  name?: string
): Promise<UserInfo> {
  await delay(800);
  return { ...MOCK_USER, name: name || MOCK_USER.name };
}

export async function verifyCode(_identifier: string, _code: string): Promise<boolean> {
  await delay(400);
  return true;
}

export async function resetPassword(
  _identifier: string,
  _newPassword: string
): Promise<boolean> {
  await delay(400);
  return true;
}

export async function logout(): Promise<void> {
  await delay(200);
}

export async function fetchPets(): Promise<PetProfile[]> {
  await delay(400);
  return [...MOCK_PETS];
}

export async function updateUserProfile(updates: Partial<UserInfo>): Promise<UserInfo> {
  await delay(300);
  Object.assign(MOCK_USER, updates);
  return { ...MOCK_USER };
}

export async function addPet(
  data: Omit<PetProfile, 'id' | 'avatar'> & { avatar?: string }
): Promise<PetProfile> {
  await delay(400);
  const newPet: PetProfile = {
    id: 'p_' + Date.now(),
    name: data.name,
    breed: data.breed,
    avatar: data.avatar ?? 'https://picsum.photos/seed/pet_new/200',
    isMemorial: false,
    gender: data.gender,
    birthday: data.birthday,
    hobbies: data.hobbies ?? '',
  };
  MOCK_PETS.push(newPet);
  return newPet;
}

export async function moveToMemorial(petId: string): Promise<PetProfile> {
  await delay(400);
  const pet = MOCK_PETS.find((p) => p.id === petId);
  if (!pet) throw new Error('Pet not found');
  pet.isMemorial = true;
  pet.memorialDate = new Date().toISOString().slice(0, 10);
  return { ...pet };
}

export async function fetchDiaryEntries(): Promise<DiaryEntry[]> {
  await delay(300);
  return [...MOCK_ENTRIES];
}

export async function createDiaryEntry(
  content: string,
  _file?: unknown,
  imageUrl?: string | null,
  imageUrls?: string[] | null,
  style?: string,
  videoUrl?: string | null,
  mediaOrder?: ('image' | 'video')[] | null,
  videoThumbnailUrl?: string | null,
  videoUrls?: string[] | null,
  videoThumbnailUrls?: (string | undefined)[] | null
): Promise<DiaryEntry> {
  await delay(600);
  const urls = imageUrls && imageUrls.length > 0 ? [...imageUrls] : (imageUrl ? [imageUrl] : undefined);
  const vUrls = videoUrls && videoUrls.length > 0 ? [...videoUrls] : (videoUrl ? [videoUrl] : undefined);
  const firstUrl = urls?.[0] ?? imageUrl ?? vUrls?.[0] ?? videoUrl ?? undefined;
  const newEntry: DiaryEntry = {
    id: 'e_' + Date.now(),
    date: new Date().toISOString().slice(0, 10),
    content: content || '今日萌寵時光 ✨',
    style: style ?? 'happy',
    petName: '寶貝',
    imageUrl: firstUrl,
    imageUrls: urls,
    videoUrl: vUrls?.[0] ?? videoUrl ?? undefined,
    videoThumbnailUrl: videoThumbnailUrls?.[0] ?? videoThumbnailUrl ?? undefined,
    videoUrls: vUrls,
    videoThumbnailUrls: videoThumbnailUrls && videoThumbnailUrls.length > 0 ? [...videoThumbnailUrls] : undefined,
    mediaOrder: mediaOrder && mediaOrder.length > 0 ? [...mediaOrder] : undefined,
  };
  MOCK_ENTRIES = [newEntry, ...MOCK_ENTRIES];
  return {
    ...newEntry,
    imageUrls: urls ? [...urls] : undefined,
    videoUrl: newEntry.videoUrl,
    videoThumbnailUrl: newEntry.videoThumbnailUrl,
    videoUrls: newEntry.videoUrls,
    videoThumbnailUrls: newEntry.videoThumbnailUrls,
    mediaOrder: newEntry.mediaOrder,
  };
}

export async function beautifyDiary(text: string): Promise<string> {
  await delay(800);
  return text + '（AI 已為你潤色 ✨）';
}

export async function fetchMedications(): Promise<Medication[]> {
  await delay(300);
  return [...MOCK_MEDICATIONS];
}

export async function getAllMedication(): Promise<Medication[]> {
  await delay(300);
  return [...MOCK_MEDICATIONS];
}

export async function addMedication(med: Omit<Medication, 'id'>): Promise<Medication> {
  await delay(400);
  const newMed: Medication = {
    ...med,
    id: 'm_' + Date.now(),
  };
  MOCK_MEDICATIONS = [newMed, ...MOCK_MEDICATIONS];
  return newMed;
}

export async function updateMedicationTaken(id: string, isTaken: boolean): Promise<boolean> {
  await delay(200);
  const m = MOCK_MEDICATIONS.find((x) => x.id === id);
  if (m) {
    m.isTaken = isTaken;
    return true;
  }
  return false;
}

export async function deleteMedication(id: string): Promise<boolean> {
  await delay(200);
  const prev = MOCK_MEDICATIONS.length;
  MOCK_MEDICATIONS = MOCK_MEDICATIONS.filter((x) => x.id !== id);
  return MOCK_MEDICATIONS.length < prev;
}

export async function fetchAppointments(): Promise<Appointment[]> {
  await delay(300);
  return MOCK_APPOINTMENTS;
}

export async function fetchExpenses(): Promise<Expense[]> {
  await delay(300);
  return [...MOCK_EXPENSES];
}

export function addExpenseLocal(exp: Expense): void {
  MOCK_EXPENSES = [exp, ...MOCK_EXPENSES];
}

export async function fetchArticles(): Promise<Article[]> {
  await delay(300);
  return MOCK_ARTICLES;
}

export async function fetchArticleById(id: string): Promise<Article | null> {
  await delay(300);
  const a = MOCK_ARTICLES.find((x) => x.id === id);
  return a ? { ...a } : null;
}

export async function fetchAlbumPhotos(): Promise<AlbumPhoto[]> {
  await delay(300);
  return [...MOCK_ALBUM];
}

export async function addAlbumPhoto(
  category: AlbumPhoto['category'],
  _file?: unknown
): Promise<AlbumPhoto> {
  await delay(500);
  const newPhoto: AlbumPhoto = {
    id: 'ph_' + Date.now(),
    url: 'https://picsum.photos/seed/' + Date.now() + '/300',
    category: category === 'ALL' ? 'DAILY' : category,
    date: new Date().toISOString().slice(0, 10),
  };
  MOCK_ALBUM = [newPhoto, ...MOCK_ALBUM];
  return newPhoto;
}

export async function deleteAlbumPhoto(id: string): Promise<void> {
  await delay(200);
  MOCK_ALBUM = MOCK_ALBUM.filter((p) => p.id !== id);
}

export async function fetchProducts(
  category?: string,
  offset?: number,
  limit?: number
): Promise<Product[]> {
  await delay(300);
  const page = offset ?? 1;
  const size = limit ?? 6;
  const filtered =
    !category || category === 'ALL'
      ? MOCK_PRODUCTS
      : MOCK_PRODUCTS.filter((p) => p.category === category);
  const start = (page - 1) * size;
  return filtered.slice(start, start + size);
}

export async function searchProducts(
  keyword: string,
  page: number,
  limit: number
): Promise<Product[]> {
  await delay(300);
  if (!keyword.trim()) return MOCK_PRODUCTS.slice(0, limit);
  const lower = keyword.toLowerCase();
  const filtered = MOCK_PRODUCTS.filter((p) => p.name.toLowerCase().includes(lower));
  const start = (page - 1) * limit;
  return filtered.slice(start, start + limit);
}

export async function addToCart(_product: Product, quantity: number): Promise<void> {
  await delay(300);
  const existing = mockCartItems.find((i) => i.productId === _product.id);
  if (existing) {
    existing.quantity += quantity;
  } else {
    mockCartItems.push({
      id: 'cart_' + _product.id,
      productId: _product.id,
      name: _product.name,
      price: _product.price,
      quantity,
      imageUrl: _product.imageUrl,
      selected: false,
    });
  }
}

export async function fetchCart(): Promise<CartItem[]> {
  await delay(200);
  return [...mockCartItems];
}

export async function fetchOrders(): Promise<Order[]> {
  await delay(300);
  return MOCK_ORDERS;
}

export async function fetchAddresses(): Promise<Address[]> {
  await delay(300);
  return [...MOCK_ADDRESSES];
}

export async function saveAddress(addr: Address): Promise<Address> {
  await delay(300);
  const idx = MOCK_ADDRESSES.findIndex((a) => a.id === addr.id);
  const saved: Address = {
    id: addr.id || 'addr_' + Date.now(),
    receiverName: addr.receiverName,
    phone: addr.phone,
    area: addr.area,
    detail: addr.detail,
    isDefault: addr.isDefault ?? false,
    label: addr.label ?? 'HOME',
  };
  if (idx >= 0) {
    MOCK_ADDRESSES[idx] = saved;
  } else {
    MOCK_ADDRESSES = [...MOCK_ADDRESSES, saved];
  }
  if (saved.isDefault) {
    MOCK_ADDRESSES = MOCK_ADDRESSES.map((a) => ({ ...a, isDefault: a.id === saved.id }));
  }
  return { ...saved };
}

export async function deleteAddress(id: string): Promise<void> {
  await delay(300);
  MOCK_ADDRESSES = MOCK_ADDRESSES.filter((a) => a.id !== id);
}

/** 按寵物 id 存儲的體重歷史，key 為 petId */
const MOCK_WEIGHT_HISTORY: Record<string, WeightEntry[]> = {
  p_001: [
    { date: '2025-01-01', weight: 4.2 },
    { date: '2025-01-15', weight: 4.3 },
    { date: '2025-02-01', weight: 4.35 },
    { date: '2025-02-15', weight: 4.4 },
  ],
};

export async function fetchPetProfile(petId: string): Promise<PetProfile | null> {
  await delay(300);
  const pet = MOCK_PETS.find((p) => p.id === petId) ?? null;
  return pet ? { ...pet } : null;
}

export async function fetchWeightHistory(petId: string): Promise<WeightEntry[]> {
  await delay(300);
  return [...(MOCK_WEIGHT_HISTORY[petId] ?? [])];
}

export async function updatePetWeight(weight: number, petId: string): Promise<WeightEntry[]> {
  await delay(300);
  const list = MOCK_WEIGHT_HISTORY[petId] ?? [];
  const date = new Date().toISOString().slice(0, 10);
  const next = [...list, { date, weight }];
  MOCK_WEIGHT_HISTORY[petId] = next;
  return next;
}

export async function updatePetProfile(updates: Partial<PetProfile>): Promise<PetProfile> {
  await delay(300);
  const id = updates.id;
  if (!id) throw new Error('Pet id required');
  const idx = MOCK_PETS.findIndex((p) => p.id === id);
  if (idx < 0) throw new Error('Pet not found');
  MOCK_PETS[idx] = { ...MOCK_PETS[idx], ...updates };
  return { ...MOCK_PETS[idx] };
}

export async function fetchProductById(id: string): Promise<Product | null> {
  await delay(300);
  const p = MOCK_PRODUCTS.find((x) => x.id === id) ?? null;
  if (p) return { ...p, detailImages: p.detailImages ?? [p.imageUrl] };
  return null;
}

export async function performAIHealthScan(
  mode: 'STOOL' | 'SKIN',
  _petName: string,
  _image?: unknown
): Promise<HealthScanResult> {
  await delay(2000);
  const now = new Date();
  const reportNo = `HK${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(Date.now()).slice(-6)}`;
  const isStool = mode === 'STOOL';
  return {
    status: 'Healthy',
    desc: '本次檢測未發現明顯異常。建議保持當前餵養習慣，並定期觀察。',
    suggestions: ['每日飲水充足', '可適量補充纖維', '若持續異常請就醫'],
    resultUrl: 'https://picsum.photos/seed/health/400/300',
    reportNo,
    visualSummary: isStool
      ? '樣本形態飽滿，色澤正常，質地均勻。未見明顯異物、寄生蟲卵或異常色素。水分含量在正常範圍內。'
      : '掃描區域膚色均勻，未見明顯紅腫、脫毛或異常皮屑。毛孔清晰，毛囊狀態正常。',
    riskLevel: 'LOW',
    diagnosis: isStool
      ? '綜合圖像分析與特徵比對，本次糞便樣本各項指標均在正常參考範圍內，暫未發現需進一步就醫的異常徵象。'
      : '皮膚掃描結果顯示受檢區域無明顯病變跡象，建議保持現有護理習慣並持續觀察。',
  };
}

export async function performScannerAnalysis(
  _image: unknown,
  _petContext: { breed: string; age: number; gender: string }
): Promise<{ code: number; data?: ScannerResult; message?: string }> {
  await delay(2500);
  return {
    code: 200,
    data: {
      summary: '該產品成分整體適合當前寵物，無明顯過敏風險。',
      riskIngredients: [],
      safeIngredients: ['雞肉', '維生素 E', '牛磺酸', 'Omega-3'],
      resultUrl: 'https://picsum.photos/seed/scan/400/300',
    },
  };
}

export async function performTranslatorAnalysis(
  _petName: string,
  _image: unknown
): Promise<{ code: number; data?: TranslatorResult; message?: string }> {
  await delay(2000);
  return {
    code: 200,
    data: {
      termExcerpts: 'WBC 偏高、RBC 正常範圍',
      explanation: 'WBC 是白細胞，偏高可能表示身體有輕微發炎或感染，建議配合臨床症狀觀察或複檢。',
      suggestions: ['一週後複查血常規', '注意飲食與休息'],
    },
  };
}

export async function updateCartItem(id: string, updates: Partial<CartItem>): Promise<void> {
  await delay(150);
  const item = mockCartItems.find((i) => i.id === id);
  if (item) Object.assign(item, updates);
}

export async function removeFromCart(id: string): Promise<boolean> {
  await delay(150);
  const prev = mockCartItems.length;
  mockCartItems = mockCartItems.filter((i) => i.id !== id);
  return mockCartItems.length < prev;
}

export async function createOrderFromCart(items: CartItem[], addressId: string): Promise<string> {
  await delay(400);
  const orderId = 'ord_' + Date.now();
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  MOCK_ORDERS.push({
    id: orderId,
    status: 'PENDING_PAY',
    items: items.map((i) => ({ name: i.name, price: i.price, quantity: i.quantity, imageUrl: i.imageUrl })),
    totalPrice,
    date: new Date().toISOString().slice(0, 10),
    addressId: parseInt(addressId, 10) || 1,
  });
  return orderId;
}

export async function clearSelectedCartItems(): Promise<void> {
  await delay(150);
  mockCartItems = mockCartItems.filter((i) => !i.selected);
}

export async function updateOrderStatus(orderId: string, status: string): Promise<string> {
  await delay(200);
  const order = MOCK_ORDERS.find((o) => o.id === orderId);
  if (order) order.status = status as Order['status'];
  return 'success';
}
