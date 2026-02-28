import { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { PostComposer, PostCard } from '../../components/post';
import { Skeleton } from '../../components/common';
import { usePostsStore } from '../../stores/postsStore';
import styles from './HomePage.module.css';

export function HomePage() {
  const posts = usePostsStore((s) => s.posts);
  const fetchTimeline = usePostsStore((s) => s.fetchTimeline);
  const isLoading = usePostsStore((s) => s.isLoading);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    fetchTimeline().finally(() => setInitialLoad(false));
  }, [fetchTimeline]);

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Home</h1>
      <PostComposer />

      <div className={styles.feed}>
        {(isLoading || initialLoad) ? (
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
          posts.map((post, i) => (
            <PostCard key={post.id} post={post} index={i} />
          ))
        )}
      </div>
    </div>
  );
}
