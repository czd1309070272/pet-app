
import { userInfo } from 'os';
import {
  DiaryEntry, Medication, Appointment, Expense, WeightEntry, Clinic, InsurancePolicy,
  Product, CartItem, CommunityHistoryItem, Order, OrderStatus, Address,
  UserInfo, PetProfile, AlbumPhoto, Post, Comment,
  url_base,
  Article
} from './types';
import Cookie from 'js-cookie';
// Re-export AI functions and types
export * from './services/aiFeatures';
// Re-export all types so components using `backend.Type` work correctly
export * from './types';

// 添加重置函数，供页面初始化时调用
let community_request_offset = 1;// 社区请求的偏移量
let community_request_limit = 3;// 社区请求的条数
let discovery_carts_request_offset = 1;// 购物车请求的偏移量
let discovery_carts_request_limit = -1;// 购物车请求的条数
let orders_request_offset = 1;
let orders_request_limit = 10;
let orders_last_statues = "ALL";
export const resetCommunityPostsOffset = () => {
  community_request_offset = 1;
  console.log("重置社区帖子偏移量为1");
};
// 保存数据到 Cookie，支持过期时间（天数）
export const SaveDataToCookie = (key: string, value: any, days: number) => {
  Cookie.set(key, JSON.stringify(value), { expires: days });
};
// 同时添加获取和删除 Cookie 的辅助函数
export const GetDataFromCookie = (key: string): any => {
  const cookieValue = Cookie.get(key);
  if (cookieValue) {
    try {
      return JSON.parse(cookieValue);
    } catch (error) {
      return cookieValue; // 如果不是 JSON 格式，直接返回
    }
  }
  return null;
};
// 删除指定的 Cookie
export const RemoveCookie = (key: string) => {
  Cookie.remove(key);
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const DEFAULT_USER: UserInfo = {
  id: 'u_001',
  username: 'mochi_owner',
  name: '陳大萌123',
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
  console.log("开始执行登录函数，参数:", { username, password });
  await delay(1000);
  console.log("延迟完成，开始发送登录请求");
  try {
    const response = await fetch(url_base + "/loginview/login", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: username,
        password_hash: password,
      })
    });
    console.log("登录响应对象:", response);
    const data = await response.json();
    console.log("登录响应数据:", data);
    if (data.code === 200) {
      console.log("登录成功，开始处理返回数据");
      const dat = data.data;
      console.log("登录返回的用户数据:", dat);
      if (dat) {
        activeUser = null; // 重置当前用户
        const activeUser1: UserInfo = {
          id: dat.user_id,
          username: dat.username,
          name: dat.nickname,
          avatar: dat.avatar_url || '',
          isVIP: false,
          vipLevel: dat.vip_level,
          vipExpiry: dat.vip_expiry || '',
          phone: dat.phone || "",
          gender: dat.gender,
          googleBound: dat.google_id ? true : false,
          appleBound: dat.apple_id ? true : false,
          level: dat.level,
        };
        activeUser = activeUser1;
        console.log("构建的用户信息对象:", activeUser);
        // 将用户信息保存到cookie中
        SaveDataToCookie('UserInfo', activeUser, 7); // 保存7天
        return activeUser;
      }
    } else {
      console.error("登录失败:", data.msg || '登录失败');
      throw new Error(data.msg || '登录失败');
    }
  } catch (error) {
    console.error('登录请求失败:', error);
    throw error;
  }

  // 如果执行到这里，说明登录失败
  console.log("登录函数结束，返回null");
  throw new Error("登录失败");
};

export const register = async (username: string, password: string, regType: string, name?: string): Promise<UserInfo> => {
  console.log("开始执行注册函数，参数:", { username, password, regType, name });
  await delay(1000);
  console.log("延迟完成，开始发送注册请求");

  try {
    const response = await fetch(url_base + "/loginview/register", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: username,
        password_hash: password,
        nickname: name
      })
    });

    console.log("注册响应对象:", response);
    const data = await response.json();
    console.log("注册响应数据:", data);

    if (data.code === 200) {
      console.log("注册成功，开始处理返回数据");
      const dat = data.data;
      console.log("register response data:", dat);
      let phone = "";
      let email = "";
      if (regType === 'PHONE') {
        phone = dat.phone;
        email = "";
      } else if (regType === 'EMAIL') {
        email = dat.email;
        phone = "";
      }
      console.log(`根据注册类型${regType}设置的联系方式:`, { phone, email });
      if (dat) {
        const activeUser: UserInfo = {
          id: dat.user_id,
          username: dat.username,
          name: dat.nickname,
          avatar: '',
          isVIP: false,
          vipLevel: '',
          vipExpiry: '',
          phone: phone,
          gender: '保密',
          googleBound: false,
          appleBound: false,
          level: 1
        };
        console.log("构建的用户信息对象:", activeUser);
        return activeUser;
      }
    } else {
      console.error("注册失败:", data.msg || '注册失败');
      throw new Error(data.msg || '注册失败');
    }
  } catch (error) {
    console.error('注册请求失败:', error);
    throw error;
  }

  // 如果执行到这里，说明注册失败
  console.log("注册函数结束，抛出异常");
  throw new Error("注册失败");
};

/**
 * 模擬驗證驗證碼
 */
export const verifyCode = async (identifier: string, code: string): Promise<boolean> => {
  await delay(800);
  // 模擬邏輯：只要輸入 123456 就通過，或者不為空
  return code === '123456' || code.length === 6;
};

export const resetPassword = async (identifier: string, newPassword: string): Promise<boolean> => {
  console.log("开始执行重置密码函数，参数:", { identifier, newPassword });
  await delay(1500);
  try {
    console.log("开始发送重置密码请求到后端");
    const response = await fetch(url_base + "/loginview/reset_password", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: identifier,
        password_hash: newPassword,
      })
    });

    console.log("重置密码响应对象:", response);
    const data = await response.json();
    console.log("重置密码响应数据:", data);

    if (data.code === 200) {
      console.log("密码重置成功，返回true");
      return true;
    } else {
      console.error("密码重置失败:", data.msg || '重置失败');
      throw new Error(data.msg || '重置失败');
      return false;
    }
  } catch (error) {
    console.error('重置请求失败:', error);
    throw error;
    return false;
  }
  return false;
  // // 如果执行到这里，说明登录失败
  // console.log("登录函数结束，返回null");
  // throw new Error("登录失败");
  // // console.log(`Password for ${identifier} has been reset to ${newPassword}`);
  // return true;
};

// utils/auth.ts 或你的认证模块

export const getCurrentUser = async (): Promise<UserInfo | null> => {
  await delay(500); // 模拟延迟（仅开发环境建议保留）

  const userInfo = GetDataFromCookie('UserInfo');
  if (!userInfo) {
    return null;
  }
  // 检查 VIP 是否过期
  const { vipExpiry } = userInfo;
  let isExpired = false;
  if (vipExpiry) {
    const expiryDate = new Date(vipExpiry); // 格式: "2026-02-20 00:00:00"
    const now = new Date();
    if (!isNaN(expiryDate.getTime()) && expiryDate <= now) {
      isExpired = true;
    }
  }
  // 🔒 如果 VIP 已过期，强制登出
  if (isExpired) {
    console.log('VIP 已过期，强制登出用户');
    logout(); // 执行登出逻辑
    return null;
  }
  // 未过期，正常返回
  activeUser = userInfo;
  return userInfo;
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
  RemoveCookie('UserInfo');
};

// --- Pets ---
let mockPets: PetProfile[] = [
  { id: 'p1', name: '麻薯', breed: '布偶貓', avatar: 'https://picsum.photos/seed/cat1/200', isMemorial: false, gender: '小公主', birthday: '2021-05-20', hobbies: '睡覺, 吃罐頭' },
  { id: 'p2', name: '豆腐', breed: '比熊', avatar: 'https://picsum.photos/seed/dog1/200', isMemorial: false, gender: '小王子', birthday: '2022-08-15', hobbies: '追球, 散步' },
  { id: 'p3', name: '糯米', breed: '英短', avatar: 'https://picsum.photos/seed/cat2/200', isMemorial: true, gender: '小天使', birthday: '2015-02-10', hobbies: '曬太陽', memorialDate: '2024-01-10' },
];

export const fetchPets = async (): Promise<PetProfile[]> => {
  console.log('开始获取宠物信息');
  try {
    let user_id = activeUser?.id;
    console.log('当前用户ID:', user_id);

    let request_data = {
      user_id: user_id,
      id: "",
      name: "",
      breed: "",
      avatar: "",
      isMemorial: false,
      gender: "",
      birthday: "",
      hobbies: "",
      memorialDate: "",
    };

    console.log('发送请求数据:', request_data);

    const response = await fetch(`${url_base}/pet/get_pets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request_data),
    });

    console.log('响应状态:', response.status);

    const data = await response.json();
    console.log('响应数据:', data);

    if (data.code == 200) {
      let pets = data.data.pets;
      console.log('成功获取到的宠物数量:', pets.length);
      return pets;
    } else {
      console.log('请求失败，错误代码:', data.code);
    }
  } catch (error) {
    console.error('获取宠物请求失败:', error);
    return null;
  }
};

export const addPet = async (pet: PetProfile): Promise<PetProfile> => {
  try {
    let user_id = activeUser?.id;
    let request_data = {
      user_id: user_id,
      id: pet.id ? pet.id : "",
      name: pet.name,
      breed: pet.breed ? pet.breed : "",
      avatar: pet.avatar ? pet.avatar : "",
      isMemorial: pet.isMemorial,
      gender: pet.gender,
      birthday: pet.birthday,
      hobbies: pet.hobbies ? pet.hobbies : "",
      memorialDate: pet.memorialDate ? pet.memorialDate : "",
    };
    const response = await fetch(`${url_base}/pet/add_pet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request_data),
    });
    const data = await response.json();
    if (data.code == 200) {
      let result = data.data.pet;
      return result;
    }
  } catch (error) {
    console.error('添加宠物请求失败:', error);
    return null;
  }
};

export const fetchPetProfile = async (pet_id: number): Promise<PetProfile> => {
  try {
    await delay(500);
    // return mockPets[0]; // Default return first pet
    let user_id = activeUser?.id;
    let request_data = {
      user_id: user_id,
      id: pet_id,
      name: "",
      breed: "",
      avatar: "",
      isMemorial: false,
      gender: "",
      birthday: "",
      hobbies: "",
      memorialDate: "",
    };
    const response = await fetch(`${url_base}/pet/get_pet_info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request_data),
    });
    const data = await response.json();
    if (data.code == 200) {
      let pets = data.data.pet;
      return pets;
    }
  } catch (error) {
    console.error('获取具体宠物请求失败:', error);
    return null;
  }
};

export const updatePetProfile = async (pet: PetProfile): Promise<PetProfile> => {
  try {
    // await delay(500);
    // return mockPets[0]; // Default return first pet
    let user_id = activeUser?.id;
    let request_data = {
      user_id: user_id,
      id: pet.id,
      name: pet.name,
      breed: pet.breed,
      avatar: pet.avatar,
      isMemorial: pet.isMemorial,
      gender: pet.gender,
      birthday: pet.birthday,
      hobbies: pet.hobbies,
      memorialDate: pet.memorialDate,
    };
    const response = await fetch(`${url_base}/pet/update_pet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request_data),
    });
    const data = await response.json();
    if (data.code == 200) {
      let pets = data.data.pet;
      return pets;
    }
  } catch (error) {
    console.error('更新宠物请求失败:', error);
    return null;
  }
};

export const updatePetWeight = async (weight: number, pet_id: number): Promise<WeightEntry[]> => {
  try {
    let user_id = activeUser?.id;
    let timedate = new Date().toISOString().split('T')[0];
    let request_data = {
      user_id: user_id,
      id: pet_id,
      weight: weight,
      date: timedate
    };
    const response = await fetch(`${url_base}/pet/update_pet_weight`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request_data),
    });
    const data = await response.json();
    if (data.code == 200) {
      let pets = data.data.weight_history;
      // await delay(500);
      // Add new weight entry
      // return fetchWeightHistory().then(history => [...history, { date: pets.date, pets.weight }]);
      return pets;
    }
  } catch (error) {
    console.error('更新宠物请求失败:', error);
    return null;
  }
};

export const moveToMemorial = async (petId: string): Promise<PetProfile> => {
  try {
    // await delay(500);
    // return mockPets[0]; // Default return first pet
    let user_id = activeUser?.id;
    await delay(800);
    let memorial_date = new Date().toISOString().split('T')[0];
    let request_data = {
      user_id: user_id,
      id: petId,
      name: "",
      breed: "",
      avatar: "",
      isMemorial: true,
      gender: "",
      birthday: "",
      hobbies: "",
      memorialDate: memorial_date,
    };
    const response = await fetch(`${url_base}/pet/update_pet_death`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request_data),
    });
    const data = await response.json();
    if (data.code == 200) {
      // const pet = mockPets.find(p => p.id === petId);
      // if (pet) {
      //   pet.isMemorial = true;
      //   pet.memorialDate = memorial_date;
      //   return pet;
      // }
      return data.data.pet;
    }
  } catch (error) {
    console.error('更新宠物请求失败:', error);
    return null;
  }

  // throw new Error("Pet not found");
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

export const fetchWeightHistory = async (petId: string): Promise<WeightEntry[]> => {
  try {
    let user_id = activeUser?.id;
    let request_data = {
      user_id: user_id,
      id: petId,
      weight: 0,
      date: ""
    };
    const response = await fetch(`${url_base}/pet/get_pet_weight`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request_data),
    });
    const data = await response.json();
    if (data.code == 200) {
      let pets = data.data.weightHistory;
      return pets;
    }
  } catch (error) {
    console.error('更新宠物请求失败:', error);
    return null;
  }
  // return JSON.parse(JSON.stringify(mockPosts));
  // await delay(500);
  // return [
  //   { date: '2025-01-01', weight: 3.8 },
  //   { date: '2025-02-01', weight: 4.0 },
  //   { date: '2025-03-01', weight: 4.2 },
  // ];
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

export const fetchCommunityPostsByTime = async (datatype: string, timenode: string | null, limit: number): Promise<Post[]> => {
  await delay(800);
  // Return deep copy to prevent reference sharing issues with frontend state
  // 每次获取3个帖子
  try {
    var userid = activeUser?.id || 'me';
    const requestBody = {
      user_id: userid,
      limit: limit,
      timenode: timenode,
      exclude_post_ids: [],
      datatype: datatype
    }
    console.log("开始获取社区帖子，用户ID:", userid);
    const response = await fetch(url_base + "/communityview/get_community_posts_by_time", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    console.log("获取社区帖子响应:", response);
    const data = await response.json();
    console.log("获取社区帖子响应数据:", data);
    if (data.code === 200) {
      const dat = data.data;
      console.log("获取社区帖子数据内容:", dat);
      if (dat) {
        console.log("获取社区帖子成功，帖子数量:", dat.posts ? dat.posts.length : 0);
        return dat.posts; // 返回后端返回的帖子数组
      }
    } else {
      console.log("获取社区帖子失败:", data.msg);
      throw new Error(data.msg || '获取失败');
    }
  } catch (e) {
    console.error("获取社区帖子时发生错误:", e);
  }
  console.log("返回空帖子数组");
  return [];
  // return JSON.parse(JSON.stringify(mockPosts));
};

export const fetchCommunityPosts = async (): Promise<Post[]> => {
  await delay(800);
  // Return deep copy to prevent reference sharing issues with frontend state
  // 每次获取3个帖子
  try {
    var userid = activeUser?.id || 'me';
    const requestBody = {
      user_id: userid || 'me',
      num: community_request_limit,
      offset: community_request_offset,
      exclude_post_ids: []  // 暂时不排除任何帖子
    };
    console.log("开始获取社区帖子，用户ID:", userid);
    const response = await fetch(url_base + "/communityview/get_community_posts", {  // 修正API端点
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    console.log("获取社区帖子响应:", response);
    const data = await response.json();
    console.log("获取社区帖子响应数据:", data);
    if (data.code === 200) {
      const dat = data.data;
      console.log("获取社区帖子数据内容:", dat);
      if (dat) {
        community_request_offset = community_request_offset + 1;
        console.log("获取社区帖子成功，帖子数量:", dat.posts ? dat.posts.length : 0);
        return dat.posts; // 返回后端返回的帖子数组
      }
    } else {
      community_request_offset = community_request_offset - 1;
      console.log("获取社区帖子失败:", data.msg);
      throw new Error(data.msg || '获取失败');
    }
  } catch (e) {
    console.error("获取社区帖子时发生错误:", e);
  }
  console.log("返回空帖子数组");
  return [];
  // return JSON.parse(JSON.stringify(mockPosts));
};

export const uploadCommunityVideo = async (user_id: string, files: File[]): Promise<string[]> => {
  console.log('uploadCommunityVideo - 开始执行', { user_id, fileCount: files.length });
  try {
    // 创建 FormData 对象来发送文件
    const formData = new FormData();
    // 添加用户ID
    formData.append('user_id', user_id ? user_id : 'me');
    // 添加所有文件
    files.forEach((file, index) => {
      console.log('uploadCommunityVideo - 添加文件', index, file);
      formData.append('videos', file); // 使用 'videos' 作为字段名，后端会接收一个文件数组
    });
    console.log('uploadCommunityVideo - 准备发送请求到后端API...');
    const response = await fetch(url_base + "/communityview/upload_videos", {
      method: 'POST',
      // 注意：发送文件时不需要设置 'Content-Type'，浏览器会自动设置
      // 浏览器会自动设置为 'multipart/form-data' 并包含正确的边界
      body: formData
    });
    console.log('uploadCommunityVideo - 请求响应状态:', response.status);
    const data = await response.json();
    console.log('uploadCommunityVideo - 后端响应数据:', data);
    if (data.code === 200) {
      const dat = data.data;
      if (dat) {
        console.log('uploadCommunityVideo - 响应数据内容:', dat);
        return dat.video_urls; // 返回后端返回的视频URL数组
      }
    } else {
      console.log('uploadCommunityVideo - 后端响应失败，错误信息:', data.msg);
      throw new Error(data.msg || '上传失败');
    }
  } catch (error) {
    console.error('uploadCommunityVideo - 上传视频时发生错误:', error);
    throw error;
  }

  console.log('uploadCommunityVideo - 上传完成');
  return [];
};
export const uploadCommunityPhoto = async (user_id: string, files: File[]): Promise<string[]> => {
  console.log('uploadCommunityPhoto - 开始执行', { user_id, fileCount: files.length });
  try {
    // 创建 FormData 对象来发送文件
    const formData = new FormData();
    // 添加用户ID
    formData.append('user_id', user_id ? user_id : 'me');
    // 添加所有文件
    files.forEach((file, index) => {
      console.log('uploadCommunityPhoto - 添加文件', index, file);
      formData.append('images', file); // 使用 'images' 作为字段名，后端会接收一个文件数组
    });
    console.log('uploadCommunityPhoto - 准备发送请求到后端API...');
    const response = await fetch(url_base + "/communityview/upload_images", {
      method: 'POST',
      // 注意：发送文件时不需要设置 'Content-Type'，浏览器会自动设置
      // 浏览器会自动设置为 'multipart/form-data' 并包含正确的边界
      body: formData
    });
    console.log('uploadCommunityPhoto - 请求响应状态:', response.status);
    const data = await response.json();
    console.log('uploadCommunityPhoto - 后端响应数据:', data);
    if (data.code === 200) {
      const dat = data.data;
      if (dat) {
        console.log('uploadCommunityPhoto - 响应数据内容:', dat);
        return dat.image_urls; // 返回后端返回的图片URL数组
      }
    } else {
      console.log('uploadCommunityPhoto - 后端响应失败，错误信息:', data.msg);
      throw new Error(data.msg || '上传失败');
    }
  } catch (error) {
    console.error('uploadCommunityPhoto - 上传图片时发生错误:', error);
    throw error;
  }

  console.log('uploadCommunityPhoto - 上传完成');
  return [];
};

export const uploadCommunityContent = async (user_id: string, content: string, files: string[], tags: string[]): Promise<Post> => {
  console.log('uploadCommunityContent - 开始执行', { user_id, content, files, tags });
  try {
    console.log('uploadCommunityContent - 准备发送请求到后端API...');
    await delay(1000);
    console.log('uploadCommunityContent - 发起fetch请求...', files);
    // 确保所有参数都符合后端期望的格式
    const requestBody = {
      user_id: user_id || 'me',
      content: content,
      images: Array.isArray(files) ? files : [],  // 确保是数组
      tags: Array.isArray(tags) ? tags : []      // 确保是数组
    };
    console.log('uploadCommunityContent - requestBody:', requestBody);
    const response = await fetch(url_base + "/communityview/add_new_community", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    console.log('uploadCommunityContent - 请求响应状态:', response.status);
    const data = await response.json();
    console.log('uploadCommunityContent - 后端响应数据:', data);

    if (data.code === 200) {
      console.log('uploadCommunityContent - 后端响应成功，数据:', data.data);
      const dat = data.data;
      if (dat) {
        console.log('uploadCommunityContent - 响应数据内容:', dat);
        // 返回创建的帖子对象（模拟数据，实际应从后端响应中获取）
        const newPost: Post = {
          id: dat.post.id,
          author: dat.post.author,
          avatar: dat.post.avatar,
          time: dat.post.time,
          content: dat.post.content,
          fullContent: dat.post.fullContent,
          images: dat.post.images,
          likes: dat.post.likes,
          comments: dat.post.comments,
          isLiked: dat.post.isLiked,
          userTags: dat.post.userTags,
          commentList: dat.post.commentList,
          isVIP: dat.post.isVIP,
          vipLevel: dat.post.vipLevel,
        };
        return newPost;
      }
    } else {
      console.log('uploadCommunityContent - 后端响应失败，错误信息:', data.msg);
      throw new Error(data.msg || '');
    }
  } catch (error) {
    console.error('uploadCommunityContent - 上传社区内容时发生错误:', error);
    throw error;
  }

  console.log('uploadCommunityContent - 社区内容上传完成');
  return null;
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

/**
 * 新增：支持多圖發布的接口
 */
// export const createCommunityPostMulti = async (content: string, images: string[], tags: string[]): Promise<Post> => {
//   await delay(1000);
//   const newPost: Post = {
//     id: Date.now(),
//     author: activeUser?.name || 'Me',
//     avatar: activeUser?.avatar || '',
//     time: '剛剛',
//     content,
//     fullContent: content,
//     images: images,
//     likes: 0,
//     comments: 0,
//     isLiked: false,
//     userTags: tags,
//     commentList: [],
//     isVIP: activeUser?.isVIP,
//     vipLevel: activeUser?.vipLevel
//   };
//   mockPosts.unshift(newPost);
//   return newPost;
// };
// ... existing code ...
export const createCommunityPostMulti = async (content: string, files: File[], tags: string[]): Promise<Post> => {
  try {
    await delay(1000);
    var user_id = activeUser?.id || 'me';
    console.log('createCommunityPostMulti - 开始处理，用户ID:', user_id);
    console.log('createCommunityPostMulti - 接收到的文件数量:', files.length);
    files.forEach((file, index) => {
      console.log(`createCommunityPostMulti - 文件${index}:`, file.name, '类型:', file.type);
    });

    // 区分图片和视频文件
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    const videoFiles = files.filter(file => file.type.startsWith('video/'));

    console.log('createCommunityPostMulti - 图片文件数量:', imageFiles.length);
    console.log('createCommunityPostMulti - 视频文件数量:', videoFiles.length);

    let fUrls: string[] = [];
    if (imageFiles.length != 0) {
      console.log('createCommunityPostMulti - 开始上传图片文件', imageFiles);
      try {
        const imageUrls = await uploadCommunityPhoto(user_id, imageFiles);
        console.log('createCommunityPostMulti - 图片上传完成，URLs:', imageUrls);
        fUrls = fUrls.concat(imageUrls);
      } catch (error) {
        console.error('上传图片文件时出错:', error);
        throw new Error('图片上传失败');
      }
    }
    if (videoFiles.length != 0) {
      console.log('createCommunityPostMulti - 开始上传视频文件', videoFiles);
      try {
        const videoUrls = await uploadCommunityVideo(user_id, videoFiles);
        console.log('createCommunityPostMulti - 视频上传完成，URLs:', videoUrls);
        fUrls = fUrls.concat(videoUrls);
      } catch (error) {
        console.error('上传视频文件时出错:', error);
        throw new Error('视频上传失败');
      }
    }

    console.log('createCommunityPostMulti - 准备上传帖子内容，总文件URL数量:', fUrls.length);
    console.log('createCommunityPostMulti - 文件URLs:', fUrls);

    try {
      const callbackPost = await uploadCommunityContent(user_id, content, fUrls, tags);
      const newPost = callbackPost;
      console.log('createCommunityPostMulti - 帖子创建完成:', newPost);
      mockPosts.unshift(newPost);
      return newPost;
    } catch (error) {
      console.error('上传帖子内容时出错:', error);
      throw new Error('帖子内容上传失败');
    }
  } catch (error) {
    console.error('创建社区帖子时出错:', error);
    throw error; // 重新抛出错误，让调用方处理
  }
};
// ... existing code ...


export const toggleLikePost = async (postId: number): Promise<{ likes: number, isLiked: boolean }> => {
  console.log('开始执行帖子点赞操作，帖子ID:', postId);
  await delay(300);
  // const post = mockPosts.find(p => p.id === postId);
  // if (post) {
  //   post.isLiked = !post.isLiked;
  //   post.likes += post.isLiked ? 1 : -1;
  //   return { likes: post.likes, isLiked: post.isLiked };
  // }
  try {
    var userId = activeUser?.id || 'me';
    console.log('准备发送点赞请求，用户ID:', userId, '帖子ID:', postId);

    let bodydata = {
      user_id: userId,
      target_id: postId,
      target_type: 'POST',
    }
    console.log("准备发送点赞请求到后端API，请求数据:", bodydata);
    const response = await fetch(url_base + "/communityview/like_post", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bodydata)  // 直接发送数据，不要包装在额外的对象中
    });

    console.log("点赞请求发送完成，响应状态:", response.status);
    const data = await response.json();
    console.log("点赞响应数据:", data);

    if (data.code === 200) {
      const dat = data.data;
      console.log("点赞成功，返回数据:", dat);

      if (dat) {
        // 根据后端返回的数据结构创建评论对象
        console.log("返回点赞数:", dat.like_count, "点赞状态:", dat.is_liked);
        return { likes: dat.like_count, isLiked: dat.is_liked };
      }
    } else {
      console.error("点赞失败，错误信息:", data.msg || '点赞失败');
      throw new Error(data.msg || '点赞失败');
      return null;
    }

  } catch (e) {
    console.error("点赞时出错:", e);
    throw e; // 重新抛出错误，让调用方知道请求失败
  }

};

// 发布顶级评论，需要参数（post_id,user_id,content）（目标帖子id，内容）
export const addComment = async (postId: number, content: string): Promise<Comment> => {
  await delay(500);
  try {
    var userId = activeUser?.id || 'me';
    console.log("开始添加评论，参数:", { postId, content, userId });

    let bodydata = {
      id: null,
      post_id: postId,
      user_id: userId,
      parent_id: null,      // 对于顶级评论，可以是 null 或 0
      reply_to_id: null,    // 可选参数
      content: content
    }
    console.log("准备发送评论请求到后端API，请求数据:", bodydata);
    const response = await fetch(url_base + "/communityview/comment_post", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bodydata)  // 直接发送数据，不要包装在额外的对象中
    });
    console.log("评论请求发送完成，响应状态:", response.status);
    const data = await response.json();
    console.log("评论响应数据:", data);
    if (data.code === 200) {
      const dat = data.data;
      console.log("评论成功，返回数据:", dat);
      if (dat) {
        // 根据后端返回的数据结构创建评论对象
        console.log("准备构建新评论对象 dat", dat);
        const newComment: Comment = {
          id: dat.id.toString(),  // 后端返回的是数字，转为字符串
          author: dat.author,
          avatar: dat.avatar,
          content: dat.content,
          time: dat.time,
          likes: 0,  // 新评论默认没有点赞
          isLiked: false,
          isVIP: activeUser?.isVIP,
          vipLevel: activeUser?.vipLevel,
          replyToName: null, // 顶级评论没有回复目标
          replies: [],  // 顶级评论暂时没有回复
          replyToContent: null,// 顶级评论没有回复目标内容
        };
        console.log("评论创建成功，返回新评论对象:", newComment);
        return newComment;
      }
    } else {
      console.error("评论失败，错误信息:", data.msg || '评论失败');
      throw new Error(data.msg || '评论失败');
      return null;
    }

  } catch (e) {
    console.error("添加评论时出错:", e);
    throw e; // 重新抛出错误，让调用方知道请求失败
  }
};

export const toggleLikeComment = async (postId: number, commentId: string): Promise<{ likes: number, isLiked: boolean }> => {
  console.log('开始执行评论点赞操作，帖子ID:', postId, '评论ID:', commentId);
  await delay(300);
  try {
    var userId = activeUser?.id || 'me';
    console.log('准备发送评论点赞请求，用户ID:', userId, '帖子ID:', postId, '评论ID:', commentId);

    let bodydata = {
      user_id: userId,
      target_id: commentId,
      target_type: 'COMMENT',
    }

    console.log("准备发送评论点赞请求到后端API，请求数据:", bodydata);
    const response = await fetch(url_base + "/communityview/like_post", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bodydata)  // 直接发送数据，不要包装在额外的对象中
    });

    console.log("评论点赞请求发送完成，响应状态:", response.status);
    const data = await response.json();
    console.log("评论点赞响应数据:", data);

    if (data.code === 200) {
      const dat = data.data;
      console.log("评论点赞成功，返回数据:", dat);

      if (dat) {
        // 根据后端返回的数据结构创建评论对象
        console.log("返回点赞数:", dat.like_count, "点赞状态:", dat.is_liked);
        return { likes: dat.like_count, isLiked: dat.is_liked };
      }
    } else {
      console.error("评论点赞失败，错误信息:", data.msg || '点赞失败');
      throw new Error(data.msg || '点赞失败');
      return null;
    }

  } catch (e) {
    console.error("评论点赞时出错:", e);
    throw e; // 重新抛出错误，让调用方知道请求失败
  }

  // Simplified logic, usually requires recursion for replies
  // return { likes: 1, isLiked: true };
};

// 评论回复，需要参数（post_id,user_id,content,parent_id）(目标帖子id、发布用户id、评论内容、被回复评论id)
export const addReply = async (postId: number, commentId: string, content: string): Promise<Comment | null> => {
  await delay(500);
  try {
    var userId = activeUser?.id || 'me';
    console.log("开始添加回复，参数:", { postId, commentId, content, userId });

    let bodydata = {
      id: null,
      post_id: postId,
      user_id: userId,
      parent_id: commentId,      // 回复评论时，将目标评论ID作为parent_id
      reply_to_id: null,         // 可选参数，可进一步指定被回复的用户ID
      content: content
    }
    console.log("准备发送回复请求到后端API，请求数据:", bodydata);
    const response = await fetch(url_base + "/communityview/comment_post", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bodydata)  // 直接发送数据，不要包装在额外的对象中
    });
    console.log("回复请求发送完成，响应状态:", response.status);
    const data = await response.json();
    console.log("回复响应数据:", data);
    if (data.code === 200) {
      const dat = data.data;
      console.log("回复成功，返回数据:", dat);
      if (dat) {
        // 根据后端返回的数据结构创建评论对象
        console.log("准备构建新回复对象 dat", dat);
        const newComment: Comment = {
          id: dat.id.toString(),  // 后端返回的是数字，转为字符串
          author: dat.author,
          avatar: dat.avatar,
          content: dat.content,
          time: dat.time,
          likes: 0,  // 新评论默认没有点赞
          isLiked: false,
          replyToName: dat.replyToName,
          replyToContent: dat.replyToContent,
        };
        console.log("回复创建成功，返回新回复对象:", newComment);
        return newComment;
      }
    } else {
      console.error("回复失败，错误信息:", data.msg || '评论失败');
      throw new Error(data.msg || '评论失败');
    }

  } catch (e) {
    console.error("添加回复时出错:", e);
    throw e; // 重新抛出错误，让调用方知道请求失败
  }
  return null;

};

export const fetchCommunityHistory = async (type: string, limit: number, offset: number): Promise<CommunityHistoryItem[]> => {
  try {
    let user_id = activeUser?.id || 'me';
    let request_data = {
      user_id: user_id,
      limit: limit,
      offset: offset,
    }
    let request_url = url_base;
    switch (type) {
      case 'WATCH':
        request_url += '/communityhistoryview/get_post_record';
        break;
      case 'LIKE':
        request_url += '/communityhistoryview/get_like_record';
        break;
      case 'COMMENT':
        request_url += '/communityhistoryview/get_comment_record';
        break;
    }
    const response = await fetch(request_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request_data),
    });
    const data = await response.json();
    if (data.code === 200) {
      return data.data.result;
    } else {
      console.warn('搜索接口返回非预期格式:', data);
      return [];
    }
  } catch (e) {
    console.error("获取社区历史记录时出错:", e);
    return [];
  }
  // await delay(500);
  // return [
  //   { id: 'h1', postId: 1, author: '貓貓教主', authorAvatar: 'https://picsum.photos/seed/u1/100', contentSnippet: '今天天氣真好...', time: '2小時前', type: 'WATCH' }
  // ];
};

// --- Shop & Orders ---

let mockCart: CartItem[] = [];
let mockOrders: Order[] = [];

// 支持分页搜索商品
/**
 * 搜索商品（支持分页）
 * @param keyword 搜索关键词
 * @param page 页码（从 1 开始）
 * @param limit 每页数量，默认 10
 * @param userId 可选用户 ID（用于日志或权限，非必须）
 * @returns 商品列表 Promise<Product[]>
 */
export const searchProducts = async (
  keyword: string,
  page: number,
  limit: number = 10,
): Promise<Product[]> => {
  let user_id = activeUser?.id || 'me';
  // 参数校验
  if (!keyword?.trim()) {
    return []; // 空关键词直接返回空数组，避免无效请求
  }
  if (page < 1) page = 1;

  try {
    const response = await fetch(url_base + '/discoveryview/search_products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: user_id || null, // 后端允许为 null
        keyword: keyword.trim(),
        pages: page,   // 注意：后端字段是 `pages`（复数）
        limit: limit,
      }),
    });

    if (!response.ok) {
      console.error(`搜索请求失败: ${response.status} ${response.statusText}`);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // 根据你的后端返回结构：{ code, msg, data: { products: [...] } }
    if (data.code === 200 && Array.isArray(data.data?.products)) {
      return data.data.products;
    } else {
      console.warn('搜索接口返回非预期格式:', data);
      return [];
    }
  } catch (error) {
    console.error('搜索商品时发生错误:', error);
    // 可选：抛出错误让调用方处理，或静默返回空数组
    // 这里选择返回空数组，避免 UI 崩溃
    return [];
  }
};

export const fetchProducts = async (category?: string, offset?: number, limit?: number, options?: { signal?: AbortSignal }): Promise<Product[]> => {
  console.log("开始执行 fetchProducts 函数，参数 category:", category);
  await delay(500);
  try {
    const userId = activeUser?.id || 'me';
    console.log("fetchProducts - offset:", offset);
    const bodydata = {
      user_id: userId,
      pages: offset,
      limit: limit,
      category: category,
    };
    console.log("准备发送请求到后端API，请求数据:", bodydata);
    console.log("发送请求到:", url_base + "/discoveryview/get_discoveryview_shops");
    const response = await fetch(url_base + "/discoveryview/get_discoveryview_shops", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodydata),
      signal: options?.signal, // 👈 关键：传入 signal
    });
    console.log("接收到响应，状态码:", response.status);
    const data = await response.json();
    console.log("解析后的响应数据:", data);
    if (data.code === 200) {
      const dat = data.data.products;
      console.log("响应成功，数据长度:", dat ? dat.length : 0);
      if (dat && dat.length > 0) {
        let products: Product[] = dat.map((item: any) => ({
          id: String(item.id),
          productId: String(item.product_id),
          name: item.name,
          price: item.price,
          originalPrice: item.original_price,
          imageUrl: String(item.imageUrl),
          category: item.category,
          tag: item.tag,
          rating: item.rating,
          sales: item.sales,
          description: item.description,
        }));
        // 如果指定了非 'ALL' 分类，再做一次前端过滤（建议后端处理，但保留兼容）
        if (category && category.trim().toLowerCase() !== 'all') {
          products = products.filter(p => p.category === category.trim());
        }
        console.log("返回的产品数量:", products.length);
        return products;
      } else {
        return [];
      }
    } else {
      // console.error("请求失败，错误信息:", data.msg || '未知错误');
      return [];
      // throw new Error(data.msg || '请求失败');
    }
  } catch (e) {
    // 检查是否是 AbortError（由 controller.abort() 触发）
    if (e instanceof Error && e.name === 'AbortError') {
      console.log('fetchProducts 请求被取消');
      throw e; // 仍抛出，由调用方决定是否忽略
    }
    console.error("fetchProducts 出错:", e);
    throw e;
  }
  // 如果没有数据，返回空数组（符合 Promise<Product[]> 类型）
  return [];
};

export const fetchProductById = async (id: string): Promise<Product | null> => {
  console.log("开始执行 fetchProductById 函数，参数 id:", id); // 函数开始执行时的日志
  await delay(500);
  // const products = await fetchProducts();
  // return products.find(p => p.id === id) || null;
  try {
    const userId = activeUser?.id || 'me';
    const bodydata = {
      user_id: userId,
      product_id: id
    };
    console.log("准备发送请求到后端API，请求数据:", bodydata);
    console.log("发送请求到:", url_base + "/productdetailview/get_discoveryview_productmes"); // 发送请求时的日志
    const response = await fetch(url_base + "/productdetailview/get_discoveryview_productmes", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodydata),
    });
    console.log("接收到响应，状态码:", response.status); // 接收到响应时的日志
    const data = await response.json();
    console.log("解析后的响应数据:", data); // 显示完整的响应数据

    if (data.code === 200) {
      const dat = data.data;
      console.log("响应成功，数据:", dat); // 成功回调中显示关键业务数据
      if (dat) {
        let product = dat.product
        let result: Product = {
          id: product.id,
          productId: product.product_id,
          name: product.name,
          price: product.price,
          originalPrice: product.original_price,
          imageUrl: product.imageUrl,
          category: product.category,
          tag: product.tags,
          rating: product.rating,
          sales: product.sales,
          description: product.description,
          detailImages: [product.imageUrl],
        };
        console.log("返回的产品数据:", result);
        return result;
      } else {
        console.log("响应中没有产品数据");
        return null;
      }
    } else {
      console.error("请求失败，错误信息:", data.msg || '未知错误');
      throw new Error(data.msg || '请求失败');
    }
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      console.log('fetchProductById 请求被取消');
      throw e;
    }
    console.error("获取商品详情时出错:", e); // 错误处理中使用 console.error 输出异常信息
    throw e;
  }
  console.log("函数结束执行，返回 null");
  return null;
};

export const fetchCart = async (options?: { signal?: AbortSignal }): Promise<CartItem[]> => {
  console.log("开始执行 fetchCart 函数");
  await delay(500);
  try {
    const userId = activeUser?.id || 'me';
    console.log("fetchCart - 当前用户ID:", userId);
    const bodydata = {
      user_id: userId,
      pages: discovery_carts_request_offset,
      limit: discovery_carts_request_limit,
      category: "",
    };
    console.log("准备发送请求到后端API，请求数据:", bodydata);
    console.log("发送请求到:", url_base + "/cartview/get_discoveryview_carts");
    const response = await fetch(url_base + "/cartview/get_discoveryview_carts", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodydata),
      signal: options?.signal, // 👈 关键：传入 signal
    });
    console.log("接收到响应，状态码:", response.status);
    const data = await response.json();
    console.log("解析后的响应数据:", data);
    if (data.code === 200) {
      const dat = data.data.carts;
      console.log("响应成功，数据长度:", dat ? dat.length : 0);
      if (dat && dat.length > 0) {
        discovery_carts_request_offset += 1;
        console.log("更新分页偏移量，新的值:", discovery_carts_request_offset);
        const carts: CartItem[] = dat.map((item: any) => ({
          id: String(item.id),
          productId: String(item.productId),
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          imageUrl: item.imageUrl,
          selected: item.selected,
        }));
        mockCart = carts;
        console.log("返回的购物车项数量:", mockCart.length);
        return mockCart;
      } else {
        // 没有新数据，返回当前 mockCart（或空数组）
        return mockCart;
      }
    } else {
      console.error("请求失败，错误信息:", data.msg || '未知错误');
      throw new Error(data.msg || '请求失败');
    }
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      console.log('fetchCart 请求被取消');
      throw e;
    }
    console.error("获取购物车时出错:", e);
    throw e;
  }
  return mockCart; // 默认返回当前缓存（或初始化为空数组）
};

export const addToCart = async (product: Product, quantity: number): Promise<void> => {
  await delay(300);
  const existing = mockCart.find(i => i.productId === product.id);
  if (existing) {
    existing.quantity += quantity;
  } else {
    mockCart.push({
      id: product.id,
      productId: product.productId,
      name: product.name,
      price: product.price,
      quantity,
      imageUrl: product.imageUrl,
      selected: true
    });
  }
  try {
    var userId = activeUser?.id || 'me';
    console.log("addToCart 当前用户ID:", userId);

    let bodydata = {
      user_id: userId,
      product_id: String(product.productId),
      num: quantity
    }
    console.log("addToCart准备发送请求到后端API，请求数据:", bodydata);
    console.log("addToCart发送请求到:", url_base + "/productdetailview/add_discoveryview_cart"); // 发送请求时的日志
    const response = await fetch(url_base + "/productdetailview/add_discoveryview_cart", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bodydata)  // 直接发送数据，不要包装在额外的对象中
    });
    console.log("接收到响应，状态码:", response.status); // 接收到响应时的日志
    const data = await response.json();
    console.log("解析后的响应数据:", data); // 显示完整的响应数据
    if (data.code === 200) {
      console.log("购物车响应成功"); // 成功回调中显示关键业务数据
    } else {
      console.error("请求失败，错误信息:", data.msg || '请求失败');
      throw new Error(data.msg || '请求失败');
    }
  } catch (e) {
    console.error("创建订单时出错:", e); // 错误处理中使用 console.error 输出异常信息
    throw e; // 重新抛出错误，让调用方知道请求失败
  }

  console.log("函数结束执行，返回 null");
  return null;
};

export const updateCartItem = async (id: string, updates: Partial<CartItem>): Promise<void> => {
  await delay(200);
  const item = mockCart.find(i => i.id === id);
  if (item) Object.assign(item, updates);
};

export const removeFromCart = async (id: string): Promise<boolean> => {
  await delay(200);
  try {
    const userId = activeUser?.id || 'me';
    const bodydata = {
      user_id: userId,
      cartsId_list: [id],
    };
    const response = await fetch(url_base + "/cartview/delete_carts", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodydata),
    });
    const data = await response.json();
    if (data.code === 200) {
      mockCart = mockCart.filter(i => i.id !== id);
      return true;
    } else {
      return false;
      throw new Error(data.msg || '删除失败');
    }
  } catch (e) {
    return false;
    throw e;
  }
};

export const updateOrderStatus = async (order_id: string, payStatus: string): Promise<string> => {
  return null;
};

export const updateOrder = async (order: Order): Promise<string> => {
  var userId = activeUser?.id || 'me';
  if (!userId) {
    throw new Error('用户未登录或 user_id 不存在');
  }
  const response = await fetch('/ordersview/update_discoveryview_userorder', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // 如果有 token 认证，加上 Authorization
      // 'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify({
      user_id: userId,
      order: order
    })
  });
  const result = await response.json();
  // 假设后端返回 { code, msg, data }
  if (result.code !== 200) {
    throw new Error(result.msg || '更新订单失败');
  }
  // 成功时返回订单 ID 或成功消息（根据你的需求）
  return result.data?.order_id || 'success';
};

// 创建一个订单，支付成功与失败都创建一个订单，根据status不同来展示
export const createOrderFromCart = async (items: CartItem[], address_id: string): Promise<string> => {
  try {
    console.log("开始创建订单，商品数量:", items.length);
    console.log("订单状态:", status);
    await delay(1000);
    var userId = activeUser?.id || 'me';
    console.log("addToCart 当前用户ID:", userId);

    

    let bodydata = {
      user_id: userId,
      cart_items: items,
      address_id: address_id,
    }
    console.log("发送订单请求数据:", bodydata);
    const response = await fetch(url_base + "/cartview/build_orders", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bodydata)  // 直接发送数据，不要包装在额外的对象中
    });
    console.log("订单请求响应状态:", response.status);
    const data = await response.json();
    console.log("订单请求响应数据:", data);
    if (data.code === 200) {
      const dat = data.data.order_id;
      console.log("订单创建成功，订单ID:", dat);
      return dat;
    } else {
      console.error("订单创建失败，错误信息:", data.msg || '请求失败');
      return null;
      throw new Error(data.msg || '请求失败');
    }
  } catch (e) {
    console.error("创建订单时发生错误:", e);
    throw e; // 重新抛出错误，让调用方知道请求失败
  }
};

export const clearSelectedCartItems = async (): Promise<void> => {
  mockCart = mockCart.filter(i => !i.selected);
};

export const fetchOrders = async (
  status: OrderStatus | 'ALL' | undefined, // undefined 表示 ALL
  page: number,
  limit: number = 10,
  signal?: AbortSignal
): Promise<Order[]> => {
  try {
    var userId = activeUser?.id || 'me';
    const category = status ?? 'ALL';
    const response = await fetch(url_base + "/ordersview/get_discoveryview_userorder", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        pages: page,
        limit: limit,
        category: category
      }),
      signal
    });
    console.log("订单请求响应状态:", response.status);
    const data = await response.json();
    console.log("订单请求响应数据:", data);
    if (data.code === 200) {
      let dat = data.data.orders;
      if (dat.length > 0) {
        return dat
      }
      return []; // 修复：返回空数组而不是null
    } else {
      console.error("订单请求失败，错误信息:", data.msg || '未知错误');
      return [];
    }
  }
  catch (e) {
    console.error("获取订单时发生错误:", e);
    throw e; // 重新抛出错误，让调用方知道请求失败
  }
};

// --- Address ---

let mockAddresses: Address[] = [
  { id: '1', receiverName: '陳大萌', phone: '13800138000', area: '中西區', detail: '皇后大道中100號', isDefault: false, label: 'HOME' },
  { id: '2', receiverName: '陳大萌', phone: '13800138000', area: '中w區', detail: '皇后大道中100號', isDefault: true, label: 'HOME' }
];


export const fetchAddresses = async (signal?: AbortSignal): Promise<Address[]> => {
  await delay(500);
  try {
    const userId = activeUser?.id || 'me';
    // 注意：后端期望 user_id 作为请求体？但你的 Python 代码写的是 request_data: str
    var request_data = {
      id: "",
      receiverName: "",
      phone: "",
      area: "",
      detail: "",
      label: "",
      isDefault: false,
      user_id: userId,
    };
    // 根据你提供的后端代码，get_useraddress 的 request_data 是字符串形式的 user_id
    const response = await fetch(url_base + "/addressview/get_useraddress", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request_data), // 直接传 user_id 字符串
      signal
    });
    const data = await response.json();
    if (data.code === 200) {
      return data.data.addressList || [];
    } else {
      throw new Error(data.msg || '获取地址失败');
    }
  } catch (e) {
    console.error("获取地址时发生错误:", e);
    throw e;
  }
};

export const saveAddress = async (addr: Address): Promise<Address> => {
  await delay(500);
  try {
    const userId = activeUser?.id || 'me';
    let request_data = {
      id: String(addr.id), // 创建时可不传 id
      receiverName: addr.receiverName,
      phone: addr.phone,
      area: addr.area,
      detail: addr.detail,
      label: addr.label,
      isDefault: addr.isDefault,
      user_id: userId,
    };
    let endpoint = '';
    if (!addr.id || addr.id.trim() === '') {
      // 创建新地址
      endpoint = '/addressview/create_useraddress';
    } else {
      // 更新现有地址
      endpoint = '/addressview/update_useraddress';
    }
    // 构造 URL：将 user_id 作为查询参数
    const url = `${url_base}${endpoint}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request_data)
    });
    const data = await response.json();
    if (data.code === 200) {
      // 后端返回的是完整的 Address 对象（在 data 字段中）
      const savedAddr: Address = data.data;
      return savedAddr;
    } else {
      throw new Error(data.msg || '保存地址失败');
    }
  } catch (e) {
    console.error('saveAddress error:', e);
    throw e;
  }
};

export const deleteAddress = async (id: string): Promise<void> => {
  await delay(300);
  try {
    const userId = activeUser?.id || 'me';
    if (!userId) throw new Error('未登录');
    let request_data = {
      id: String(id),
      receiverName: "",
      phone: "",
      area: "",
      detail: "",
      label: "",
      isDefault: false,
      user_id: userId,
    };
    const url = `${url_base}/addressview/delete_useraddress`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request_data) // 只需要传 id
    });
    const data = await response.json();
    if (data.code !== 200) {
      throw new Error(data.msg || '删除地址失败');
    }
    // 成功则无返回数据
  } catch (e) {
    console.error('deleteAddress error:', e);
    throw e;
  }
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


//MedicationView
export const getAllMedication = async (): Promise<Medication[]> => {
  await delay(500);
  try {
    const userId = activeUser?.id || 'me';
    if (!userId) throw new Error('未登录');
    let request_data = {
      id: "",
      name: "",
      date: "",
      time: "",
      dosage: "",
      isTaken: false,
      petName: "",
      user_id: userId,
    }
    const url = `${url_base}/membershipview/get_all_medication`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request_data)
    });
    const data = await response.json();
    if (data.code == 200) {
      return data.data.medications;
    } else {
      return [];
    }
  } catch (e) {
    console.error('deleteAddress error:', e);
    return [];
  }
}

export const getPetProfiles = async (): Promise<PetProfile[]> => {
  await delay(500);
  try {
    const userId = activeUser?.id || 'me';
    if (!userId) throw new Error('未登录');
    let request_data = {
      id: "",
      name: "",
      date: "",
      time: "",
      dosage: "",
      isTaken: false,
      petName: "",
      user_id: userId,
    }
    const url = `${url_base}/membershipview/get_pets`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request_data)
    });
    const data = await response.json();
    if (data.code == 200) {
      return data.data.pets;
    } else {
      return [];
    }
    // 成功则无返回数据
  } catch (e) {
    console.error('deleteAddress error:', e);
    return [];
    throw e;
  }
}

export const addMedication = async (newMedication: Medication): Promise<boolean> => {
  await delay(300);
  try {
    const userId = activeUser?.id || 'me';
    if (!userId) throw new Error('未登录');
    let request_data = {
      id: "",
      name: newMedication.name,
      date: newMedication.date,
      time: newMedication.time,
      dosage: newMedication.dosage,
      isTaken: newMedication.isTaken,
      petName: newMedication.petName,
      user_id: userId,
    };
    const url = `${url_base}/membershipview/add_medication`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request_data)
    });
    const data = await response.json();
    if (data.code == 200) {
      return true;
    } else {
      return false;
    }
    // 成功则无返回数据
  } catch (e) {
    console.error('deleteAddress error:', e);
    return false;
    throw e;
  }
};

export const updateMedicationTaken = async (id: string, isTaken: boolean): Promise<boolean> => {
  await delay(300);
  try {
    const userId = activeUser?.id || 'me';
    if (!userId) throw new Error('未登录');
    let request_data = {
      id: String(id),
      name: "",
      date: "",
      time: "",
      dosage: "",
      isTaken: isTaken,
      petName: "",
      user_id: userId,
    };
    const url = `${url_base}/membershipview/update_medication`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request_data) // 只需要传 id
    });
    const data = await response.json();
    if (data.code == 200) {
      return true;
    } else {
      return false;
    }
    // 成功则无返回数据
  } catch (e) {
    console.error('deleteAddress error:', e);
    throw e;
  }
};

export const deleteMedication = async (id: string): Promise<boolean> => {
  await delay(300);
  try {
    const userId = activeUser?.id || 'me';
    if (!userId) throw new Error('未登录');
    let request_data = {
      id: String(id),
      name: "",
      date: "",
      time: "",
      dosage: "",
      isTaken: false,
      petName: "",
      user_id: userId,
    }
    const url = `${url_base}/membershipview/delete_medication`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request_data) // 只需要传 id
    });
    const data = await response.json();
    if (data.code == 200) {
      return true;
    } else {
      return false;
    }
    // 成功则无返回数据
  } catch (e) {
    console.error('deleteAddress error:', e);
    return false;
  }
}

// 给用户开通vip或者提升vip
// backend.ts
export const open_vip = async (
  userId: string,
  planId: number, // 0, 1, 2
  paymentMethod: 'APPLE' | 'GOOGLE' | 'CARD'
): Promise<boolean> => {
  await delay(800);
  try {
    // 注意：planId 对应套餐索引，但后端需要的是 combo 字符串
    const planMap = ["SILVER", "GOLD", "PLATINUM"];
    const vipCombo = planMap[planId];

    const response = await fetch(url_base + "/membershipview/open_vip", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        pay_status: true, // 模拟支付成功（实际生产环境应由真实支付回调触发）
        vip_combo: vipCombo
      })
    });

    const data = await response.json();

    if (data.code === 200 && data.data) {
      // ✅ 构建 UserInfo 对象
      const userData = data.data; // 这就是完整的用户数据
      const newUserInfo: UserInfo = {
        id: userData.user_id,
        username: userData.username,
        name: userData.nickname || userData.username,
        avatar: userData.avatar_url || '',
        isVIP: (userData.vip_level == "NONE") ? false : true,
        vipLevel: userData.vip_level || '',
        vipExpiry: userData.vip_expiry || '', // 注意：后端字段是 vip_expiry
        phone: userData.phone || '',
        gender: userData.gender || '保密',
        googleBound: !!userData.google_id,
        appleBound: !!userData.apple_id,
        level: userData.level || 1,
      };
      // ✅ 保存到 Cookie（关键！）
      SaveDataToCookie('UserInfo', newUserInfo, 7);
      return true;
    } else {
      console.error("VIP 开通失败:", data.msg);
      return false;
    }
  } catch (error) {
    console.error("open_vip 请求异常:", error);
    return false;
  }
};

export const activateVIP = async (
  userId: string,
  orderId?: string // 可选，用于验证
): Promise<UserInfo> => {
  await delay(800);
  const response = await fetch(url_base + "/membershipview/activate_vip", {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, order_id: orderId })
  });
  const data = await response.json();
  if (data.code === 200) {
    const updatedUser: UserInfo = {
      ...activeUser!,
      isVIP: true,
      vipLevel: data.data.vip_level,
      vipExpiry: data.data.vip_expiry
    };
    activeUser = updatedUser;
    SaveDataToCookie('UserInfo', updatedUser, 7);
    return updatedUser;
  }
  throw new Error(data.msg || '激活VIP失败');
};

// --- Articles ---

let mockArticles: Article[] = [
  {
    id: 'art1',
    title: '貓咪飲水學問多：如何讓主子愛上喝水？',
    summary: '貓咪天生耐渴，但飲水不足可能導致泌尿系統問題。本文教你 5 個實用的小技巧，改善家中飲水環境。',
    content: '貓咪的祖先生活在沙漠環境中，這使得它們對乾渴的耐受度很高。然而，在現代家養環境下，主要食用乾糧的貓咪如果飲水量不足，非常容易誘發腎臟和泌尿系統疾病。\n\n1. 水源新鮮度：貓咪對流動的水更有興趣，這也是為什麼自動飲水機如此受歡迎的原因。\n\n2. 容器選擇：陶瓷或不銹鋼材質比塑料更好，不會殘留細菌異味，且寬大的容器能避免鬍鬚觸碰邊緣。',
    coverImage: 'https://picsum.photos/seed/catwater/800/600',
    author: 'PawPal 營養師',
    date: '2025-03-25',
    category: '健康守護',
    readTime: '4 min',
    likes: 245
  },
  {
    id: 'art2',
    title: '春季寵物驅蟲指南：全方位防護建議',
    summary: '氣溫回升，寄生蟲也開始活躍。不管是足不出戶的貓咪還是每天散步的狗狗，都需要科學的驅蟲計劃。',
    content: '春天是萬物復甦的季節，同時也是跳蚤、蜱蟲和心絲蟲的高發期。\n\n首先要明確的是，即使是室內貓，主人也可能通過衣物將外部蟲卵帶回家。因此，每個月定期的體外和體內驅蟲是必不可少的。',
    coverImage: 'https://picsum.photos/seed/petbug/800/600',
    author: '林醫生',
    date: '2025-03-22',
    category: '護理科普',
    readTime: '6 min',
    likes: 189
  },
  {
    id: 'art3',
    title: '解密狗狗的「語言」：它在想什麼？',
    summary: '搖尾巴並不總是代表開心。學會觀察尾巴高度、耳根位置，讀懂毛孩子的真實情緒。',
    content: '作為主人，我們常以為自己很了解寵物，但有時我們會誤讀它們的訊號。例如，高頻率的快速擺尾有時是焦慮或興奮的體現，而非單純的友善。',
    coverImage: 'https://picsum.photos/seed/doglang/800/600',
    author: '行為訓練師',
    date: '2025-03-20',
    category: '行為解析',
    readTime: '5 min',
    likes: 312
  }
];

export const fetchArticles = async (): Promise<Article[]> => {
  await delay(600);
  return [...mockArticles];
};

export const fetchArticleById = async (id: string): Promise<Article | null> => {
  await delay(400);
  return mockArticles.find(a => a.id === id) || null;
};
