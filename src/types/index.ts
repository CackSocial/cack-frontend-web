export interface User {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  bannerUrl: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  createdAt: string;
}

export interface Post {
  id: string;
  author: User;
  content: string;
  imageUrl?: string;
  tags: string[];
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  createdAt: string;
}

export interface Comment {
  id: string;
  author: User;
  postId: string;
  parentId: string | null;
  content: string;
  likesCount: number;
  isLiked: boolean;
  replies: Comment[];
  createdAt: string;
}

export interface Tag {
  name: string;
  postsCount: number;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  participant: User;
  lastMessage: Message | null;
  unreadCount: number;
  updatedAt: string;
}

export type Theme = 'light' | 'dark';
