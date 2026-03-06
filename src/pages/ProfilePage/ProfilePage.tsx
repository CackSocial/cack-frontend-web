import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import { Avatar, Button } from '../../components/common';
import { PostCard } from '../../components/post';
import { useAuthStore } from '../../stores/authStore';
import { useToastStore } from '../../stores/toastStore';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import * as usersAPI from '../../api/users';
import * as followsAPI from '../../api/follows';
import * as likesAPI from '../../api/likes';
import * as bookmarksAPI from '../../api/bookmarks';
import * as repostsAPI from '../../api/reposts';
import * as postsAPI from '../../api/posts';
import { mapUser, mapPost } from '../../api/mappers';
import { formatCount } from '../../utils/format';
import type { User, Post } from '../../types';
import styles from './ProfilePage.module.css';

const POSTS_LIMIT = 20;

export function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'likes'>('posts');
  const [following, setFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [postsHasMore, setPostsHasMore] = useState(true);
  const [isLoadingMorePosts, setIsLoadingMorePosts] = useState(false);
  const postsPageRef = useRef(1);

  const [likesHasMore, setLikesHasMore] = useState(true);
  const [isLoadingMoreLikes, setIsLoadingMoreLikes] = useState(false);
  const [likesLoaded, setLikesLoaded] = useState(false);
  const likesPageRef = useRef(1);

  useEffect(() => {
    if (!username) return;
    setIsLoading(true);
    setNotFound(false);
    setUserPosts([]);
    setLikedPosts([]);
    setLikesLoaded(false);
    postsPageRef.current = 1;
    likesPageRef.current = 1;
    setPostsHasMore(true);
    setLikesHasMore(true);

    Promise.all([
      usersAPI.getProfile(username),
      postsAPI.getUserPosts(username, 1, POSTS_LIMIT),
    ])
      .then(([profileRes, postsRes]) => {
        const user = mapUser(profileRes.data!);
        setProfileUser(user);
        setFollowing(user.isFollowing ?? false);
        const posts = postsRes.data.map(mapPost);
        setUserPosts(posts);
        setPostsHasMore(posts.length >= POSTS_LIMIT);
      })
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false));
  }, [username]);

  // Load liked posts when "Likes" tab is first activated
  useEffect(() => {
    if (activeTab !== 'likes' || likesLoaded || !username) return;
    setIsLoadingMoreLikes(true);
    likesAPI
      .getLikedPosts(username, 1, POSTS_LIMIT)
      .then((res) => {
        const posts = res.data.map(mapPost);
        setLikedPosts(posts);
        setLikesHasMore(posts.length >= POSTS_LIMIT);
        setLikesLoaded(true);
        likesPageRef.current = 1;
      })
      .catch(() => {})
      .finally(() => setIsLoadingMoreLikes(false));
  }, [activeTab, likesLoaded, username]);

  const loadMorePosts = useCallback(async () => {
    if (!username) return false;
    const nextPage = postsPageRef.current + 1;
    setIsLoadingMorePosts(true);
    try {
      const res = await postsAPI.getUserPosts(username, nextPage, POSTS_LIMIT);
      const newPosts = res.data.map(mapPost);
      setUserPosts((prev) => [...prev, ...newPosts]);
      const hasMore = newPosts.length >= POSTS_LIMIT;
      setPostsHasMore(hasMore);
      postsPageRef.current = nextPage;
      return hasMore;
    } catch {
      return false;
    } finally {
      setIsLoadingMorePosts(false);
    }
  }, [username]);

  const loadMoreLikes = useCallback(async () => {
    if (!username) return false;
    const nextPage = likesPageRef.current + 1;
    setIsLoadingMoreLikes(true);
    try {
      const res = await likesAPI.getLikedPosts(username, nextPage, POSTS_LIMIT);
      const newPosts = res.data.map(mapPost);
      setLikedPosts((prev) => [...prev, ...newPosts]);
      const hasMore = newPosts.length >= POSTS_LIMIT;
      setLikesHasMore(hasMore);
      likesPageRef.current = nextPage;
      return hasMore;
    } catch {
      return false;
    } finally {
      setIsLoadingMoreLikes(false);
    }
  }, [username]);

  const { sentinelRef: postsSentinelRef, reset: resetPostsScroll } = useInfiniteScroll({
    loadMore: loadMorePosts,
    isLoading: isLoading || isLoadingMorePosts,
    hasMore: postsHasMore,
  });

  const { sentinelRef: likesSentinelRef, reset: resetLikesScroll } = useInfiniteScroll({
    loadMore: loadMoreLikes,
    isLoading: isLoadingMoreLikes,
    hasMore: likesHasMore,
  });

  // Reset scroll when username changes
  useEffect(() => {
    resetPostsScroll();
    resetLikesScroll();
  }, [username, resetPostsScroll, resetLikesScroll]);

  const updateDisplayPost = useCallback(
    (postId: string, updater: (p: Post) => Post) => {
      const mapWithNesting = (p: Post): Post => {
        if (p.id === postId) return updater(p);
        if (p.originalPost?.id === postId) {
          return { ...p, originalPost: updater(p.originalPost) };
        }
        return p;
      };
      setUserPosts((prev) => prev.map(mapWithNesting));
      setLikedPosts((prev) => prev.map(mapWithNesting));
    },
    [],
  );

  const findDisplayPost = useCallback(
    (postId: string): Post | undefined => {
      const all = [...userPosts, ...likedPosts];
      const direct = all.find((p) => p.id === postId);
      if (direct) return direct;
      return all.find((p) => p.originalPost?.id === postId)?.originalPost ?? undefined;
    },
    [userPosts, likedPosts],
  );

  const handleLike = useCallback(
    async (postId: string) => {
      const post = findDisplayPost(postId);
      if (!post) return;
      const wasLiked = post.isLiked;
      const oldCount = post.likesCount;
      updateDisplayPost(postId, (p) => ({
        ...p,
        isLiked: !wasLiked,
        likesCount: wasLiked ? oldCount - 1 : oldCount + 1,
      }));
      try {
        if (wasLiked) await likesAPI.unlikePost(postId);
        else await likesAPI.likePost(postId);
      } catch {
        updateDisplayPost(postId, (p) => ({ ...p, isLiked: wasLiked, likesCount: oldCount }));
        useToastStore.getState().addToast('Failed to update like', 'error');
      }
    },
    [findDisplayPost, updateDisplayPost],
  );

  const handleBookmark = useCallback(
    async (postId: string) => {
      const post = findDisplayPost(postId);
      if (!post) return;
      const wasBookmarked = post.isBookmarked;
      updateDisplayPost(postId, (p) => ({ ...p, isBookmarked: !wasBookmarked }));
      try {
        if (wasBookmarked) await bookmarksAPI.unbookmarkPost(postId);
        else await bookmarksAPI.bookmarkPost(postId);
      } catch {
        updateDisplayPost(postId, (p) => ({ ...p, isBookmarked: wasBookmarked }));
        useToastStore.getState().addToast('Failed to update bookmark', 'error');
      }
    },
    [findDisplayPost, updateDisplayPost],
  );

  const handleRepost = useCallback(
    async (postId: string) => {
      const post = findDisplayPost(postId);
      if (!post) return;
      const wasReposted = post.isReposted;
      const oldCount = post.repostCount;
      updateDisplayPost(postId, (p) => ({
        ...p,
        isReposted: !wasReposted,
        repostCount: wasReposted ? oldCount - 1 : oldCount + 1,
      }));
      try {
        if (wasReposted) await repostsAPI.unrepost(postId);
        else await repostsAPI.repost(postId);
      } catch {
        updateDisplayPost(postId, (p) => ({ ...p, isReposted: wasReposted, repostCount: oldCount }));
        useToastStore.getState().addToast('Failed to update repost', 'error');
      }
    },
    [findDisplayPost, updateDisplayPost],
  );

  const handleFollowToggle = async () => {
    if (!username) return;
    try {
      if (following) {
        await followsAPI.unfollow(username);
        setFollowing(false);
        setProfileUser((u) => u ? { ...u, followersCount: u.followersCount - 1 } : u);
      } else {
        await followsAPI.follow(username);
        setFollowing(true);
        setProfileUser((u) => u ? { ...u, followersCount: u.followersCount + 1 } : u);
      }
    } catch {
      useToastStore.getState().addToast('Failed to update follow', 'error');
    }
  };

  if (isLoading) {
    return <div className={styles.page} />;
  }

  if (notFound || !profileUser) {
    return (
      <div className={styles.page}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={18} /> Back
        </button>
        <div className={styles.notFound}>User not found</div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.username === username;
  const displayPosts = activeTab === 'posts' ? userPosts : likedPosts;
  const isLoadingMore = activeTab === 'posts' ? isLoadingMorePosts : isLoadingMoreLikes;
  const hasMore = activeTab === 'posts' ? postsHasMore : likesHasMore;
  const sentinelRef = activeTab === 'posts' ? postsSentinelRef : likesSentinelRef;

  return (
    <div className={styles.page}>
      <button className={styles.backBtn} onClick={() => navigate(-1)}>
        <ArrowLeft size={18} /> Back
      </button>

      <div className={styles.profileHeader}>
        <div className={styles.avatarWrap}>
          <Avatar
            src={profileUser.avatarUrl}
            alt={profileUser.displayName}
            size="xl"
          />
        </div>
        <h1 className={styles.displayName}>{profileUser.displayName}</h1>
        <p className={styles.username}>@{profileUser.username}</p>
        {profileUser.bio && <p className={styles.bio}>{profileUser.bio}</p>}

        <div className={styles.stats}>
          <div className={styles.stat}>
            <div className={styles.statValue}>{formatCount(userPosts.length)}</div>
            <div className={styles.statLabel}>Posts</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statValue}>{formatCount(profileUser.followersCount)}</div>
            <div className={styles.statLabel}>Followers</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statValue}>{formatCount(profileUser.followingCount)}</div>
            <div className={styles.statLabel}>Following</div>
          </div>
        </div>

        <div className={styles.actions}>
          {isOwnProfile ? (
            <Button variant="secondary" size="sm" onClick={() => navigate('/settings')}>
              Edit Profile
            </Button>
          ) : (
            <>
              <Button
                variant={following ? 'secondary' : 'primary'}
                size="sm"
                onClick={handleFollowToggle}
              >
                {following ? 'Following' : 'Follow'}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate(`/messages/${username}`)}
              >
                <Mail size={16} />
              </Button>
            </>
          )}
        </div>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'posts' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          Posts
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'likes' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('likes')}
        >
          Likes
        </button>
      </div>

      <div>
        {displayPosts.length > 0 ? (
          <>
            {displayPosts.map((post, i) => (
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
            {hasMore && (
              <div ref={sentinelRef} className={styles.sentinel} />
            )}
          </>
        ) : (
          <div className={styles.notFound}>
            {activeTab === 'posts' ? 'No posts yet' : 'No liked posts yet'}
          </div>
        )}
      </div>
    </div>
  );
}


