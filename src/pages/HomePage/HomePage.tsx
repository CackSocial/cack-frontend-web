import { useEffect, useCallback, useState } from 'react';
import { FileText } from 'lucide-react';
import { PostComposer, PostCard } from '../../components/post';
import { Skeleton } from '../../components/common';
import { usePostsStore } from '../../stores/postsStore';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import type { Post } from '../../types';
import styles from './HomePage.module.css';

export function HomePage() {
  const posts = usePostsStore((s) => s.posts);
  const fetchTimeline = usePostsStore((s) => s.fetchTimeline);
  const isLoading = usePostsStore((s) => s.isLoading);
  const isLoadingMore = usePostsStore((s) => s.isLoadingMore);
  const hasMore = usePostsStore((s) => s.hasMore);
  const resetPagination = usePostsStore((s) => s.resetPagination);
  const [quotingPost, setQuotingPost] = useState<Post | null>(null);

  const loadMore = useCallback(async () => {
    const { currentPage } = usePostsStore.getState();
    await fetchTimeline(currentPage + 1, true);
    return usePostsStore.getState().hasMore;
  }, [fetchTimeline]);

  const { sentinelRef, reset } = useInfiniteScroll({
    loadMore,
    isLoading: isLoading || isLoadingMore,
    hasMore,
  });

  useEffect(() => {
    resetPagination();
    reset();
    fetchTimeline(1, false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Home</h1>
      <PostComposer quotePost={quotingPost} onClearQuote={() => setQuotingPost(null)} />

      <div className={styles.feed}>
        {isLoading && posts.length === 0 ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={styles.skeletonCard}>
              <Skeleton circle height={40} />
              <div className={styles.skeletonBody}>
                <Skeleton width="40%" height={14} />
                <Skeleton width="100%" height={14} />
                <Skeleton width="80%" height={14} />
              </div>
            </div>
          ))
        ) : posts.length === 0 ? (
          <div className={styles.emptyState}>
            <FileText size={48} className={styles.emptyIcon} />
            <h3 className={styles.emptyTitle}>No posts yet</h3>
            <p className={styles.emptyText}>
              Follow people to see their posts in your timeline, or create your first post above.
            </p>
          </div>
        ) : (
          <>
            {posts.map((post, i) => (
              <PostCard key={post.id} post={post} index={i} onQuote={(p) => {
                setQuotingPost(p);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }} />
            ))}
            {isLoadingMore && (
              <div className={styles.loadingMore}>Loading more…</div>
            )}
            {hasMore && <div ref={sentinelRef} className={styles.sentinel} />}
          </>
        )}
      </div>
    </div>
  );
}
