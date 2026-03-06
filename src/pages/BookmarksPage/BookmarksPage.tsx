import { useState, useEffect, useCallback, useRef } from 'react';
import { Bookmark as BookmarkIcon } from 'lucide-react';
import { PostCard } from '../../components/post/PostCard';
import { usePostsStore } from '../../stores/postsStore';
import { useToastStore } from '../../stores/toastStore';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import * as likesAPI from '../../api/likes';
import * as bookmarksAPI from '../../api/bookmarks';
import * as repostsAPI from '../../api/reposts';
import type { Post } from '../../types';
import styles from './BookmarksPage.module.css';

const BOOKMARKS_LIMIT = 20;

export function BookmarksPage() {
  const fetchBookmarks = usePostsStore((s) => s.fetchBookmarks);
  const [bookmarks, setBookmarks] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(1);

  const load = useCallback(async () => {
    setIsLoading(true);
    pageRef.current = 1;
    setHasMore(true);
    const posts = await fetchBookmarks(1);
    setBookmarks(posts);
    setHasMore(posts.length >= BOOKMARKS_LIMIT);
    setIsLoading(false);
  }, [fetchBookmarks]);

  useEffect(() => {
    load();
  }, [load]);

  const loadMore = useCallback(async () => {
    const nextPage = pageRef.current + 1;
    setIsLoadingMore(true);
    try {
      const newPosts = await fetchBookmarks(nextPage);
      setBookmarks((prev) => [...prev, ...newPosts]);
      const more = newPosts.length >= BOOKMARKS_LIMIT;
      setHasMore(more);
      pageRef.current = nextPage;
      return more;
    } catch {
      return false;
    } finally {
      setIsLoadingMore(false);
    }
  }, [fetchBookmarks]);

  const { sentinelRef } = useInfiniteScroll({
    loadMore,
    isLoading: isLoading || isLoadingMore,
    hasMore,
  });

  const updatePost = useCallback(
    (postId: string, updater: (p: Post) => Post) =>
      setBookmarks((prev) =>
        prev.map((p) => {
          if (p.id === postId) return updater(p);
          if (p.originalPost?.id === postId) {
            return { ...p, originalPost: updater(p.originalPost) };
          }
          return p;
        }),
      ),
    [],
  );

  const findPost = useCallback(
    (postId: string): Post | undefined => {
      const direct = bookmarks.find((p) => p.id === postId);
      if (direct) return direct;
      return bookmarks.find((p) => p.originalPost?.id === postId)?.originalPost ?? undefined;
    },
    [bookmarks],
  );

  const handleLike = useCallback(
    async (postId: string) => {
      const post = findPost(postId);
      if (!post) return;
      const wasLiked = post.isLiked;
      const oldCount = post.likesCount;
      updatePost(postId, (p) => ({
        ...p,
        isLiked: !wasLiked,
        likesCount: wasLiked ? oldCount - 1 : oldCount + 1,
      }));
      try {
        if (wasLiked) await likesAPI.unlikePost(postId);
        else await likesAPI.likePost(postId);
      } catch {
        updatePost(postId, (p) => ({ ...p, isLiked: wasLiked, likesCount: oldCount }));
        useToastStore.getState().addToast('Failed to update like', 'error');
      }
    },
    [findPost, updatePost],
  );

  const handleBookmark = useCallback(
    async (postId: string) => {
      const post = findPost(postId);
      if (!post) return;
      const wasBookmarked = post.isBookmarked;
      updatePost(postId, (p) => ({ ...p, isBookmarked: !wasBookmarked }));
      try {
        if (wasBookmarked) await bookmarksAPI.unbookmarkPost(postId);
        else await bookmarksAPI.bookmarkPost(postId);
      } catch {
        updatePost(postId, (p) => ({ ...p, isBookmarked: wasBookmarked }));
        useToastStore.getState().addToast('Failed to update bookmark', 'error');
      }
    },
    [findPost, updatePost],
  );

  const handleRepost = useCallback(
    async (postId: string) => {
      const post = findPost(postId);
      if (!post) return;
      const wasReposted = post.isReposted;
      const oldCount = post.repostCount;
      updatePost(postId, (p) => ({
        ...p,
        isReposted: !wasReposted,
        repostCount: wasReposted ? oldCount - 1 : oldCount + 1,
      }));
      try {
        if (wasReposted) await repostsAPI.unrepost(postId);
        else await repostsAPI.repost(postId);
      } catch {
        updatePost(postId, (p) => ({ ...p, isReposted: wasReposted, repostCount: oldCount }));
        useToastStore.getState().addToast('Failed to update repost', 'error');
      }
    },
    [findPost, updatePost],
  );

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Bookmarks</h1>

      {isLoading && (
        <div className={styles.loading}>Loading bookmarks…</div>
      )}

      {!isLoading && bookmarks.length === 0 && (
        <div className={styles.empty}>
          <BookmarkIcon size={48} className={styles.emptyIcon} />
          <p className={styles.emptyText}>No bookmarks yet</p>
          <p className={styles.emptySubtext}>
            Posts you bookmark will appear here for easy access.
          </p>
        </div>
      )}

      {!isLoading && bookmarks.length > 0 && (
        <div className={styles.list}>
          {bookmarks.map((post, i) => (
            <PostCard
              key={post.id}
              post={post}
              index={i}
              onLike={handleLike}
              onBookmark={handleBookmark}
              onRepost={handleRepost}
            />
          ))}
          {isLoadingMore && (
            <div className={styles.loadingMore}>Loading more…</div>
          )}
          {hasMore && <div ref={sentinelRef} className={styles.sentinel} />}
        </div>
      )}
    </div>
  );
}
