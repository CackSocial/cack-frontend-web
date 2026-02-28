import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Avatar, Button } from '../../components/common';
import { PostCard } from '../../components/post';
import { useAuthStore } from '../../stores/authStore';
import { usePostsStore } from '../../stores/postsStore';
import { mockUsers, mockFollowing } from '../../data/mockData';
import { formatCount } from '../../utils/format';
import styles from './ProfilePage.module.css';

export function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const posts = usePostsStore((s) => s.posts);
  const [activeTab, setActiveTab] = useState<'posts' | 'likes'>('posts');
  const [following, setFollowing] = useState(() =>
    mockFollowing.has(
      mockUsers.find((u) => u.username === username)?.id ?? ''
    )
  );

  const profileUser = useMemo(() => {
    if (currentUser?.username === username) return currentUser;
    return mockUsers.find((u) => u.username === username);
  }, [username, currentUser]);

  if (!profileUser) {
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

  const userPosts = posts.filter(
    (p) => p.author.username === username
  );

  const likedPosts = posts.filter((p) => p.isLiked);

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
            <div className={styles.statValue}>
              {formatCount(profileUser.postsCount)}
            </div>
            <div className={styles.statLabel}>Posts</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statValue}>
              {formatCount(profileUser.followersCount)}
            </div>
            <div className={styles.statLabel}>Followers</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statValue}>
              {formatCount(profileUser.followingCount)}
            </div>
            <div className={styles.statLabel}>Following</div>
          </div>
        </div>

        <div className={styles.actions}>
          {isOwnProfile ? (
            <Button variant="secondary" size="sm">
              Edit Profile
            </Button>
          ) : (
            <Button
              variant={following ? 'secondary' : 'primary'}
              size="sm"
              onClick={() => setFollowing(!following)}
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
          displayPosts.map((post, i) => (
            <PostCard key={post.id} post={post} index={i} />
          ))
        ) : (
          <div className={styles.notFound}>
            {activeTab === 'posts' ? 'No posts yet' : 'No liked posts yet'}
          </div>
        )}
      </div>
    </div>
  );
}
