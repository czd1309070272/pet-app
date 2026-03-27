/**
 * 社群模块 API - 与后端 api_CommunityView / api_CommunityHistoryView 对应
 * 支持 Mock 与真实请求切换，请求/响应与后端 schemas 对齐
 */
import type { Post, Comment, CommunityHistoryItem, CommentTreeApiResponse } from '../types';
import { API_BASE_URL } from './config';
import { getToken } from './requestHelper';

/** 是否使用 Mock 数据（true=Mock，false=真实后端请求） */
const USE_MOCK = false;

// ---------- 请求/响应类型（与后端 schemas 对齐） ----------

/** 获取帖子列表 - 分页（数量+偏移） */
export interface CommunityListParams {
  token: string;
  num: number;
  offset?: number;
  exclude_post_ids?: number[];
}

/** 获取帖子列表 - 按时间节点分页 */
export interface CommunityListByTimeParams {
  token: string;
  limit: number;
  timenode?: string | null;
  exclude_post_ids?: number[];
  datatype: 'newer' | 'older';
}

/** 帖子详情请求 */
export interface CommunityPostDetailParams {
  token: string;
  post_id: number;
  top_limit: number;
  replies_limit: number;
}

/** 发布新帖请求（图片与视频二选一） */
export interface CreatePostParams {
  token: string;
  content: string;
  images?: string[];
  videos?: string[];
  tags?: string[];
}

/** 点赞帖子/评论请求（评论 id 可能为字符串） */
export interface LikeTargetParams {
  token: string;
  target_id: number | string;
  target_type: 'post' | 'comment';
}

/** 发表/回复评论请求（parent/reply id 可能为字符串，与 Comment.id 一致） */
export interface CommentPostParams {
  token: string;
  post_id: number;
  content: string;
  parent_id?: number | string | null;
  reply_to_id?: number | string | null;
  root_id?: string | null;
  /** 被回复者昵称，用于兜底保证 @ 正确显示 */
  reply_to_name?: string | null;
}

/** 评论分页请求 */
export interface CommunityCommentsParams {
  token: string;
  post_id: number;
  timenode: string;
  page_size: number;
  top_comment_id?: number | null;
}

/** 社群动态历史（浏览/点赞/评论）请求 */
export interface CommunityHistoryParams {
  token: string;
  limit: number;
  offset?: number;
}

// ---------- 统一响应（与后端 JsonTool 对齐） ----------
export interface CommunityApiResponse<T = unknown> {
  code: number;
  data: T | null;
  msg: string;
}

/** 后端 Comment 格式 */
interface BackendComment {
  id: number | string;
  author: string;
  avatar: string;
  content: string;
  time: string;
  likes: number;
  isLiked: boolean;
  isVIP?: boolean;
  vipLevel?: string;
  replyToName?: string;
  replies?: BackendComment[];
  replyToContent?: string;
  top_comment_id?: number | string;
}

/** 后端 newPost 格式（images 为有序媒体 URL 列表） */
interface BackendPost {
  id: number;
  author: string;
  avatar: string;
  time: string;
  content: string;
  fullContent: string;
  images: string[];
  likes: number;
  comments: number;
  isLiked: boolean;
  isV?: boolean;
  isVIP?: boolean;
  vipLevel?: string;
  userTags: string[];
  commentList: BackendComment[];
}

/** 将后端 Post 转为前端 Post（保留 order 供混合图/视频时正确排序） */
function mapBackendPostToPost(b: BackendPost): Post {
  const images = b.images ?? [];
  const videos: string[] = [];
  const imgs: string[] = [];
  for (const u of images) {
    if (/\.(mp4|mov|webm|avi|mkv|m4v|3gp|ogg|wmv|flv)(\?|$)/i.test((u ?? '').split('?')[0])) {
      videos.push(u);
    } else {
      imgs.push(u);
    }
  }
  return {
    id: b.id,
    author: b.author ?? '未知用户',
    avatar: b.avatar ?? '',
    time: b.time ?? '',
    content: b.content ?? '',
    fullContent: b.fullContent ?? b.content ?? '',
    images: imgs,
    videos: videos.length ? videos : undefined,
    orderedMedia: images.length ? images : undefined,
    likes: b.likes ?? 0,
    comments: b.comments ?? 0,
    isLiked: b.isLiked ?? false,
    isV: b.isV ?? false,
    isVIP: b.isVIP ?? false,
    vipLevel: b.vipLevel,
    userTags: b.userTags ?? [],
    commentList: (b.commentList ?? []).map(mapBackendCommentToComment),
  };
}

/** 将后端 Comment 转为前端 Comment */
function mapBackendCommentToComment(c: BackendComment): Comment {
  return {
    id: String(c.id),
    author: c.author ?? '未知用户',
    avatar: c.avatar ?? '',
    content: c.content ?? '',
    time: c.time ?? '',
    likes: c.likes ?? 0,
    isLiked: c.isLiked ?? false,
    isVIP: c.isVIP,
    vipLevel: c.vipLevel,
    replyToName: c.replyToName,
    replyToContent: c.replyToContent,
    replies: (c.replies ?? []).map(mapBackendCommentToComment),
    top_comment_id: c.top_comment_id != null ? String(c.top_comment_id) : undefined,
  };
}

/** 发起后端请求并解析 JsonTool 响应 */
async function request<T>(url: string, body: Record<string, unknown>): Promise<{ code: number; data: T | null; msg: string }> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as CommunityApiResponse<T>;
  return { code: json.code ?? 500, data: json.data ?? null, msg: json.msg ?? '请求失败' };
}

// ---------- Mock 数据 ----------
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function mockImages(n: number, seedBase: number): string[] {
  return Array.from({ length: n }, (_, i) => `https://picsum.photos/seed/c${seedBase}_${i}/400`);
}

const LONG_TEXT =
  '【長文測試】今天帶家裡的主子去公園曬太陽，天氣實在太好了！早上九點出門，一路上貓貓在貓包里各種好奇張望…#戶外 #貓咪 #日常 #萌寵';

const mockComment1: Comment = {
  id: 'c1',
  author: '寵友B',
  avatar: 'https://picsum.photos/seed/cu2/80',
  content: '好可愛！',
  time: '1 小時前',
  likes: 2,
  isLiked: false,
  isVIP: true,
  vipLevel: 'VIP',
  replyToName: undefined,
  replies: [
    {
      id: 'c1r1',
      author: '用戶A00000',
      avatar: 'https://picsum.photos/seed/cu1/80',
      content: '謝謝～',
      time: '30 分鐘前',
      likes: 0,
      isLiked: false,
      replyToName: '寵友B',
      top_comment_id: 'c1',
    },
  ],
  top_comment_id: undefined,
};

const mockComment2: Comment = {
  id: 'c2',
  author: '萌寵達人',
  avatar: 'https://picsum.photos/seed/cu3/80',
  content: '這是哪裡呀？風景不錯',
  time: '50 分鐘前',
  likes: 1,
  isLiked: false,
  vipLevel: 'SVIP',
  replyToName: undefined,
  replies: [],
  top_comment_id: undefined,
};

const LONG_COMMENT_MAIN =
  '這風景太美了！上週末我也帶我家主子去類似的公園，它全程在貓包里各種好奇張望，回來後睡了一整天哈哈。真希望每個城市都能多一些寵物友善的戶外空間，讓毛孩們也能享受陽光和新鮮空氣～';
const LONG_COMMENT_REPLY =
  '對啊！我們這邊的公園最近也開放了寵物區，週末人超多。建議可以錯峰出門，早上八九點或者傍晚四五點人比較少，主子更能放鬆探索，也不會太曬。';

const mockCommentsFor101: Comment[] = [
  {
    id: 'c101_1',
    author: '貓奴小林',
    avatar: 'https://picsum.photos/seed/101a/80',
    content: LONG_COMMENT_MAIN,
    time: '2 小時前',
    likes: 5,
    isLiked: false,
    isVIP: true,
    vipLevel: 'VIP',
    replyToName: undefined,
    replies: [
      {
        id: 'c101_1r1',
        author: '戶外達人',
        avatar: 'https://picsum.photos/seed/101j/80',
        content: LONG_COMMENT_REPLY,
        time: '1 小時前',
        likes: 2,
        isLiked: false,
        isVIP: true,
        vipLevel: 'VIP',
        replyToName: '貓奴小林',
        top_comment_id: 'c101_1',
        replies: [],
      },
    ],
    top_comment_id: undefined,
  },
  { id: 'c101_2', author: '狗狗愛好者', avatar: 'https://picsum.photos/seed/101b/80', content: '天氣好帶毛孩出門最開心', time: '1 小時前', likes: 3, isLiked: false, replyToName: undefined, replies: [], top_comment_id: undefined },
  { id: 'c101_3', author: '兔兔媽', avatar: 'https://picsum.photos/seed/101c/80', content: '萌翻啦！！！', time: '55 分鐘前', likes: 12, isLiked: true, vipLevel: 'SVIP', replyToName: undefined, replies: [], top_comment_id: undefined },
  { id: 'c101_4', author: '寵物攝影師', avatar: 'https://picsum.photos/seed/101d/80', content: '這光線拍得真好，請問用什麼設備？', time: '45 分鐘前', likes: 2, isLiked: false, replyToName: undefined, replies: [], top_comment_id: undefined },
  { id: 'c101_5', author: '橘貓飼主', avatar: 'https://picsum.photos/seed/101e/80', content: '同款貓包！我家主子也超愛看窗外', time: '40 分鐘前', likes: 8, isLiked: false, isVIP: true, vipLevel: 'VIP', replyToName: undefined, replies: [], top_comment_id: undefined },
  { id: 'c101_6', author: '柴犬爸爸', avatar: 'https://picsum.photos/seed/101f/80', content: '羨慕，我們這幾天都下雨', time: '35 分鐘前', likes: 1, isLiked: false, replyToName: undefined, replies: [], top_comment_id: undefined },
  { id: 'c101_7', author: '寵物美容師', avatar: 'https://picsum.photos/seed/101g/80', content: '毛色好亮！平常有特別保養嗎？', time: '25 分鐘前', likes: 4, isLiked: false, replyToName: undefined, replies: [], top_comment_id: undefined },
  { id: 'c101_8', author: '新晉鏟屎官', avatar: 'https://picsum.photos/seed/101h/80', content: '請問公園可以讓貓咪落地嗎？', time: '15 分鐘前', likes: 0, isLiked: false, replyToName: undefined, replies: [], top_comment_id: undefined },
  { id: 'c101_9', author: '萌寵Vlogger', avatar: 'https://picsum.photos/seed/101i/80', content: '這角度絕了，收藏了！', time: '10 分鐘前', likes: 6, isLiked: false, vipLevel: 'SVIP', replyToName: undefined, replies: [], top_comment_id: undefined },
  { id: 'c101_10', author: '戶外達人', avatar: 'https://picsum.photos/seed/101j/80', content: '春天最適合帶寵物戶外活動了', time: '剛剛', likes: 2, isLiked: false, isVIP: true, vipLevel: 'VIP', replyToName: undefined, replies: [], top_comment_id: undefined },
];

let mockPosts: Post[] = [
  {
    id: 101,
    author: '長文測試君',
    avatar: 'https://picsum.photos/seed/cu0/80',
    time: '剛剛',
    content: LONG_TEXT,
    fullContent: LONG_TEXT,
    images: mockImages(2, 0),
    likes: 99,
    comments: 11,
    isLiked: false,
    isVIP: true,
    vipLevel: 'VIP',
    userTags: ['#戶外', '#貓咪', '#日常', '#萌寵'],
    commentList: mockCommentsFor101,
  },
  {
    id: 102,
    author: '用戶A',
    avatar: 'https://picsum.photos/seed/cu1/80',
    time: '2 小時前',
    content: '1 張圖：今天天氣真好，帶狗狗出去跑跑～',
    fullContent: '1 張圖的完整內容。',
    images: mockImages(1, 1),
    likes: 12,
    comments: 2,
    isLiked: false,
    isVIP: true,
    vipLevel: 'VIP',
    userTags: ['#戶外'],
    commentList: [mockComment1, mockComment2],
  },
  {
    id: 103,
    author: '貓奴小美',
    avatar: 'https://picsum.photos/seed/cu4/80',
    time: '5 小時前',
    content: '2 張圖：新開的罐頭，主子秒光盤～',
    fullContent: '2 張圖的完整內容。',
    images: mockImages(2, 2),
    likes: 28,
    comments: 5,
    isLiked: true,
    userTags: ['#飲食', '#貓咪'],
    commentList: [],
  },
  {
    id: 104,
    author: '旺財爸',
    avatar: 'https://picsum.photos/seed/cu5/80',
    time: '昨天',
    content: '3 張圖：健康檢查一切正常，放心了。',
    fullContent: '3 張圖的完整內容。',
    images: mockImages(3, 3),
    likes: 8,
    comments: 1,
    isLiked: false,
    userTags: ['#健康'],
    commentList: [],
  },
  {
    id: 105,
    author: '萌寵Vlog',
    avatar: 'https://picsum.photos/seed/cu13/80',
    time: '3 小時前',
    content: '帶主子出門散步的短片～',
    fullContent: '帶主子出門散步的短片～',
    images: [],
    videos: ['https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'],
    likes: 24,
    comments: 3,
    isLiked: false,
    userTags: ['#日常', '#萌寵'],
    commentList: [],
  },
];

// 辅助函数：把后端的蛇形命名转为前端驼峰
const normalizeComment = (raw: any): Comment => ({
  id: String(raw.id),
  author: raw.author,
  content: raw.content,
  avatar: raw.avatar,
  likes: raw.likes,
  isLiked: raw.isLiked ?? raw.is_liked ?? false,
  time: raw.time,
  vipLevel: raw.vipLevel ?? raw.vip_level,
  isVIP: raw.isVIP ?? raw.is_vip,
  replyToName: raw.replyToName ?? raw.reply_to_name,
  top_comment_id: raw.top_comment_id ?? raw.topCommentId,
  replyToContent: raw.replyToContent ?? raw.reply_to_content,

  // 关键：递归转换 replies
  replies: Array.isArray(raw.replies) ? raw.replies.map(normalizeComment) : [],
});

const MOCK_USER_NAME = '當前用戶';
const MOCK_USER_AVATAR = 'https://picsum.photos/seed/me/80';

function countAllComments(list: Comment[]): number {
  return list.reduce((acc, c) => acc + 1 + countAllComments(c.replies ?? []), 0);
}

// ---------- API 方法（Mock 实现） ----------
/** 获取帖子的顶级评论总数 */
export async function getTopCommentCount(postId: number): Promise<number> {
  if (USE_MOCK) {
    await delay(200);
    // 模拟返回一个随机数或固定逻辑
    return Math.floor(Math.random() * 50) + 5;
  }

  const token = await getToken();
  if (!token) throw new Error('未登录，无法获取评论数');

  // 构造符合 CommunityCommentRequest 的参数
  const payload = {
    token,
    post_id: postId,
    timenode: 1,       // 默认第一页
    page_size: 20,     // 默认每页数量
    top_comment_id: null, // 明确指定为 null，表示请求顶级评论
  };

  const { code, data, msg } = await request<{ count: number }>(
    `${API_BASE_URL}/communityview/get_top_comment_count`,
    payload
  );

  if (code !== 200 || typeof data?.count !== 'number') {
    // 如果失败，可以选择抛出错误或返回 0，这里选择抛出以便上层捕获
    throw new Error(msg || '获取顶级评论总数失败');
  }

  return data.count;
}

/** 获取帖子的某个顶级评论的子评论总数 */
export async function getReplyCount(postId: number, rootCommentId: string): Promise<number> {
  if (USE_MOCK) {
    await delay(200);
    // 模拟返回一个随机数
    return Math.floor(Math.random() * 15);
  }

  const token = await getToken();
  if (!token) throw new Error('未登录，无法获取回复数');

  const topCommentIdNum = parseInt(rootCommentId, 10);
  if (isNaN(topCommentIdNum)) {
    throw new Error('无效的评论 ID');
  }

  // 构造符合 CommunityCommentRequest 的参数
  const payload = {
    token,
    post_id: postId,
    timenode: 1,       // 默认第一页
    page_size: 20,     // 默认每页数量
    top_comment_id: topCommentIdNum, // 传入具体的顶级评论 ID
  };

  const { code, data, msg } = await request<{ count: number }>(
    `${API_BASE_URL}/communityview/get_sub_comment_count`,
    payload
  );

  if (code !== 200 || typeof data?.count !== 'number') {
    throw new Error(msg || '获取子评论总数失败');
  }

  return data.count;
}

/** 获取社群帖子列表（分页：数量 + 偏移） */
export async function getCommunityPosts(params: CommunityListParams): Promise<Post[]> {
  if (USE_MOCK) {
    await delay(400);
    const { num = 20, offset = 0, exclude_post_ids = [] } = params;
    const filtered = mockPosts.filter((p) => !exclude_post_ids.includes(p.id));
    return filtered.slice(offset, offset + num);
  }
  const { token, num = 20, offset = 0, exclude_post_ids = [] } = params;
  const page = offset === 0 ? 1 : Math.floor(offset / num) + 1;
  const { code, data, msg } = await request<{ posts: BackendPost[] }>(
    `${API_BASE_URL}/communityview/get_community_posts`,
    { token, num, offset: page, exclude_post_ids }
  );
  if (code !== 200 || !data?.posts) throw new Error(msg || '获取帖子失败');
  return data.posts.map(mapBackendPostToPost);
}

/** 获取社群帖子列表（按时间节点分页） */
export async function getCommunityPostsByTime(params: CommunityListByTimeParams): Promise<Post[]> {
  if (USE_MOCK) {
    await delay(400);
    const { limit = 20, exclude_post_ids = [] } = params;
    const filtered = mockPosts.filter((p) => !exclude_post_ids.includes(p.id));
    return filtered.slice(0, limit);
  }
  const { token, limit = 20, timenode, exclude_post_ids = [], datatype } = params;
  const { code, data, msg } = await request<{ posts: BackendPost[] }>(
    `${API_BASE_URL}/communityview/get_community_posts_by_time`,
    { token, limit, timenode: timenode ?? null, exclude_post_ids, datatype }
  );
  if (code !== 200 || !data?.posts) throw new Error(msg || '获取帖子失败');
  return data.posts.map(mapBackendPostToPost);
}

/** 获取帖子详情（含评论树） */
export async function getPostDetail(params: CommunityPostDetailParams): Promise<Post | null> {
  if (USE_MOCK) {
    await delay(300);
    const post = mockPosts.find((p) => p.id === params.post_id);
    if (!post) return null;
    return { ...post, fullContent: post.fullContent ?? post.content };
  }
  const { token, post_id, top_limit, replies_limit } = params;
  const { code, data, msg } = await request<{ post: BackendPost }>(
    `${API_BASE_URL}/communityview/get_post_detail`,
    { token, post_id, top_limit, replies_limit }
  );
  if (code !== 200 || !data?.post) return null;
  return mapBackendPostToPost(data.post);
}

export const fetchCommentReplies = async (
  token: string,
  postId: number,
  parentId: string,       // 要加载哪条评论的子评论
  cursor: string | null   // 游标，第一次传 null
) => {
  try {
    const response = await fetch(`${API_BASE_URL}/communityview/get_comment_tree`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: token,
        post_id: postId,
        timenode: cursor,         // 对应后端的 timenode
        page_size: 10,            // 每次加载 10 条
        top_comment_id: parentId, // 对应后端的 top_comment_id 参数
      }),
    });
    const res: CommentTreeApiResponse = await response.json();
    if (res.code === 200 && res.data) {
      return {
        success: true,
        comments: res.data.comments.map(normalizeComment), // ✅ 关键：批量转换格式
        hasMore: res.data.has_more,
        nextCursor: res.data.next_cursor,
      };
    } else {
      console.error('API Error:', res.msg);
      return { success: false, comments: [], hasMore: false, nextCursor: null };
    }
  } catch (error) {
    console.error('Network Error:', error);
    return { success: false, comments: [], hasMore: false, nextCursor: null };
  }
};

/**
 * 统一上传媒体 (图片 + 视频)
 * @param params.uris 本地 URI 列表 ['file://...', 'file://...']
 * @param params.token 用户 Token
 */
export const uploadMedia = async ({ uris, token }: { uris: string[], token: string }): Promise<string[] | null> => {
  const formData = new FormData();
  formData.append('token', token);

  uris.forEach((uri, index) => {
    // 判断类型 (根据后缀名简单判断，或者如果你传的是对象可以直接用 type)
    const isVideo = /\.(mp4|mov|avi|webm|mkv)$/i.test(uri);
    const mimeType = isVideo ? 'video/mp4' : 'image/jpeg';
    const fileExt = isVideo ? '.mp4' : '.jpg';

    // React Native 的 FormData 添加文件需要这种格式
    formData.append('files', {
      uri,
      name: `upload_${index}${fileExt}`,
      type: mimeType,
    } as any); // as any 是为了绕过 TS 对 FormData 的类型检查
  });

  try {
    const response = await fetch(`${API_BASE_URL}/communityview/upload_media`, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    const result = await response.json();

    if (result.code === 200 && result.data?.urls) {
      return result.data.urls;
    } else {
      throw new Error(result.msg || "上传失败");
    }
  } catch (error) {
    console.error("Upload error:", error);
    return null;
  }
};

/** 发布新帖（图片+视频合计最多 9 个；后端仅支持 images，视频 URL 合并到 images） */
export async function createPost(params: CreatePostParams): Promise<Post | null> {
  if (USE_MOCK) {
    await delay(500);
    const { content, images = [], videos = [], tags = [] } = params;
    const mediaUrls = (images ?? []).length ? (images ?? []) : (videos ?? []).length ? [...(images ?? []), ...(videos ?? [])] : [];
    const imgs = mediaUrls.filter((u) => !/\.(mp4|mov|webm|avi|mkv|m4v|3gp|ogg|wmv|flv)(\?|$)/i.test((u ?? '').split('?')[0]));
    const vids = mediaUrls.filter((u) => /\.(mp4|mov|webm|avi|mkv|m4v|3gp|ogg|wmv|flv)(\?|$)/i.test((u ?? '').split('?')[0]));
    const post: Post = {
      id: mockPosts.length + 100 + Math.floor(Math.random() * 1000),
      author: MOCK_USER_NAME,
      avatar: MOCK_USER_AVATAR,
      time: '剛剛',
      content: content.length > 80 ? content.slice(0, 80) + '...' : content,
      fullContent: content,
      images: imgs,
      videos: vids.length ? vids : undefined,
      orderedMedia: mediaUrls.length ? mediaUrls : undefined,
      likes: 0,
      comments: 0,
      isLiked: false,
      userTags: tags,
      commentList: [],
    };
    mockPosts = [post, ...mockPosts];
    return post;
  }
  const { token, content, images = [], videos = [], tags = [] } = params;
  const allMedia = [...(images ?? []), ...(videos ?? [])];
  const { code, data, msg } = await request<{ post: BackendPost }>(
    `${API_BASE_URL}/communityview/add_new_community`,
    { token, content: content.trim(), images: allMedia, tags: tags ?? [] }
  );
  if (code !== 200 || !data?.post) return null;
  return mapBackendPostToPost(data.post);
}

/** 点赞帖子或评论（后端 target_type 需为 'POST' | 'COMMENT'） */
export async function likePost(params: LikeTargetParams): Promise<{ likes: number; isLiked: boolean }> {
  if (USE_MOCK) {
    await delay(150);
    if (params.target_type === 'post') {
      const post = mockPosts.find((p) => p.id === params.target_id);
      if (!post) return { likes: 0, isLiked: false };
      post.isLiked = !post.isLiked;
      post.likes += post.isLiked ? 1 : -1;
      return { likes: post.likes, isLiked: post.isLiked };
    }
    for (const post of mockPosts) {
      const find = (list: Comment[]): Comment | null => {
        for (const c of list) {
          if (String(c.id) === String(params.target_id)) return c;
          if (c.replies?.length) {
            const r = find(c.replies);
            if (r) return r;
          }
        }
        return null;
      };
      const c = find(post.commentList ?? []);
      if (c) {
        c.isLiked = !c.isLiked;
        c.likes = (c.likes ?? 0) + (c.isLiked ? 1 : -1);
        return { likes: c.likes, isLiked: c.isLiked };
      }
    }
    return { likes: 0, isLiked: false };
  }
  const targetType = params.target_type === 'post' ? 'POST' : 'COMMENT';
  const targetId = typeof params.target_id === 'string' ? parseInt(params.target_id, 10) : params.target_id;
  const { code, data, msg } = await request<{ like_count: number; is_liked: boolean }>(
    `${API_BASE_URL}/communityview/like_post`,
    { token: params.token, target_id: targetId, target_type: targetType }
  );
  if (code !== 200 || data == null) throw new Error(msg || '点赞失败');
  return { likes: data.like_count, isLiked: data.is_liked };
}

/** 发表评论（顶级或回复）。仅两级：主评论 + 子评论 */

export async function commentPost(params: CommentPostParams): Promise<Comment | null> {
  if (USE_MOCK) {
    await delay(300);
    const post = mockPosts.find((p) => p.id === params.post_id);
    if (!post) return null;
    const isReply = params.parent_id != null;
    const rootId = params.root_id ?? params.parent_id;
    const comment: Comment = {
      id: (isReply ? 'r_' : 'c_') + Date.now() + '_' + Math.random().toString(36).slice(2, 9),
      author: MOCK_USER_NAME,
      avatar: MOCK_USER_AVATAR,
      content: params.content,
      time: '剛剛',
      likes: 0,
      isLiked: false,
      replyToName: undefined,
      replies: [],
      top_comment_id: rootId != null ? String(rootId) : undefined,
    };
    post.commentList = post.commentList ?? [];
    if (isReply) {
      const parentId = params.parent_id!;
      let main = post.commentList.find((c) => String(c.id) === String(rootId));
      if (!main) {
        for (const m of post.commentList) {
          if (String(m.id) === String(parentId)) {
            main = m;
            break;
          }
          if ((m.replies ?? []).some((r) => String(r.id) === String(parentId))) {
            main = m;
            break;
          }
        }
      }
      const targetReplies = main ? (main.replies ?? (main.replies = [])) : null;
      if (targetReplies) {
        const parent =
          main && String(main.id) === String(parentId) ? main : targetReplies.find((r) => String(r.id) === String(parentId));
        comment.replyToName = parent?.author ?? params.reply_to_name ?? undefined;
        targetReplies.push(comment);
      } else {
        post.commentList.push(comment);
      }
    } else {
      post.commentList.push(comment);
    }
    post.comments = countAllComments(post.commentList);
    return comment;
  }
  const toInt = (v: number | string | null | undefined): number | undefined =>
    v == null ? undefined : typeof v === 'number' ? v : parseInt(String(v), 10);
  const { token, post_id, content, parent_id, reply_to_id, root_id } = params;
  const body: Record<string, unknown> = { token, post_id, content: content.trim() };
  if (parent_id != null) body.parent_id = toInt(parent_id) ?? parent_id;
  if (reply_to_id != null) body.reply_to_id = toInt(reply_to_id) ?? reply_to_id;
  if (root_id != null && String(root_id).trim()) body.root_id = String(root_id).trim();
  const { code, data, msg } = await request<BackendComment>(
    `${API_BASE_URL}/communityview/comment_post`,
    body
  );
  if (code !== 200 || !data) return null;
  return mapBackendCommentToComment(data);
}

/** 获取社群动态历史（合并点赞+评论记录；浏览记录后端暂未实现） */
export async function getCommunityHistory(params: CommunityHistoryParams): Promise<CommunityHistoryItem[]> {
  if (USE_MOCK) {
    await delay(300);
    const { limit = 20, offset = 0 } = params;
    const mockHistory: CommunityHistoryItem[] = [
      {
        id: 'h1',
        postId: 102,
        author: '用戶',
        authorAvatar: 'https://picsum.photos/seed/cu1/80',
        contentSnippet: '今天天氣真好，帶狗狗出去跑跑～',
        time: '2 小時前',
        type: 'WATCH',
        image: 'https://picsum.photos/seed/c1_0/400',
      },
      {
        id: 'h2',
        postId: 103,
        author: '貓奴小美',
        authorAvatar: 'https://picsum.photos/seed/cu4/80',
        contentSnippet: '新開的罐頭，主子秒光盤～',
        time: '5 小時前',
        type: 'LIKE',
        image: 'https://picsum.photos/seed/c2_0/400',
      },
    ];
    return mockHistory.slice(offset, offset + limit);
  }
  const { token, limit = 20, offset = 0 } = params;
  const page = offset;
  const [likeRes, commentRes] = await Promise.all([
    request<{ result: CommunityHistoryItem[] }>(
      `${API_BASE_URL}/communityhistoryview/get_like_record`,
      { token, limit, offset: page }
    ),
    request<{ result: CommunityHistoryItem[] }>(
      `${API_BASE_URL}/communityhistoryview/get_comment_record`,
      { token, limit, offset: page }
    ),
  ]);
  const likeList = likeRes.code === 200 && likeRes.data?.result ? likeRes.data.result : [];
  const commentList = commentRes.code === 200 && commentRes.data?.result ? commentRes.data.result : [];
  const merged: CommunityHistoryItem[] = [...likeList, ...commentList].sort((a, b) => {
    const ta = new Date(a.time).getTime();
    const tb = new Date(b.time).getTime();
    return tb - ta;
  });
  return merged.slice(0, limit);
}
