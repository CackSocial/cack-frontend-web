import type {
  BackendUserProfile,
  BackendPostResponse,
  BackendCommentResponse,
  BackendMessageResponse,
  BackendConversationListResponse,
  BackendTagResponse,
  BackendNotificationResponse,
  BackendSuggestedUserResponse,
} from './types';
import type { User, Post, Comment, Message, Conversation, Tag, Notification, SuggestedUser } from '../types';

/** Convert absolute image URLs (e.g. http://localhost:8080/uploads/x.jpg) to relative paths so they go through the Vite proxy. */
function toRelativeUrl(url?: string): string | undefined {
  if (!url) return url;
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

export function mapUser(u: BackendUserProfile): User {
  return {
    id: u.id,
    username: u.username,
    displayName: u.display_name,
    bio: u.bio,
    avatarUrl: toRelativeUrl(u.avatar_url),
    bannerUrl: '',
    followersCount: u.follower_count,
    followingCount: u.following_count,
    postsCount: 0,
    isFollowing: u.is_following,
    createdAt: '',
  };
}

export function mapPost(p: BackendPostResponse): Post {
  return {
    id: p.id,
    author: mapUser(p.author),
    content: p.content,
    imageUrl: toRelativeUrl(p.image_url),
    tags: p.tags ?? [],
    likesCount: p.like_count,
    commentsCount: p.comment_count,
    isLiked: p.is_liked,
    isBookmarked: p.is_bookmarked,
    postType: (p.post_type as Post['postType']) || 'original',
    originalPost: p.original_post ? mapPost(p.original_post) : null,
    repostCount: p.repost_count ?? 0,
    isReposted: p.is_reposted ?? false,
    createdAt: p.created_at,
  };
}

export function mapComment(c: BackendCommentResponse): Comment {
  return {
    id: c.id,
    author: mapUser(c.author),
    postId: '',
    parentId: null,
    content: c.content,
    likesCount: 0,
    isLiked: false,
    replies: [],
    createdAt: c.created_at,
  };
}

export function mapMessage(m: BackendMessageResponse): Message {
  return {
    id: m.id,
    senderId: m.sender_id,
    receiverId: m.receiver_id,
    content: m.content,
    imageUrl: toRelativeUrl(m.image_url),
    createdAt: m.created_at,
    isRead: m.read_at != null,
  };
}

export function mapConversation(c: BackendConversationListResponse): Conversation {
  return {
    id: c.user.username,
    participant: mapUser(c.user),
    lastMessage: mapMessage(c.last_message),
    unreadCount: c.unread_count,
    updatedAt: c.last_message.created_at,
  };
}

export function mapTag(t: BackendTagResponse): Tag {
  return {
    name: t.name,
    postsCount: t.post_count,
  };
}

export function mapNotification(n: BackendNotificationResponse): Notification {
  return {
    id: n.id,
    actor: mapUser(n.actor),
    type: n.type as Notification['type'],
    referenceId: n.reference_id,
    referenceType: n.reference_type,
    isRead: n.is_read,
    createdAt: n.created_at,
  };
}

export function mapSuggestedUser(u: BackendSuggestedUserResponse): SuggestedUser {
  return {
    id: u.id,
    username: u.username,
    displayName: u.display_name,
    bio: u.bio,
    avatarUrl: toRelativeUrl(u.avatar_url),
    bannerUrl: '',
    followersCount: u.follower_count,
    followingCount: u.following_count,
    postsCount: 0,
    isFollowing: false,
    createdAt: '',
    mutualFollowerCount: u.mutual_follower_count,
  };
}
