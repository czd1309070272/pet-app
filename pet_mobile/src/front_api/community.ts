/**
 * 社群模块 API - 单独接口文件，先使用 Mock 数据
 * 与后端 api_CommunityView 对应，后续可改为真实请求
 */
import type { Post, Comment, CommunityHistoryItem } from '../types';

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

const MOCK_USER_NAME = '當前用戶';
const MOCK_USER_AVATAR = 'https://picsum.photos/seed/me/80';

function countAllComments(list: Comment[]): number {
  return list.reduce((acc, c) => acc + 1 + countAllComments(c.replies ?? []), 0);
}

// ---------- API 方法（Mock 实现） ----------

/** 获取社群帖子列表（分页：数量 + 偏移） */
export async function getCommunityPosts(params: CommunityListParams): Promise<Post[]> {
  await delay(400);
  const { num = 20, offset = 0, exclude_post_ids = [] } = params;
  const filtered = mockPosts.filter((p) => !exclude_post_ids.includes(p.id));
  return filtered.slice(offset, offset + num);
}

/** 获取社群帖子列表（按时间节点分页） */
export async function getCommunityPostsByTime(params: CommunityListByTimeParams): Promise<Post[]> {
  await delay(400);
  const { limit = 20, exclude_post_ids = [] } = params;
  const filtered = mockPosts.filter((p) => !exclude_post_ids.includes(p.id));
  return filtered.slice(0, limit);
}

/** 获取帖子详情（含评论树） */
export async function getPostDetail(params: CommunityPostDetailParams): Promise<Post | null> {
  await delay(300);
  const post = mockPosts.find((p) => p.id === params.post_id);
  if (!post) return null;
  return { ...post, fullContent: post.fullContent ?? post.content };
}

/** 获取帖子评论（分页） */
export async function getPostComments(_params: CommunityCommentsParams): Promise<Comment[]> {
  await delay(200);
  return [];
}

/** 发布新帖（图片+视频合计最多 9 个，可同时传 images 与 videos） */
export async function createPost(params: CreatePostParams): Promise<Post | null> {
  await delay(500);
  const { content, images = [], videos = [], tags = [] } = params;
  const post: Post = {
    id: mockPosts.length + 100 + Math.floor(Math.random() * 1000),
    author: MOCK_USER_NAME,
    avatar: MOCK_USER_AVATAR,
    time: '剛剛',
    content: content.length > 80 ? content.slice(0, 80) + '...' : content,
    fullContent: content,
    images: images ?? [],
    videos: videos?.length ? videos : undefined,
    likes: 0,
    comments: 0,
    isLiked: false,
    userTags: tags,
    commentList: [],
  };
  mockPosts = [post, ...mockPosts];
  return post;
}

/** 点赞帖子或评论 */
export async function likePost(params: LikeTargetParams): Promise<{ likes: number; isLiked: boolean }> {
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

/** 发表评论（顶级或回复）。仅两级：主评论 + 子评论（子评论的回复与子评论同级） */
export async function commentPost(params: CommentPostParams): Promise<Comment | null> {
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
    top_comment_id: rootId ?? undefined,
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

/** 获取社群动态历史（浏览/点赞/评论） */
export async function getCommunityHistory(params: CommunityHistoryParams): Promise<CommunityHistoryItem[]> {
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
