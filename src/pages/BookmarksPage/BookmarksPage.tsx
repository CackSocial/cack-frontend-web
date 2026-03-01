import { useState, useEffect, useCallback, useRef } from 'react';
import { Bookmark as BookmarkIcon } from 'lucide-react';
import { PostCard } from '../../components/post/PostCard';
import { usePostsStore } from '../../stores/postsStore';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
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
            <PostCard key={post.id} post={post} index={i} />
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
