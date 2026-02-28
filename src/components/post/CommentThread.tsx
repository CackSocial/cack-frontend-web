import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Reply } from 'lucide-react';
import { Avatar, Button } from '../common';
import { timeAgo, formatCount } from '../../utils/format';
import type { Comment } from '../../types';
import styles from './CommentThread.module.css';

interface CommentThreadProps {
  comments: Comment[];
  depth?: number;
}

export function CommentThread({ comments, depth = 0 }: CommentThreadProps) {
  return (
    <div className={depth > 0 ? styles.thread : undefined}>
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} depth={depth} />
      ))}
    </div>
  );
}

function CommentItem({ comment, depth }: { comment: Comment; depth: number }) {
  const [isLiked, setIsLiked] = useState(comment.isLiked);
  const [likesCount, setLikesCount] = useState(comment.likesCount);
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount((c) => (isLiked ? c - 1 : c + 1));
  };

  const handleReply = () => {
    if (!replyText.trim()) return;
    setReplyText('');
    setShowReply(false);
  };

  return (
    <div className={styles.comment}>
      <div className={styles.commentInner}>
        <Link to={`/profile/${comment.author.username}`}>
          <Avatar
            src={comment.author.avatarUrl}
            alt={comment.author.displayName}
            size="sm"
          />
        </Link>
        <div className={styles.commentBody}>
          <div className={styles.commentHeader}>
            <Link
              to={`/profile/${comment.author.username}`}
              className={styles.commentAuthor}
            >
              {comment.author.displayName}
            </Link>
            <span className={styles.commentUsername}>
              @{comment.author.username}
            </span>
            <span className={styles.commentTime}>
              · {timeAgo(comment.createdAt)}
            </span>
          </div>

          <p className={styles.commentContent}>{comment.content}</p>

          <div className={styles.commentActions}>
            <button
              className={`${styles.commentAction} ${isLiked ? styles.liked : ''}`}
              onClick={handleLike}
            >
              <Heart size={14} fill={isLiked ? 'currentColor' : 'none'} />
              <span>{formatCount(likesCount)}</span>
            </button>
            {depth < 3 && (
              <button
                className={styles.commentAction}
                onClick={() => setShowReply(!showReply)}
              >
                <Reply size={14} />
                <span>Reply</span>
              </button>
            )}
          </div>

          {showReply && (
            <form
              className={styles.replyForm}
              onSubmit={(e) => {
                e.preventDefault();
                handleReply();
              }}
            >
              <input
                className={styles.replyInput}
                placeholder="Write a reply…"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                autoFocus
              />
              <Button size="sm" type="submit" disabled={!replyText.trim()}>
                Reply
              </Button>
            </form>
          )}

          {comment.replies.length > 0 && (
            <CommentThread comments={comment.replies} depth={depth + 1} />
          )}
        </div>
      </div>
    </div>
  );
}
