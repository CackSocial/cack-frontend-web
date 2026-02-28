import { create } from 'zustand';
import type { Post } from '../types';
import * as postsAPI from '../api/posts';
import * as likesAPI from '../api/likes';
import { mapPost } from '../api/mappers';

interface PostsState {
  posts: Post[];
  isLoading: boolean;
  error: string | null;
  // Timeline / profile posts
  fetchTimeline: (page?: number) => Promise<void>;
  fetchUserPosts: (username: string, page?: number) => Promise<Post[]>;
  // CRUD
  addPost: (content: string, image?: File | null) => Promise<Post | null>;
  deletePost: (postId: string) => Promise<void>;
  toggleLike: (postId: string) => Promise<void>;
  // Selectors (kept for compatibility)
  getPostById: (postId: string) => Post | undefined;
  getPostsByTag: (tag: string) => Post[];
  getPostsByUser: (userId: string) => Post[];
  getLikedPosts: (userId: string) => Post[];
}

export const usePostsStore = create<PostsState>((set, get) => ({
  posts: [],
  isLoading: false,
  error: null,

  fetchTimeline: async (page = 1) => {
    set({ isLoading: true, error: null });
    try {
      const res = await postsAPI.getTimeline(page, 20);
      const posts = res.data.map(mapPost);
      set({ posts, isLoading: false });
    } catch {
      set({ isLoading: false, error: 'Failed to load timeline' });
    }
  },

  fetchUserPosts: async (username: string, page = 1) => {
    try {
      const res = await postsAPI.getUserPosts(username, page, 20);
      return res.data.map(mapPost);
    } catch {
      return [];
    }
  },

  addPost: async (content: string, image?: File | null) => {
    try {
      const res = await postsAPI.createPost(content, image);
      const post = mapPost(res.data!);
      set((state) => ({ posts: [post, ...state.posts] }));
      return post;
    } catch {
      return null;
    }
  },

  deletePost: async (postId: string) => {
    await postsAPI.deletePost(postId);
    set((state) => ({ posts: state.posts.filter((p) => p.id !== postId) }));
  },

  toggleLike: async (postId: string) => {
    const post = get().posts.find((p) => p.id === postId);
    if (!post) return;
    // Optimistic update
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postId
          ? { ...p, isLiked: !p.isLiked, likesCount: p.isLiked ? p.likesCount - 1 : p.likesCount + 1 }
          : p,
      ),
    }));
    try {
      if (post.isLiked) {
        await likesAPI.unlikePost(postId);
      } else {
        await likesAPI.likePost(postId);
      }
    } catch {
      // Revert on error
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId
            ? { ...p, isLiked: post.isLiked, likesCount: post.likesCount }
            : p,
        ),
      }));
    }
  },

  getPostById: (postId: string) => get().posts.find((p) => p.id === postId),
  getPostsByTag: (tag: string) => get().posts.filter((p) => p.tags.includes(tag.toLowerCase())),
  getPostsByUser: (userId: string) => get().posts.filter((p) => p.author.id === userId),
  getLikedPosts: () => get().posts.filter((p) => p.isLiked),
}));

