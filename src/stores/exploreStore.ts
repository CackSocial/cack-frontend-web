import { create } from 'zustand';
import type { Post, SuggestedUser } from '../types';
import * as exploreAPI from '../api/explore';
import * as followsAPI from '../api/follows';
import * as likesAPI from '../api/likes';
import * as bookmarksAPI from '../api/bookmarks';
import * as repostsAPI from '../api/reposts';
import { mapPost, mapSuggestedUser } from '../api/mappers';
import { useToastStore } from './toastStore';

const PAGE_LIMIT = 20;

interface ExploreState {
  // Suggested users
  suggestedUsers: SuggestedUser[];
  isLoadingSuggestions: boolean;
  followingSet: Set<string>;

  // Popular posts
  popularPosts: Post[];
  popularPage: number;
  popularHasMore: boolean;
  isLoadingPopular: boolean;
  isLoadingMorePopular: boolean;

  // Discover posts
  discoverPosts: Post[];
  discoverPage: number;
  discoverHasMore: boolean;
  isLoadingDiscover: boolean;
  isLoadingMoreDiscover: boolean;

  // Actions
  fetchSuggestedUsers: () => Promise<void>;
  fetchPopularPosts: (append?: boolean) => Promise<void>;
  fetchDiscoverFeed: (append?: boolean) => Promise<void>;
  followUser: (username: string) => Promise<void>;
  unfollowUser: (username: string) => Promise<void>;
  resetPopular: () => void;
  resetDiscover: () => void;

  // Post interactions (mirror from postsStore pattern for explore feeds)
  toggleLikeExplore: (postId: string, feed: 'popular' | 'discover') => Promise<void>;
  toggleBookmarkExplore: (postId: string, feed: 'popular' | 'discover') => Promise<void>;
  toggleRepostExplore: (postId: string, feed: 'popular' | 'discover') => Promise<void>;
}

export const useExploreStore = create<ExploreState>((set, get) => ({
  suggestedUsers: [],
  isLoadingSuggestions: false,
  followingSet: new Set(),

  popularPosts: [],
  popularPage: 1,
  popularHasMore: true,
  isLoadingPopular: false,
  isLoadingMorePopular: false,

  discoverPosts: [],
  discoverPage: 1,
  discoverHasMore: true,
  isLoadingDiscover: false,
  isLoadingMoreDiscover: false,

  fetchSuggestedUsers: async () => {
    set({ isLoadingSuggestions: true });
    try {
      const res = await exploreAPI.getSuggestedUsers(10);
      const users = (res.data ?? []).map(mapSuggestedUser);
      set({ suggestedUsers: users, isLoadingSuggestions: false });
    } catch {
      set({ isLoadingSuggestions: false });
    }
  },

  fetchPopularPosts: async (append = false) => {
    const { popularPage } = get();
    const page = append ? popularPage + 1 : 1;

    if (append) {
      set({ isLoadingMorePopular: true });
    } else {
      set({ isLoadingPopular: true });
    }

    try {
      const res = await exploreAPI.getPopularPosts(page, PAGE_LIMIT);
      const posts = res.data.map(mapPost);
      set((state) => ({
        popularPosts: append ? [...state.popularPosts, ...posts] : posts,
        popularPage: page,
        popularHasMore: posts.length >= PAGE_LIMIT,
        isLoadingPopular: false,
        isLoadingMorePopular: false,
      }));
    } catch {
      set({ isLoadingPopular: false, isLoadingMorePopular: false });
    }
  },

  fetchDiscoverFeed: async (append = false) => {
    const { discoverPage } = get();
    const page = append ? discoverPage + 1 : 1;

    if (append) {
      set({ isLoadingMoreDiscover: true });
    } else {
      set({ isLoadingDiscover: true });
    }

    try {
      const res = await exploreAPI.getDiscoverFeed(page, PAGE_LIMIT);
      const posts = res.data.map(mapPost);
      set((state) => ({
        discoverPosts: append ? [...state.discoverPosts, ...posts] : posts,
        discoverPage: page,
        discoverHasMore: posts.length >= PAGE_LIMIT,
        isLoadingDiscover: false,
        isLoadingMoreDiscover: false,
      }));
    } catch {
      set({ isLoadingDiscover: false, isLoadingMoreDiscover: false });
    }
  },

  followUser: async (username: string) => {
    set((state) => ({
      followingSet: new Set([...state.followingSet, username]),
    }));
    try {
      await followsAPI.follow(username);
    } catch {
      set((state) => {
        const next = new Set(state.followingSet);
        next.delete(username);
        return { followingSet: next };
      });
      useToastStore.getState().addToast('Failed to follow user', 'error');
    }
  },

  unfollowUser: async (username: string) => {
    set((state) => {
      const next = new Set(state.followingSet);
      next.delete(username);
      return { followingSet: next };
    });
    try {
      await followsAPI.unfollow(username);
    } catch {
      set((state) => ({
        followingSet: new Set([...state.followingSet, username]),
      }));
      useToastStore.getState().addToast('Failed to unfollow user', 'error');
    }
  },

  resetPopular: () =>
    set({ popularPosts: [], popularPage: 1, popularHasMore: true }),

  resetDiscover: () =>
    set({ discoverPosts: [], discoverPage: 1, discoverHasMore: true }),

  toggleLikeExplore: async (postId: string, feed: 'popular' | 'discover') => {
    const key = feed === 'popular' ? 'popularPosts' : 'discoverPosts';
    const posts = get()[key];
    const post = posts.find((p) => p.id === postId) ??
      posts.find((p) => p.originalPost?.id === postId)?.originalPost;
    if (!post) return;

    const wasLiked = post.isLiked;
    const oldCount = post.likesCount;

    const applyLike = (liked: boolean, count: number) => {
      set((state) => ({
        [key]: (state[key] as Post[]).map((p) => {
          if (p.id === postId) return { ...p, isLiked: liked, likesCount: count };
          if (p.originalPost?.id === postId) {
            return { ...p, originalPost: { ...p.originalPost, isLiked: liked, likesCount: count } };
          }
          return p;
        }),
      } as Partial<ExploreState>));
    };

    applyLike(!wasLiked, wasLiked ? oldCount - 1 : oldCount + 1);

    try {
      if (wasLiked) await likesAPI.unlikePost(postId);
      else await likesAPI.likePost(postId);
    } catch {
      applyLike(wasLiked, oldCount);
      useToastStore.getState().addToast('Failed to update like', 'error');
    }
  },

  toggleBookmarkExplore: async (postId: string, feed: 'popular' | 'discover') => {
    const key = feed === 'popular' ? 'popularPosts' : 'discoverPosts';
    const posts = get()[key];
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    set((state) => ({
      [key]: (state[key] as Post[]).map((p) =>
        p.id === postId ? { ...p, isBookmarked: !p.isBookmarked } : p,
      ),
    } as Partial<ExploreState>));

    try {
      if (post.isBookmarked) await bookmarksAPI.unbookmarkPost(postId);
      else await bookmarksAPI.bookmarkPost(postId);
    } catch {
      set((state) => ({
        [key]: (state[key] as Post[]).map((p) =>
          p.id === postId ? { ...p, isBookmarked: post.isBookmarked } : p,
        ),
      } as Partial<ExploreState>));
    }
  },

  toggleRepostExplore: async (postId: string, feed: 'popular' | 'discover') => {
    const key = feed === 'popular' ? 'popularPosts' : 'discoverPosts';
    const posts = get()[key];
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    set((state) => ({
      [key]: (state[key] as Post[]).map((p) =>
        p.id === postId
          ? { ...p, isReposted: !p.isReposted, repostCount: p.isReposted ? p.repostCount - 1 : p.repostCount + 1 }
          : p,
      ),
    } as Partial<ExploreState>));

    try {
      if (post.isReposted) await repostsAPI.unrepost(postId);
      else await repostsAPI.repost(postId);
    } catch {
      set((state) => ({
        [key]: (state[key] as Post[]).map((p) =>
          p.id === postId
            ? { ...p, isReposted: post.isReposted, repostCount: post.repostCount }
            : p,
        ),
      } as Partial<ExploreState>));
      useToastStore.getState().addToast('Failed to update repost', 'error');
    }
  },
}));
