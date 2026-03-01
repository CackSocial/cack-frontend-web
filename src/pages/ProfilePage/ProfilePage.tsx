import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Avatar, Button } from '../../components/common';
import { PostCard } from '../../components/post';
import { useAuthStore } from '../../stores/authStore';
import { usePostsStore } from '../../stores/postsStore';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import * as usersAPI from '../../api/users';
import * as followsAPI from '../../api/follows';
import { mapUser } from '../../api/mappers';
import { formatCount } from '../../utils/format';
import type { User, Post } from '../../types';
import styles from './ProfilePage.module.css';

const POSTS_LIMIT = 20;

export function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const fetchUserPosts = usePostsStore((s) => s.fetchUserPosts);

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [likedPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'likes'>('posts');
  const [following, setFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [postsHasMore, setPostsHasMore] = useState(true);
  const [isLoadingMorePosts, setIsLoadingMorePosts] = useState(false);
  const postsPageRef = useRef(1);

  useEffect(() => {
    if (!username) return;
    setIsLoading(true);
    setNotFound(false);
    setUserPosts([]);
    postsPageRef.current = 1;
    setPostsHasMore(true);

    Promise.all([
      usersAPI.getProfile(username),
      fetchUserPosts(username, 1),
    ])
      .then(([profileRes, posts]) => {
        const user = mapUser(profileRes.data!);
        setProfileUser(user);
        setFollowing(user.isFollowing ?? false);
        setUserPosts(posts);
        setPostsHasMore(posts.length >= POSTS_LIMIT);
      })
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false));
  }, [username, fetchUserPosts]);

  const loadMorePosts = useCallback(async () => {
    if (!username) return false;
    const nextPage = postsPageRef.current + 1;
    setIsLoadingMorePosts(true);
    try {
      const newPosts = await fetchUserPosts(username, nextPage);
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
  }, [username, fetchUserPosts]);

  const { sentinelRef, reset: resetScroll } = useInfiniteScroll({
    loadMore: loadMorePosts,
    isLoading: isLoading || isLoadingMorePosts,
    hasMore: postsHasMore,
  });

  // Reset scroll when username changes
  useEffect(() => {
    resetScroll();
  }, [username, resetScroll]);

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
      // ignore
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
            <Button
              variant={following ? 'secondary' : 'primary'}
              size="sm"
              onClick={handleFollowToggle}
            >
              {following ? 'Following' : 'Follow'}
            </Button>
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
              <PostCard key={post.id} post={post} index={i} />
            ))}
            {activeTab === 'posts' && isLoadingMorePosts && (
              <div className={styles.loadingMore}>Loading more…</div>
            )}
            {activeTab === 'posts' && postsHasMore && (
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

