import { create } from 'zustand';
import type { Post } from '../types';
import * as postsAPI from '../api/posts';
import * as likesAPI from '../api/likes';
import * as bookmarksAPI from '../api/bookmarks';
import * as repostsAPI from '../api/reposts';
import { mapPost } from '../api/mappers';
import { useToastStore } from './toastStore';

interface PostsState {
  posts: Post[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  currentPage: number;
  error: string | null;
  // Timeline / profile posts
  fetchTimeline: (page?: number, append?: boolean) => Promise<void>;
  fetchUserPosts: (username: string, page?: number) => Promise<Post[]>;
  // CRUD
  addPost: (content: string, image?: File | null) => Promise<Post | null>;
  deletePost: (postId: string) => Promise<void>;
  toggleLike: (postId: string) => Promise<void>;
  // Bookmarks
  toggleBookmark: (postId: string) => Promise<void>;
  fetchBookmarks: (page?: number) => Promise<Post[]>;
  // Reposts & Quotes
  toggleRepost: (postId: string) => Promise<void>;
  quotePost: (postId: string, content: string, image?: File | null) => Promise<Post | null>;
  // Pagination
  resetPagination: () => void;
  // Selectors (kept for compatibility)
  getPostById: (postId: string) => Post | undefined;
  getPostsByTag: (tag: string) => Post[];
  getPostsByUser: (userId: string) => Post[];
  getLikedPosts: (userId: string) => Post[];
}

export const usePostsStore = create<PostsState>((set, get) => ({
  posts: [],
  isLoading: false,
  isLoadingMore: false,
  hasMore: true,
  currentPage: 1,
  error: null,

  fetchTimeline: async (page = 1, append = false) => {
    const limit = 20;
    if (append) {
      set({ isLoadingMore: true });
    } else {
      set({ isLoading: true, error: null });
    }
    try {
      const res = await postsAPI.getTimeline(page, limit);
      const newPosts = res.data.map(mapPost);
      set((state) => ({
        posts: append ? [...state.posts, ...newPosts] : newPosts,
        isLoading: false,
        isLoadingMore: false,
        hasMore: newPosts.length >= limit,
        currentPage: page,
      }));
    } catch {
      set({ isLoading: false, isLoadingMore: false, error: 'Failed to load timeline' });
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
      useToastStore.getState().addToast('Post created', 'success');
      return post;
    } catch {
      useToastStore.getState().addToast('Failed to create post', 'error');
      return null;
    }
  },

  deletePost: async (postId: string) => {
    try {
      await postsAPI.deletePost(postId);
      set((state) => ({ posts: state.posts.filter((p) => p.id !== postId) }));
    } catch {
      useToastStore.getState().addToast('Failed to delete post', 'error');
    }
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
      useToastStore.getState().addToast('Failed to update like', 'error');
    }
  },

  toggleBookmark: async (postId: string) => {
    const post = get().posts.find((p) => p.id === postId);
    if (!post) return;
    // Optimistic update
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postId ? { ...p, isBookmarked: !p.isBookmarked } : p,
      ),
    }));
    try {
      if (post.isBookmarked) {
        await bookmarksAPI.unbookmarkPost(postId);
      } else {
        await bookmarksAPI.bookmarkPost(postId);
      }
    } catch {
      // Revert on error
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId ? { ...p, isBookmarked: post.isBookmarked } : p,
        ),
      }));
    }
  },

  fetchBookmarks: async (page = 1) => {
    try {
      const res = await bookmarksAPI.getBookmarks(page, 20);
      return res.data.map(mapPost);
    } catch {
      return [];
    }
  },

  toggleRepost: async (postId: string) => {
    const post = get().posts.find((p) => p.id === postId);
    if (!post) return;
    // Optimistic update
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postId
          ? { ...p, isReposted: !p.isReposted, repostCount: p.isReposted ? p.repostCount - 1 : p.repostCount + 1 }
          : p,
      ),
    }));
    try {
      if (post.isReposted) {
        await repostsAPI.unrepost(postId);
      } else {
        await repostsAPI.repost(postId);
      }
    } catch {
      // Revert on error
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId
            ? { ...p, isReposted: post.isReposted, repostCount: post.repostCount }
            : p,
        ),
      }));
      useToastStore.getState().addToast('Failed to update repost', 'error');
    }
  },

  quotePost: async (postId: string, content: string, image?: File | null) => {
    try {
      const res = await repostsAPI.quotePost(postId, content, image);
      const newPost = mapPost(res.data!);
      set((state) => ({ posts: [newPost, ...state.posts] }));
      useToastStore.getState().addToast('Quote posted', 'success');
      return newPost;
    } catch {
      useToastStore.getState().addToast('Failed to quote post', 'error');
      return null;
    }
  },

  resetPagination: () => set({ posts: [], hasMore: true, currentPage: 1, error: null }),

  getPostById:(postId: string) => get().posts.find((p) => p.id === postId),
  getPostsByTag: (tag: string) => get().posts.filter((p) => p.tags.includes(tag.toLowerCase())),
  getPostsByUser: (userId: string) => get().posts.filter((p) => p.author.id === userId),
  getLikedPosts: () => get().posts.filter((p) => p.isLiked),
}));

