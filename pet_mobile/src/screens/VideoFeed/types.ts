/** 單條短視頻數據（可後續對接真實 API） */
export interface VideoFeedItem {
  id: string;
  coverUrl: string;
  videoUrl?: string;
  avatarUrl: string;
  username: string;
  description: string;
  likes: number;
  comments: number;
  isLiked?: boolean;
  isCollected?: boolean;
}
