import { usePostsStore } from '../postsStore';

vi.mock('../../api/posts', () => ({
  getTimeline: vi.fn(),
  getUserPosts: vi.fn(),
  createPost: vi.fn(),
  deletePost: vi.fn(),
}));

vi.mock('../../api/likes', () => ({
  likePost: vi.fn(),
  unlikePost: vi.fn(),
}));

vi.mock('../../api/bookmarks', () => ({
  bookmarkPost: vi.fn(),
  unbookmarkPost: vi.fn(),
  getBookmarks: vi.fn(),
}));

vi.mock('../../api/mappers', () => ({
  mapPost: vi.fn((p) => ({
    id: p.id,
    author: {
      id: p.author.id,
      username: p.author.username,
      displayName: p.author.display_name,
      bio: '',
      avatarUrl: '',
      followersCount: 0,
      followingCount: 0,
    },
    content: p.content,
    imageUrl: p.image_url,
    tags: p.tags ?? [],
    likesCount: p.like_count,
    commentsCount: p.comment_count,
    isLiked: p.is_liked,
    isBookmarked: p.is_bookmarked,
    createdAt: p.created_at,
  })),
}));

vi.mock('../toastStore', () => ({
  useToastStore: {
    getState: () => ({ addToast: vi.fn() }),
  },
}));

const mockPostsAPI = await import('../../api/posts');
const mockLikesAPI = await import('../../api/likes');

const makeBackendPost = (id: string, content: string, isLiked = false) => ({
  id,
  content,
  image_url: '',
  author: {
    id: 'author-1',
    username: 'author',
    display_name: 'Author',
    bio: '',
    avatar_url: '',
    follower_count: 0,
    following_count: 0,
    is_following: false,
  },
  tags: [],
  like_count: 5,
  comment_count: 2,
  is_liked: isLiked,
  is_bookmarked: false,
  created_at: '2024-01-01T00:00:00Z',
});

const initialState = {
  posts: [],
  isLoading: false,
  isLoadingMore: false,
  hasMore: true,
  currentPage: 1,
  error: null,
};

describe('postsStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePostsStore.setState(initialState);
  });

  describe('fetchTimeline', () => {
    it('populates the posts array', async () => {
      vi.mocked(mockPostsAPI.getTimeline).mockResolvedValue({
        success: true,
        data: [makeBackendPost('p1', 'Hello'), makeBackendPost('p2', 'World')],
        page: 1,
        limit: 20,
        total: 2,
      });

      await usePostsStore.getState().fetchTimeline();

      const state = usePostsStore.getState();
      expect(state.posts).toHaveLength(2);
      expect(state.posts[0].content).toBe('Hello');
      expect(state.posts[1].content).toBe('World');
      expect(state.isLoading).toBe(false);
    });

    it('sets error on failure', async () => {
      vi.mocked(mockPostsAPI.getTimeline).mockRejectedValue(new Error('Network error'));

      await usePostsStore.getState().fetchTimeline();

      expect(usePostsStore.getState().error).toBe('Failed to load timeline');
    });
  });

  describe('addPost', () => {
    it('adds post to the beginning of the array', async () => {
      usePostsStore.setState({
        posts: [{
          id: 'existing',
          author: { id: 'a1', username: 'u', displayName: 'U', bio: '', avatarUrl: '', followersCount: 0, followingCount: 0 },
          content: 'Old post',
          tags: [],
          likesCount: 0,
          commentsCount: 0,
          isLiked: false,
          isBookmarked: false,
          createdAt: '2024-01-01T00:00:00Z',
        }],
      });

      vi.mocked(mockPostsAPI.createPost).mockResolvedValue({
        success: true,
        data: makeBackendPost('new-post', 'New content'),
      });

      const result = await usePostsStore.getState().addPost('New content');

      expect(result).not.toBeNull();
      expect(result!.content).toBe('New content');
      const posts = usePostsStore.getState().posts;
      expect(posts[0].id).toBe('new-post');
      expect(posts[1].id).toBe('existing');
    });
  });

  describe('toggleLike', () => {
    it('optimistically updates isLiked and likesCount', async () => {
      usePostsStore.setState({
        posts: [{
          id: 'p1',
          author: { id: 'a1', username: 'u', displayName: 'U', bio: '', avatarUrl: '', followersCount: 0, followingCount: 0 },
          content: 'A post',
          tags: [],
          likesCount: 5,
          commentsCount: 0,
          isLiked: false,
          isBookmarked: false,
          createdAt: '2024-01-01T00:00:00Z',
        }],
      });

      vi.mocked(mockLikesAPI.likePost).mockResolvedValue({ success: true });

      // Don't await — check optimistic update immediately
      const promise = usePostsStore.getState().toggleLike('p1');

      // Optimistic update should be synchronous
      const post = usePostsStore.getState().posts[0];
      expect(post.isLiked).toBe(true);
      expect(post.likesCount).toBe(6);

      await promise;
    });

    it('reverts on API error', async () => {
      usePostsStore.setState({
        posts: [{
          id: 'p1',
          author: { id: 'a1', username: 'u', displayName: 'U', bio: '', avatarUrl: '', followersCount: 0, followingCount: 0 },
          content: 'A post',
          tags: [],
          likesCount: 5,
          commentsCount: 0,
          isLiked: false,
          isBookmarked: false,
          createdAt: '2024-01-01T00:00:00Z',
        }],
      });

      vi.mocked(mockLikesAPI.likePost).mockRejectedValue(new Error('fail'));

      await usePostsStore.getState().toggleLike('p1');

      const post = usePostsStore.getState().posts[0];
      expect(post.isLiked).toBe(false);
      expect(post.likesCount).toBe(5);
    });
  });

  describe('deletePost', () => {
    it('removes the post from the array', async () => {
      usePostsStore.setState({
        posts: [{
          id: 'p1',
          author: { id: 'a1', username: 'u', displayName: 'U', bio: '', avatarUrl: '', followersCount: 0, followingCount: 0 },
          content: 'A post',
          tags: [],
          likesCount: 0,
          commentsCount: 0,
          isLiked: false,
          isBookmarked: false,
          createdAt: '2024-01-01T00:00:00Z',
        }],
      });

      vi.mocked(mockPostsAPI.deletePost).mockResolvedValue({ success: true });

      await usePostsStore.getState().deletePost('p1');

      expect(usePostsStore.getState().posts).toHaveLength(0);
    });
  });
});
