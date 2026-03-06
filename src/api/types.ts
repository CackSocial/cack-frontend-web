// Backend response shapes (snake_case as returned by the API)

export interface BackendUserProfile {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  follower_count: number;
  following_count: number;
  is_following: boolean;
}

export interface BackendLoginResponse {
  token: string;
  user: BackendUserProfile;
}

export interface BackendPostResponse {
  id: string;
  content: string;
  image_url?: string;
  author: BackendUserProfile;
  tags: string[];
  like_count: number;
  comment_count: number;
  is_liked: boolean;
  is_bookmarked: boolean;
  post_type: string;
  original_post: BackendPostResponse | null;
  repost_count: number;
  is_reposted: boolean;
  created_at: string;
}

export interface BackendCommentResponse {
  id: string;
  content: string;
  author: BackendUserProfile;
  created_at: string;
}

export interface BackendMessageResponse {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  image_url?: string;
  read_at: string | null;
  created_at: string;
}

export interface BackendConversationListResponse {
  user: BackendUserProfile;
  last_message: BackendMessageResponse;
  unread_count: number;
}

export interface BackendTagResponse {
  name: string;
  post_count: number;
}

export interface BackendNotificationResponse {
  id: string;
  actor: BackendUserProfile;
  type: string;
  reference_id: string;
  reference_type: string;
  is_read: boolean;
  created_at: string;
}

export interface BackendUnreadCountResponse {
  count: number;
}

export interface BackendSuggestedUserResponse {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  follower_count: number;
  following_count: number;
  mutual_follower_count: number;
}
