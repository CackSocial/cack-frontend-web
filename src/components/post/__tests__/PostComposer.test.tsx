import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { PostComposer } from '../PostComposer';
import { useAuthStore } from '../../../stores/authStore';
import { usePostsStore } from '../../../stores/postsStore';

vi.mock('../../../stores/toastStore', () => ({
  useToastStore: Object.assign(
    vi.fn((selector: any) => selector({ toasts: [] })),
    { getState: () => ({ addToast: vi.fn() }) },
  ),
}));

const mockUser = {
  id: 'user-1',
  username: 'testuser',
  displayName: 'Test User',
  bio: '',
  avatarUrl: '',
  bannerUrl: '',
  followersCount: 0,
  followingCount: 0,
  postsCount: 0,
};

const mockAddPost = vi.fn().mockResolvedValue(null);

describe('PostComposer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });
    usePostsStore.setState({
      posts: [],
      isLoading: false,
      isLoadingMore: false,
      hasMore: true,
      currentPage: 1,
      error: null,
      addPost: mockAddPost,
    });
  });

  function renderComposer() {
    return render(
      <MemoryRouter>
        <PostComposer />
      </MemoryRouter>,
    );
  }

  it('renders the textarea', () => {
    renderComposer();
    expect(screen.getByPlaceholderText("What's on your mind?")).toBeInTheDocument();
  });

  it('submit button is disabled when textarea is empty', () => {
    renderComposer();
    const button = screen.getByRole('button', { name: /post/i });
    expect(button).toBeDisabled();
  });

  it('submit button is enabled after typing', async () => {
    renderComposer();
    const textarea = screen.getByPlaceholderText("What's on your mind?");
    await userEvent.type(textarea, 'Hello world');
    const button = screen.getByRole('button', { name: /post/i });
    expect(button).not.toBeDisabled();
  });

  it('shows character counter when typing', async () => {
    renderComposer();
    const textarea = screen.getByPlaceholderText("What's on your mind?");
    await userEvent.type(textarea, 'Hello');
    expect(screen.getByText('5/500')).toBeInTheDocument();
  });

  it('disables submit when over character limit', async () => {
    renderComposer();
    const textarea = screen.getByPlaceholderText("What's on your mind?");
    const longText = 'a'.repeat(501);
    fireEvent.change(textarea, { target: { value: longText } });
    const button = screen.getByRole('button', { name: /post/i });
    expect(button).toBeDisabled();
    expect(screen.getByText('501/500')).toBeInTheDocument();
  });

  it('calls addPost on submit and clears the textarea', async () => {
    renderComposer();
    const textarea = screen.getByPlaceholderText("What's on your mind?");
    await userEvent.type(textarea, 'Test post');

    const button = screen.getByRole('button', { name: /post/i });
    await userEvent.click(button);

    await waitFor(() => {
      expect(mockAddPost).toHaveBeenCalledWith('Test post', null);
    });
    await waitFor(() => {
      expect(textarea).toHaveValue('');
    });
  });

  it('returns null when user is not authenticated', () => {
    useAuthStore.setState({ user: null, isAuthenticated: false });
    const { container } = renderComposer();
    expect(container.innerHTML).toBe('');
  });
});
