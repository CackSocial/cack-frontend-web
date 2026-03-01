import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Avatar } from '../../components/common';
import { PostCard } from '../../components/post';
import { useDebounce } from '../../hooks/useDebounce';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import * as tagsAPI from '../../api/tags';
import * as usersAPI from '../../api/users';
import { mapTag, mapUser, mapPost } from '../../api/mappers';
import { formatCount } from '../../utils/format';
import type { Tag, Post } from '../../types';
import type { User } from '../../types';
import styles from './ExplorePage.module.css';

const TAG_POSTS_LIMIT = 20;

export function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTag = searchParams.get('tag');
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 350);

  const [trendingTags, setTrendingTags] = useState<Tag[]>([]);
  const [tagPosts, setTagPosts] = useState<Post[]>([]);
  const [searchUser, setSearchUser] = useState<User | null>(null);
  const [searchNotFound, setSearchNotFound] = useState(false);

  const [tagLoading, setTagLoading] = useState(false);
  const [tagLoadingMore, setTagLoadingMore] = useState(false);
  const [tagHasMore, setTagHasMore] = useState(true);
  const tagPageRef = useRef(1);

  // Fetch trending tags on mount
  useEffect(() => {
    tagsAPI.getTrendingTags().then((res) => {
      setTrendingTags((res.data ?? []).map(mapTag));
    }).catch(() => {});
  }, []);

  // Fetch posts for active tag (page 1)
  useEffect(() => {
    if (!activeTag) {
      setTagPosts([]);
      setTagHasMore(true);
      tagPageRef.current = 1;
      return;
    }
    setTagLoading(true);
    tagPageRef.current = 1;
    setTagHasMore(true);
    tagsAPI.getPostsByTag(activeTag, 1, TAG_POSTS_LIMIT).then((res) => {
      const posts = res.data.map(mapPost);
      setTagPosts(posts);
      setTagHasMore(posts.length >= TAG_POSTS_LIMIT);
    }).catch(() => { setTagPosts([]); setTagHasMore(false); })
      .finally(() => setTagLoading(false));
  }, [activeTag]);

  const loadMoreTagPosts = useCallback(async () => {
    if (!activeTag) return false;
    const nextPage = tagPageRef.current + 1;
    setTagLoadingMore(true);
    try {
      const res = await tagsAPI.getPostsByTag(activeTag, nextPage, TAG_POSTS_LIMIT);
      const newPosts = res.data.map(mapPost);
      setTagPosts((prev) => [...prev, ...newPosts]);
      const hasMore = newPosts.length >= TAG_POSTS_LIMIT;
      setTagHasMore(hasMore);
      tagPageRef.current = nextPage;
      return hasMore;
    } catch {
      return false;
    } finally {
      setTagLoadingMore(false);
    }
  }, [activeTag]);

  const { sentinelRef: tagSentinelRef, reset: resetTagScroll } = useInfiniteScroll({
    loadMore: loadMoreTagPosts,
    isLoading: tagLoading || tagLoadingMore,
    hasMore: tagHasMore,
  });

  // Reset scroll position when tag changes
  useEffect(() => {
    resetTagScroll();
  }, [activeTag, resetTagScroll]);

  // Search: exact username lookup
  const performSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setSearchUser(null); setSearchNotFound(false); return; }
    try {
      const res = await usersAPI.lookupUser(q.trim());
      setSearchUser(mapUser(res.data!));
      setSearchNotFound(false);
    } catch {
      setSearchUser(null);
      setSearchNotFound(true);
    }
  }, []);

  useEffect(() => {
    performSearch(debouncedQuery);
  }, [debouncedQuery, performSearch]);

  const hasSearchResults = searchUser !== null;

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Explore</h1>

      <div className={styles.searchWrap}>
        <Search size={18} className={styles.searchIcon} />
        <input
          className={styles.searchInput}
          placeholder="Search by exact username…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {debouncedQuery.trim() && (
          <div className={styles.dropdown}>
            {hasSearchResults ? (
              <Link
                to={`/profile/${searchUser!.username}`}
                className={styles.dropdownItem}
                onClick={() => setQuery('')}
              >
                <Avatar
                  src={searchUser!.avatarUrl}
                  alt={searchUser!.displayName}
                  size="sm"
                />
                <div>
                  <div>{searchUser!.displayName}</div>
                  <div className={styles.dropdownLabel}>
                    @{searchUser!.username}
                  </div>
                </div>
              </Link>
            ) : searchNotFound ? (
              <div className={styles.dropdownItem}>No user found</div>
            ) : null}
          </div>
        )}
      </div>

      {activeTag ? (
        <>
          <div className={styles.activeTag}>
            <span className={styles.activeTagName}>#{activeTag}</span>
            <button
              className={styles.clearTag}
              onClick={() => setSearchParams({})}
            >
              Clear
            </button>
          </div>
          {tagLoading ? (
            <div className={styles.noResults}>Loading…</div>
          ) : tagPosts.length > 0 ? (
            <>
              {tagPosts.map((post, i) => (
                <PostCard key={post.id} post={post} index={i} />
              ))}
              {tagLoadingMore && (
                <div className={styles.loadingMore}>Loading more…</div>
              )}
              {tagHasMore && <div ref={tagSentinelRef} className={styles.sentinel} />}
            </>
          ) : (
            <div className={styles.noResults}>
              No posts found with #{activeTag}
            </div>
          )}
        </>
      ) : (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Trending Tags</h2>
          <div className={styles.tagsGrid}>
            {trendingTags.map((tag) => (
              <Link
                key={tag.name}
                to={`/explore?tag=${tag.name}`}
                className={styles.tagChip}
              >
                #{tag.name}
                <span className={styles.tagChipCount}>
                  {formatCount(tag.postsCount)}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

