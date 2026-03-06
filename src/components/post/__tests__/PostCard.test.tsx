import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { PostCard } from '../PostCard';
import { usePostsStore } from '../../../stores/postsStore';
import { useAuthStore } from '../../../stores/authStore';
import type { Post } from '../../../types';

vi.mock('../../../stores/toastStore', () => ({
  useToastStore: Object.assign(
    vi.fn((selector: any) => selector({ toasts: [] })),
    { getState: () => ({ addToast: vi.fn() }) },
  ),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockToggleLike = vi.fn();
const mockToggleBookmark = vi.fn();
const mockDeletePost = vi.fn();

const mockPost: Post = {
  id: 'post-1',
  author: {
    id: 'author-1',
    username: 'johndoe',
    displayName: 'John Doe',
    bio: '',
    avatarUrl: '',
    followersCount: 10,
    followingCount: 5,
  },
  content: 'Hello world! #test',
  tags: ['test'],
  likesCount: 42,
  commentsCount: 7,
  isLiked: false,
  isBookmarked: false,
  postType: 'original',
  originalPost: null,
  repostCount: 0,
  isReposted: false,
  createdAt: new Date(Date.now() - 3600000).toISOString(),
};

describe('PostCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePostsStore.setState({
      posts: [],
      isLoading: false,
      isLoadingMore: false,
      hasMore: true,
      currentPage: 1,
      error: null,
      toggleLike: mockToggleLike,
      toggleBookmark: mockToggleBookmark,
      deletePost: mockDeletePost,
    });
    useAuthStore.setState({
      user: { id: 'other-user', username: 'other', displayName: 'Other', bio: '', avatarUrl: '', followersCount: 0, followingCount: 0 },
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });
  });

  function renderCard(post: Post = mockPost) {
    return render(
      <MemoryRouter>
        <PostCard post={post} />
      </MemoryRouter>,
    );
  }

  it('displays the author display name', () => {
    renderCard();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('displays the author username', () => {
    renderCard();
    expect(screen.getByText('@johndoe')).toBeInTheDocument();
  });

  it('displays the post content', () => {
    renderCard();
    // Content includes hashtag link and plain text
    expect(screen.getByText(/Hello world!/)).toBeInTheDocument();
  });

  it('displays the like count', () => {
    renderCard();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('displays the comment count', () => {
    renderCard();
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('calls toggleLike when like button is clicked', async () => {
    renderCard();
    const likeBtn = screen.getByLabelText('Like');
    await userEvent.click(likeBtn);
    expect(mockToggleLike).toHaveBeenCalledWith('post-1');
  });

  it('calls toggleBookmark when bookmark button is clicked', async () => {
    renderCard();
    const bookmarkBtn = screen.getByLabelText('Bookmark');
    await userEvent.click(bookmarkBtn);
    expect(mockToggleBookmark).toHaveBeenCalledWith('post-1');
  });

  it('does not show delete button when not the post owner', () => {
    renderCard();
    expect(screen.queryByLabelText('Delete post')).not.toBeInTheDocument();
  });

  it('shows delete button when current user is the post owner', () => {
    useAuthStore.setState({
      user: { id: 'author-1', username: 'johndoe', displayName: 'John Doe', bio: '', avatarUrl: '', followersCount: 0, followingCount: 0 },
    });
    renderCard();
    expect(screen.getByLabelText('Delete post')).toBeInTheDocument();
  });

  it('shows Unlike label when post is already liked', () => {
    renderCard({ ...mockPost, isLiked: true });
    expect(screen.getByLabelText('Unlike')).toBeInTheDocument();
  });

  it('shows Remove bookmark label when post is bookmarked', () => {
    renderCard({ ...mockPost, isBookmarked: true });
    expect(screen.getByLabelText('Remove bookmark')).toBeInTheDocument();
  });

  it('calls toggleLike with original post id when liking a repost', async () => {
    const repost: Post = {
      ...mockPost,
      id: 'repost-1',
      postType: 'repost',
      originalPost: {
        ...mockPost,
        id: 'original-1',
        author: {
          id: 'orig-author',
          username: 'origuser',
          displayName: 'Original Author',
          bio: '',
          avatarUrl: '',
          followersCount: 0,
          followingCount: 0,
        },
      },
    };
    renderCard(repost);
    const likeBtn = screen.getByLabelText('Like');
    await userEvent.click(likeBtn);
    expect(mockToggleLike).toHaveBeenCalledWith('original-1');
  });
});
