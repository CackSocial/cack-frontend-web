import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Flame, Compass, Hash, ChevronLeft, ChevronRight } from 'lucide-react';
import { Avatar, SuggestedUserCard, Skeleton } from '../../components/common';
import { PostCard } from '../../components/post';
import { useDebounce } from '../../hooks/useDebounce';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { useExploreStore } from '../../stores/exploreStore';
import * as tagsAPI from '../../api/tags';
import * as usersAPI from '../../api/users';
import { mapTag, mapUser, mapPost } from '../../api/mappers';
import { formatCount } from '../../utils/format';
import type { Tag, Post } from '../../types';
import type { User } from '../../types';
import styles from './ExplorePage.module.css';

type ExploreTab = 'popular' | 'discover' | 'tags';

const TAG_POSTS_LIMIT = 20;

export function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTag = searchParams.get('tag');
  const tabParam = (searchParams.get('tab') as ExploreTab) || 'popular';
  const activeTab: ExploreTab = activeTag ? 'tags' : tabParam;

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

  // Suggested users scroll
  const suggestedScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Explore store
  const {
    suggestedUsers,
    isLoadingSuggestions,
    followingSet,
    popularPosts,
    popularHasMore,
    isLoadingPopular,
    isLoadingMorePopular,
    discoverPosts,
    discoverHasMore,
    isLoadingDiscover,
    isLoadingMoreDiscover,
    fetchSuggestedUsers,
    fetchPopularPosts,
    fetchDiscoverFeed,
    followUser,
    unfollowUser,
    toggleLikeExplore,
    toggleBookmarkExplore,
    toggleRepostExplore,
  } = useExploreStore();

  // Fetch trending tags on mount
  useEffect(() => {
    tagsAPI.getTrendingTags().then((res) => {
      setTrendingTags((res.data ?? []).map(mapTag));
    }).catch(() => {});
  }, []);

  // Fetch suggested users on mount
  useEffect(() => {
    fetchSuggestedUsers();
  }, [fetchSuggestedUsers]);

  // Fetch popular posts on mount / tab switch
  useEffect(() => {
    if (activeTab === 'popular' && popularPosts.length === 0) {
      fetchPopularPosts();
    }
  }, [activeTab, popularPosts.length, fetchPopularPosts]);

  // Fetch discover posts on tab switch
  useEffect(() => {
    if (activeTab === 'discover' && discoverPosts.length === 0) {
      fetchDiscoverFeed();
    }
  }, [activeTab, discoverPosts.length, fetchDiscoverFeed]);

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

  // Infinite scroll for tag posts
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

  // Infinite scroll for popular posts
  const loadMorePopular = useCallback(async () => {
    await fetchPopularPosts(true);
    return useExploreStore.getState().popularHasMore;
  }, [fetchPopularPosts]);

  const { sentinelRef: popularSentinelRef, reset: resetPopularScroll } = useInfiniteScroll({
    loadMore: loadMorePopular,
    isLoading: isLoadingPopular || isLoadingMorePopular,
    hasMore: popularHasMore,
  });

  // Infinite scroll for discover posts
  const loadMoreDiscover = useCallback(async () => {
    await fetchDiscoverFeed(true);
    return useExploreStore.getState().discoverHasMore;
  }, [fetchDiscoverFeed]);

  const { sentinelRef: discoverSentinelRef, reset: resetDiscoverScroll } = useInfiniteScroll({
    loadMore: loadMoreDiscover,
    isLoading: isLoadingDiscover || isLoadingMoreDiscover,
    hasMore: discoverHasMore,
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
      if (res.data) {
        setSearchUser(mapUser(res.data));
        setSearchNotFound(false);
      } else {
        setSearchUser(null);
        setSearchNotFound(true);
      }
    } catch {
      setSearchUser(null);
      setSearchNotFound(true);
    }
  }, []);

  useEffect(() => {
    performSearch(debouncedQuery);
  }, [debouncedQuery, performSearch]);

  const hasSearchResults = searchUser !== null;

  // Tab switching
  const switchTab = useCallback((tab: ExploreTab) => {
    const params: Record<string, string> = {};
    if (tab !== 'popular') params.tab = tab;
    setSearchParams(params);
  }, [setSearchParams]);

  // Suggested users scroll handlers
  const updateScrollButtons = useCallback(() => {
    const el = suggestedScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }, []);

  useEffect(() => {
    updateScrollButtons();
    const el = suggestedScrollRef.current;
    if (el) {
      el.addEventListener('scroll', updateScrollButtons, { passive: true });
      return () => el.removeEventListener('scroll', updateScrollButtons);
    }
  }, [updateScrollButtons, suggestedUsers]);

  const scrollSuggested = useCallback((direction: 'left' | 'right') => {
    const el = suggestedScrollRef.current;
    if (!el) return;
    const amount = 200;
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  }, []);

  // Post interaction callbacks for explore feeds
  const handlePopularLike = useCallback((id: string) => toggleLikeExplore(id, 'popular'), [toggleLikeExplore]);
  const handlePopularBookmark = useCallback((id: string) => toggleBookmarkExplore(id, 'popular'), [toggleBookmarkExplore]);
  const handlePopularRepost = useCallback((id: string) => toggleRepostExplore(id, 'popular'), [toggleRepostExplore]);
  const handleDiscoverLike = useCallback((id: string) => toggleLikeExplore(id, 'discover'), [toggleLikeExplore]);
  const handleDiscoverBookmark = useCallback((id: string) => toggleBookmarkExplore(id, 'discover'), [toggleBookmarkExplore]);
  const handleDiscoverRepost = useCallback((id: string) => toggleRepostExplore(id, 'discover'), [toggleRepostExplore]);

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Explore</h1>

      {/* Search */}
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

      {/* Suggested Users */}
      {!activeTag && suggestedUsers.length > 0 && (
        <section className={styles.suggestedSection}>
          <h2 className={styles.sectionTitle}>Suggested for you</h2>
          <div className={styles.suggestedContainer}>
            {canScrollLeft && (
              <button
                className={`${styles.scrollBtn} ${styles.scrollBtnLeft}`}
                onClick={() => scrollSuggested('left')}
                aria-label="Scroll left"
              >
                <ChevronLeft size={18} />
              </button>
            )}
            <div className={styles.suggestedScroll} ref={suggestedScrollRef}>
              {isLoadingSuggestions
                ? Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className={styles.suggestedSkeleton}>
                      <Skeleton circle height={56} />
                      <Skeleton height={12} width="80%" />
                      <Skeleton height={10} width="60%" />
                    </div>
                  ))
                : suggestedUsers.map((user) => (
                    <SuggestedUserCard
                      key={user.id}
                      user={user}
                      isFollowing={followingSet.has(user.username)}
                      onFollow={followUser}
                      onUnfollow={unfollowUser}
                    />
                  ))}
            </div>
            {canScrollRight && (
              <button
                className={`${styles.scrollBtn} ${styles.scrollBtnRight}`}
                onClick={() => scrollSuggested('right')}
                aria-label="Scroll right"
              >
                <ChevronRight size={18} />
              </button>
            )}
          </div>
        </section>
      )}

      {/* Active tag filter */}
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
        <>
          {/* Tab Bar */}
          <div className={styles.tabBar}>
            <button
              className={`${styles.tab} ${activeTab === 'popular' ? styles.tabActive : ''}`}
              onClick={() => switchTab('popular')}
            >
              <Flame size={16} />
              Popular
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'discover' ? styles.tabActive : ''}`}
              onClick={() => switchTab('discover')}
            >
              <Compass size={16} />
              Discover
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'tags' ? styles.tabActive : ''}`}
              onClick={() => switchTab('tags')}
            >
              <Hash size={16} />
              Tags
            </button>
          </div>

          {/* Popular Tab */}
          {activeTab === 'popular' && (
            <div className={styles.feed}>
              {isLoadingPopular && popularPosts.length === 0 ? (
                <div className={styles.noResults}>Loading…</div>
              ) : popularPosts.length > 0 ? (
                <>
                  {popularPosts.map((post, i) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      index={i}
                      onLike={handlePopularLike}
                      onBookmark={handlePopularBookmark}
                      onRepost={handlePopularRepost}
                    />
                  ))}
                  {isLoadingMorePopular && (
                    <div className={styles.loadingMore}>Loading more…</div>
                  )}
                  {popularHasMore && <div ref={popularSentinelRef} className={styles.sentinel} />}
                </>
              ) : (
                <div className={styles.emptyState}>
                  <Flame size={40} className={styles.emptyIcon} />
                  <p className={styles.emptyTitle}>No popular posts yet</p>
                  <p className={styles.emptyDesc}>
                    Check back later for trending content from across the network.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Discover Tab */}
          {activeTab === 'discover' && (
            <div className={styles.feed}>
              {isLoadingDiscover && discoverPosts.length === 0 ? (
                <div className={styles.noResults}>Loading…</div>
              ) : discoverPosts.length > 0 ? (
                <>
                  {discoverPosts.map((post, i) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      index={i}
                      onLike={handleDiscoverLike}
                      onBookmark={handleDiscoverBookmark}
                      onRepost={handleDiscoverRepost}
                    />
                  ))}
                  {isLoadingMoreDiscover && (
                    <div className={styles.loadingMore}>Loading more…</div>
                  )}
                  {discoverHasMore && <div ref={discoverSentinelRef} className={styles.sentinel} />}
                </>
              ) : (
                <div className={styles.emptyState}>
                  <Compass size={40} className={styles.emptyIcon} />
                  <p className={styles.emptyTitle}>Nothing to discover yet</p>
                  <p className={styles.emptyDesc}>
                    Like some posts and we&apos;ll recommend content that matches your interests.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Tags Tab */}
          {activeTab === 'tags' && (
            <section className={styles.section}>
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
                {trendingTags.length === 0 && (
                  <div className={styles.emptyState}>
                    <Hash size={40} className={styles.emptyIcon} />
                    <p className={styles.emptyTitle}>No trending tags</p>
                    <p className={styles.emptyDesc}>
                      Tags will appear here when posts use hashtags.
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

