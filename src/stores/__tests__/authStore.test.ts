import { useAuthStore } from '../authStore';

vi.mock('../../api/auth', () => ({
  login: vi.fn(),
  register: vi.fn(),
}));

vi.mock('../../api/users', () => ({
  updateProfile: vi.fn(),
  deleteAccount: vi.fn(),
}));

vi.mock('../../api/mappers', () => ({
  mapUser: vi.fn((u) => ({
    id: u.id,
    username: u.username,
    displayName: u.display_name,
    bio: u.bio,
    avatarUrl: u.avatar_url,
    bannerUrl: '',
    followersCount: u.follower_count,
    followingCount: u.following_count,
    postsCount: 0,
    isFollowing: u.is_following,
    createdAt: '',
  })),
}));

vi.mock('../toastStore', () => ({
  useToastStore: {
    getState: () => ({ addToast: vi.fn() }),
  },
}));

const mockAuthAPI = await import('../../api/auth');

const mockBackendUser = {
  id: 'user-1',
  username: 'testuser',
  display_name: 'Test User',
  bio: 'A bio',
  avatar_url: '',
  follower_count: 10,
  following_count: 5,
  is_following: false,
};

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

describe('authStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useAuthStore.setState(initialState);
  });

  describe('login', () => {
    it('sets user and isAuthenticated on success', async () => {
      vi.mocked(mockAuthAPI.login).mockResolvedValue({
        success: true,
        data: { token: 'jwt-token', user: mockBackendUser },
      });

      await useAuthStore.getState().login('testuser', 'password');

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).not.toBeNull();
      expect(state.user!.username).toBe('testuser');
      expect(state.user!.displayName).toBe('Test User');
      expect(state.isLoading).toBe(false);
      expect(localStorage.getItem('sc-token')).toBe('jwt-token');
    });

    it('sets error on failure', async () => {
      const { APIError } = await import('../../api/client');
      vi.mocked(mockAuthAPI.login).mockRejectedValue(
        new APIError(401, 'Invalid credentials'),
      );

      await useAuthStore.getState().login('bad', 'bad');

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.error).toBe('Invalid credentials');
      expect(state.isLoading).toBe(false);
    });
  });

  describe('register', () => {
    it('sets user on success', async () => {
      vi.mocked(mockAuthAPI.register).mockResolvedValue({
        success: true,
        data: { token: 'jwt-token-2', user: mockBackendUser },
      });

      await useAuthStore.getState().register('testuser', 'Test User', 'password');

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).not.toBeNull();
      expect(state.user!.username).toBe('testuser');
      expect(localStorage.getItem('sc-token')).toBe('jwt-token-2');
    });
  });

  describe('logout', () => {
    it('clears user and isAuthenticated', async () => {
      // First login
      vi.mocked(mockAuthAPI.login).mockResolvedValue({
        success: true,
        data: { token: 'jwt-token', user: mockBackendUser },
      });
      await useAuthStore.getState().login('testuser', 'password');
      expect(useAuthStore.getState().isAuthenticated).toBe(true);

      // Then logout
      useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(localStorage.getItem('sc-token')).toBeNull();
      expect(localStorage.getItem('sc-user')).toBeNull();
    });
  });

  describe('clearError', () => {
    it('clears the error state', () => {
      useAuthStore.setState({ error: 'some error' });
      useAuthStore.getState().clearError();
      expect(useAuthStore.getState().error).toBeNull();
    });
  });
});
