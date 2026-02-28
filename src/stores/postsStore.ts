import { create } from 'zustand';
import type { Post } from '../types';
import { mockPosts, currentMockUser } from '../data/mockData';

interface PostsState {
  posts: Post[];
  isLoading: boolean;
  addPost: (content: string, imageUrl?: string, tags?: string[]) => void;
  deletePost: (postId: string) => void;
  toggleLike: (postId: string) => void;
  getPostById: (postId: string) => Post | undefined;
  getPostsByTag: (tag: string) => Post[];
  getPostsByUser: (userId: string) => Post[];
  getLikedPosts: (userId: string) => Post[];
}

export const usePostsStore = create<PostsState>((set, get) => ({
  posts: [...mockPosts],
  isLoading: false,

  addPost: (content: string, imageUrl?: string, tags?: string[]) => {
    const extractedTags = tags ?? extractTags(content);
    const newPost: Post = {
      id: `p-${Date.now()}`,
      author: currentMockUser,
      content,
      imageUrl,
      tags: extractedTags,
      likesCount: 0,
      commentsCount: 0,
      isLiked: false,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ posts: [newPost, ...state.posts] }));
  },

  deletePost: (postId: string) =>
    set((state) => ({ posts: state.posts.filter((p) => p.id !== postId) })),

  toggleLike: (postId: string) =>
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postId
          ? {
              ...p,
              isLiked: !p.isLiked,
              likesCount: p.isLiked ? p.likesCount - 1 : p.likesCount + 1,
            }
          : p
      ),
    })),

  getPostById: (postId: string) => get().posts.find((p) => p.id === postId),

  getPostsByTag: (tag: string) =>
    get().posts.filter((p) => p.tags.includes(tag.toLowerCase())),

  getPostsByUser: (userId: string) =>
    get().posts.filter((p) => p.author.id === userId),

  getLikedPosts: (_userId: string) =>
    get().posts.filter((p) => p.isLiked),
}));

function extractTags(content: string): string[] {
  const matches = content.match(/#(\w+)/g);
  if (!matches) return [];
  return [...new Set(matches.map((t) => t.slice(1).toLowerCase()))];
}
