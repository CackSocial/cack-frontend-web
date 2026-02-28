import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Heart, MessageCircle, Share2 } from 'lucide-react';
import { Avatar, Button } from '../../components/common';
import { CommentThread } from '../../components/post/CommentThread';
import { usePostsStore } from '../../stores/postsStore';
import { useAuthStore } from '../../stores/authStore';
import { formatFullDate, formatCount } from '../../utils/format';
import { renderTaggedContent } from '../../utils/renderTaggedContent';
import { mockComments } from '../../data/mockData';
import styles from './PostDetailPage.module.css';

export function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const post = usePostsStore((s) => s.getPostById(postId ?? ''));
  const toggleLike = usePostsStore((s) => s.toggleLike);
  const user = useAuthStore((s) => s.user);
  const [commentText, setCommentText] = useState('');
  const comments = postId ? (mockComments[postId] ?? []) : [];

  if (!post) {
    return (
      <div className={styles.page}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={18} /> Back
        </button>
        <div className={styles.notFound}>Post not found</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <button className={styles.backBtn} onClick={() => navigate(-1)}>
        <ArrowLeft size={18} /> Back
      </button>

      <div className={styles.postSection}>
        <div className={styles.postHeader}>
          <Link to={`/profile/${post.author.username}`}>
            <Avatar
              src={post.author.avatarUrl}
              alt={post.author.displayName}
              size="lg"
            />
          </Link>
          <div className={styles.authorInfo}>
            <Link
              to={`/profile/${post.author.username}`}
              className={styles.authorName}
            >
              {post.author.displayName}
            </Link>
            <div className={styles.authorHandle}>
              @{post.author.username}
            </div>
          </div>
        </div>

        <div className={styles.postContent}>
          {renderTaggedContent(post.content, styles.tag)}
        </div>

        {post.imageUrl && (
          <img
            src={post.imageUrl}
            alt="Post attachment"
            className={styles.postImage}
          />
        )}

        <div className={styles.postMeta}>
          {formatFullDate(post.createdAt)}
        </div>

        <div className={styles.postActions}>
          <button
            className={`${styles.stat} ${styles.statBtn}`}
            onClick={() => toggleLike(post.id)}
          >
            <Heart
              size={18}
              fill={post.isLiked ? 'var(--color-like)' : 'none'}
              color={post.isLiked ? 'var(--color-like)' : 'currentColor'}
              className={styles.statIcon}
            />
            <span className={styles.statCount}>
              {formatCount(post.likesCount)}
            </span>{' '}
            likes
          </button>
          <span className={styles.stat}>
            <MessageCircle
              size={18}
              className={styles.statIcon}
            />
            <span className={styles.statCount}>
              {formatCount(post.commentsCount)}
            </span>{' '}
            comments
          </span>
          <button
            className={`${styles.stat} ${styles.statBtn}`}
          >
            <Share2
              size={18}
              className={styles.statIcon}
            />
            Share
          </button>
        </div>
      </div>

      <div className={styles.commentsSection}>
        <h3 className={styles.commentsSectionTitle}>Comments</h3>

        <form
          className={styles.commentInput}
          onSubmit={(e) => {
            e.preventDefault();
            setCommentText('');
          }}
        >
          {user && (
            <Avatar src={user.avatarUrl} alt={user.displayName} size="sm" />
          )}
          <input
            className={styles.commentInputField}
            placeholder="Write a comment…"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          />
          <Button size="sm" type="submit" disabled={!commentText.trim()}>
            Post
          </Button>
        </form>

        {comments.length > 0 ? (
          <CommentThread comments={comments} />
        ) : (
          <p className={styles.noComments}>
            No comments yet. Be the first to share your thoughts.
          </p>
        )}
      </div>
    </div>
  );
}
