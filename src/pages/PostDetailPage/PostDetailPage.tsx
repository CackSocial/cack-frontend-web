import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Heart, MessageCircle, Share2, Bookmark, Trash2 } from 'lucide-react';
import { Avatar, Button, ConfirmDialog, ImageViewer, MentionAutocomplete } from '../../components/common';
import { CommentThread } from '../../components/post/CommentThread';
import { usePostsStore } from '../../stores/postsStore';
import { useAuthStore } from '../../stores/authStore';
import * as postsAPI from '../../api/posts';
import * as commentsAPI from '../../api/comments';
import { mapPost, mapComment } from '../../api/mappers';
import { formatFullDate, formatCount } from '../../utils/format';
import { renderTaggedContent } from '../../utils/renderTaggedContent';
import { sharePost } from '../../utils/share';
import type { Post, FlatComment } from '../../types';
import styles from './PostDetailPage.module.css';

export function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const toggleLike = usePostsStore((s) => s.toggleLike);
  const toggleBookmark = usePostsStore((s) => s.toggleBookmark);
  const deletePost = usePostsStore((s) => s.deletePost);
  const user = useAuthStore((s) => s.user);
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<FlatComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [commentCursorPos, setCommentCursorPos] = useState(0);
  const [commentMentionOpen, setCommentMentionOpen] = useState(true);
  const commentInputRef = useRef<HTMLInputElement>(null);

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

  const handleBookmark = async () => {
    if (!post) return;
    await toggleBookmark(post.id);
    const res = await postsAPI.getPost(post.id);
    setPost(mapPost(res.data!));
  };

  const handleShare = useCallback(async () => {
    if (!post) return;
    const ok = await sharePost(post.id);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [post]);

  const handleDelete = async () => {
    if (!post) return;
    await deletePost(post.id);
    setShowDeleteConfirm(false);
    navigate(-1);
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

  const updateCommentCursorPos = useCallback(() => {
    if (commentInputRef.current) {
      setCommentCursorPos(commentInputRef.current.selectionStart ?? 0);
    }
  }, []);

  const handleCommentMentionSelect = useCallback(
    (username: string) => {
      const before = commentText.slice(0, commentCursorPos);
      const atIndex = before.lastIndexOf('@');
      if (atIndex === -1) return;
      const after = commentText.slice(commentCursorPos);
      const newText = before.slice(0, atIndex) + '@' + username + ' ' + after;
      setCommentText(newText);
      setCommentMentionOpen(false);
      const newCursorPos = atIndex + username.length + 2;
      requestAnimationFrame(() => {
        if (commentInputRef.current) {
          commentInputRef.current.focus();
          commentInputRef.current.setSelectionRange(newCursorPos, newCursorPos);
          setCommentCursorPos(newCursorPos);
        }
      });
    },
    [commentText, commentCursorPos],
  );

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
          {renderTaggedContent(post.content, styles.tag, undefined, styles.mention)}
        </div>

        {post.imageUrl && (
          <img
            src={post.imageUrl}
            alt="Post attachment"
            className={styles.postImage}
            onClick={() => setViewerOpen(true)}
            style={{ cursor: 'zoom-in' }}
          />
        )}

        <div className={styles.postMeta}>
          {formatFullDate(post.createdAt)}
          {user?.id === post.author.id && (
            <button
              className={styles.deleteBtn}
              onClick={() => setShowDeleteConfirm(true)}
              aria-label="Delete post"
            >
              <Trash2 size={16} />
            </button>
          )}
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
            className={`${styles.stat} ${styles.statBtn} ${post.isBookmarked ? styles.statBookmarked : ''}`}
            onClick={handleBookmark}
          >
            <Bookmark
              size={18}
              fill={post.isBookmarked ? 'currentColor' : 'none'}
              className={styles.statIcon}
            />
            {post.isBookmarked ? 'Saved' : 'Save'}
          </button>
          <button
            className={`${styles.stat} ${styles.statBtn}`}
            onClick={handleShare}
          >
            <Share2
              size={18}
              className={styles.statIcon}
            />
            {copied ? 'Copied!' : 'Share'}
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        confirmLabel="Delete"
      />

      {post.imageUrl && (
        <ImageViewer
          src={post.imageUrl}
          alt="Post attachment"
          isOpen={viewerOpen}
          onClose={() => setViewerOpen(false)}
        />
      )}

      <div className={styles.commentsSection}>
        <h3 className={styles.commentsSectionTitle}>Comments</h3>

        <form
          className={styles.commentInput}
          onSubmit={handleCommentSubmit}
        >
          {user && (
            <Avatar src={user.avatarUrl} alt={user.displayName} size="sm" />
          )}
          <div className={styles.commentInputWrap}>
            <input
              ref={commentInputRef}
              className={styles.commentInputField}
              placeholder="Write a comment…"
              value={commentText}
              onChange={(e) => {
                setCommentText(e.target.value);
                setCommentCursorPos(e.target.selectionStart ?? 0);
                setCommentMentionOpen(true);
              }}
              onSelect={updateCommentCursorPos}
              onClick={updateCommentCursorPos}
              onKeyUp={updateCommentCursorPos}
            />
            {commentMentionOpen && (
              <MentionAutocomplete
                inputValue={commentText}
                cursorPosition={commentCursorPos}
                onSelect={handleCommentMentionSelect}
                onClose={() => setCommentMentionOpen(false)}
              />
            )}
          </div>
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

