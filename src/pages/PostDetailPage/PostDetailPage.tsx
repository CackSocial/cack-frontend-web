import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Heart, MessageCircle, Share2 } from 'lucide-react';
import { Avatar, Button } from '../../components/common';
import { CommentThread } from '../../components/post/CommentThread';
import { usePostsStore } from '../../stores/postsStore';
import { useAuthStore } from '../../stores/authStore';
import * as postsAPI from '../../api/posts';
import * as commentsAPI from '../../api/comments';
import { mapPost, mapComment } from '../../api/mappers';
import { formatFullDate, formatCount } from '../../utils/format';
import { renderTaggedContent } from '../../utils/renderTaggedContent';
import type { Post, FlatComment } from '../../types';
import styles from './PostDetailPage.module.css';

export function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const toggleLike = usePostsStore((s) => s.toggleLike);
  const user = useAuthStore((s) => s.user);
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<FlatComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!postId) return;
    postsAPI.getPost(postId)
      .then((res) => setPost(mapPost(res.data!)))
      .catch(() => setNotFound(true));

    commentsAPI.getComments(postId)
      .then((res) => setComments(res.data.map(mapComment)));
  }, [postId]);

  const handleLike = async () => {
    if (!post) return;
    await toggleLike(post.id);
    // Refresh post to get accurate counts
    const res = await postsAPI.getPost(post.id);
    setPost(mapPost(res.data!));
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !postId) return;
    setSubmitting(true);
    try {
      const res = await commentsAPI.createComment(postId, commentText.trim());
      const newComment = mapComment(res.data!);
      setComments((prev) => [...prev, newComment]);
      setCommentText('');
      setPost((p) => p ? { ...p, commentsCount: p.commentsCount + 1 } : p);
    } finally {
      setSubmitting(false);
    }
  };

  if (notFound || (!post && !notFound)) {
    return (
      <div className={styles.page}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={18} /> Back
        </button>
        {notFound && <div className={styles.notFound}>Post not found</div>}
      </div>
    );
  }

  if (!post) return null;

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
            onClick={handleLike}
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
          onSubmit={handleCommentSubmit}
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
          <Button size="sm" type="submit" disabled={!commentText.trim() || submitting}>
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

