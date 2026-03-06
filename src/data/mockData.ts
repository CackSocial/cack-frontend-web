import type { User, Comment, Tag, Message, Conversation } from '../types';

/* ─── Users ─── */
export const mockUsers: User[] = [
  {
    id: 'u1',
    username: 'alexcreates',
    displayName: 'Alex Rivera',
    bio: 'Designer & photographer. Capturing the beauty of everyday moments.',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Alex',
    bannerUrl: '',
    followersCount: 2340,
    followingCount: 189,
    postsCount: 142,
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'u2',
    username: 'samdev',
    displayName: 'Sam Chen',
    bio: 'Full-stack engineer. Building things that matter. Open source enthusiast.',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Sam',
    bannerUrl: '',
    followersCount: 5120,
    followingCount: 312,
    postsCount: 87,
    createdAt: '2024-02-20T08:30:00Z',
  },
  {
    id: 'u3',
    username: 'mia.writes',
    displayName: 'Mia Johnson',
    bio: 'Writer, reader, dreamer. Words are my superpower ✍️',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Mia',
    bannerUrl: '',
    followersCount: 8700,
    followingCount: 421,
    postsCount: 315,
    createdAt: '2023-11-05T14:00:00Z',
  },
  {
    id: 'u4',
    username: 'jordanfit',
    displayName: 'Jordan Blake',
    bio: 'Fitness coach & nutritionist. Helping you become your best self.',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Jordan',
    bannerUrl: '',
    followersCount: 12400,
    followingCount: 98,
    postsCount: 203,
    createdAt: '2023-09-10T06:00:00Z',
  },
  {
    id: 'u5',
    username: 'caseymusic',
    displayName: 'Casey Park',
    bio: 'Indie musician & producer. New album "Echoes" out now 🎵',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Casey',
    bannerUrl: '',
    followersCount: 3200,
    followingCount: 245,
    postsCount: 67,
    createdAt: '2024-03-01T12:00:00Z',
  },
  {
    id: 'u6',
    username: 'taylorcooks',
    displayName: 'Taylor Nguyen',
    bio: 'Home chef sharing daily recipes. Food is love made visible.',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Taylor',
    bannerUrl: '',
    followersCount: 6800,
    followingCount: 178,
    postsCount: 254,
    createdAt: '2023-12-25T09:00:00Z',
  },
];

export const currentMockUser: User = {
  id: 'u0',
  username: 'you',
  displayName: 'Your Name',
  bio: 'Welcome to Cack Social! Edit your profile to get started.',
  avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=You',
  bannerUrl: '',
  followersCount: 47,
  followingCount: 12,
  postsCount: 5,
  createdAt: '2024-06-01T10:00:00Z',
};

/* ─── Comments ─── */
export const mockComments: Record<string, Comment[]> = {
  p1: [
    {
      id: 'c1',
      author: mockUsers[1],
      postId: 'p1',
      parentId: null,
      content: 'These compositions are stunning! Do you shoot with a wide-angle lens for the architecture work?',
      likesCount: 12,
      isLiked: false,
      replies: [
        {
          id: 'c1-r1',
          author: mockUsers[0],
          postId: 'p1',
          parentId: 'c1',
          content: 'Thanks Sam! Mostly a 24mm prime -- it gives just the right amount of distortion without going overboard.',
          likesCount: 5,
          isLiked: false,
          replies: [],
          createdAt: '2025-02-27T16:30:00Z',
        },
      ],
      createdAt: '2025-02-27T16:00:00Z',
    },
    {
      id: 'c2',
      author: mockUsers[2],
      postId: 'p1',
      parentId: null,
      content: 'The interplay of shadows in the third shot is incredible. Almost looks like abstract art.',
      likesCount: 8,
      isLiked: true,
      replies: [],
      createdAt: '2025-02-27T17:00:00Z',
    },
  ],
  p2: [
    {
      id: 'c3',
      author: mockUsers[3],
      postId: 'p2',
      parentId: null,
      content: 'So true. Deleting code is one of the most productive things you can do as a developer.',
      likesCount: 34,
      isLiked: false,
      replies: [
        {
          id: 'c3-r1',
          author: mockUsers[1],
          postId: 'p2',
          parentId: 'c3',
          content: 'Exactly! The best part was how many bugs just disappeared along with the complexity.',
          likesCount: 21,
          isLiked: true,
          replies: [
            {
              id: 'c3-r1-r1',
              author: mockUsers[4],
              postId: 'p2',
              parentId: 'c3-r1',
              content: `That's the dream. Less code = less bugs. Math checks out 😄`,
              likesCount: 15,
              isLiked: false,
              replies: [],
              createdAt: '2025-02-27T14:00:00Z',
            },
          ],
          createdAt: '2025-02-27T13:30:00Z',
        },
      ],
      createdAt: '2025-02-27T13:00:00Z',
    },
  ],
};

/* ─── Trending Tags ─── */
export const mockTrendingTags: Tag[] = [
  { name: 'photography', postsCount: 12450 },
  { name: 'coding', postsCount: 9800 },
  { name: 'fitness', postsCount: 8920 },
  { name: 'music', postsCount: 7650 },
  { name: 'writing', postsCount: 6430 },
  { name: 'cooking', postsCount: 5890 },
  { name: 'webdev', postsCount: 5120 },
  { name: 'opensource', postsCount: 4300 },
  { name: 'architecture', postsCount: 3870 },
  { name: 'indie', postsCount: 3210 },
];

/* ─── Conversations ─── */
export const mockMessages: Record<string, Message[]> = {
  conv1: [
    { id: 'm1', senderId: 'u1', content: 'Hey! Saw your latest post about photography tips. Really helpful stuff.', createdAt: '2025-02-27T10:00:00Z', isRead: true },
    { id: 'm2', senderId: 'u0', content: 'Thanks Alex! Glad you found it useful. Any particular technique you want to try?', createdAt: '2025-02-27T10:05:00Z', isRead: true },
    { id: 'm3', senderId: 'u1', content: 'Definitely the long exposure section. I have been wanting to try light painting but never knew where to start.', createdAt: '2025-02-27T10:10:00Z', isRead: true },
    { id: 'm4', senderId: 'u0', content: 'Great choice! Start with a 15-30 second exposure in a dark room. Use any light source, even your phone flashlight works.', createdAt: '2025-02-27T10:15:00Z', isRead: true },
    { id: 'm5', senderId: 'u1', content: 'Perfect, I will try it this weekend. Thanks for the tip!', createdAt: '2025-02-27T10:20:00Z', isRead: true },
  ],
  conv2: [
    { id: 'm6', senderId: 'u2', content: 'Did you check out that new TypeScript feature in 5.4?', createdAt: '2025-02-26T14:00:00Z', isRead: true },
    { id: 'm7', senderId: 'u0', content: 'Not yet! What is new?', createdAt: '2025-02-26T14:10:00Z', isRead: true },
    { id: 'm8', senderId: 'u2', content: 'NoInfer utility type. It prevents unwanted type widening in generic functions. Super useful.', createdAt: '2025-02-26T14:15:00Z', isRead: true },
    { id: 'm9', senderId: 'u0', content: 'Oh nice, I have been wanting something like that. Going to try it now.', createdAt: '2025-02-26T14:20:00Z', isRead: true },
  ],
  conv3: [
    { id: 'm10', senderId: 'u3', content: 'Would you be interested in collaborating on a creative project?', createdAt: '2025-02-25T09:00:00Z', isRead: false },
    { id: 'm11', senderId: 'u3', content: 'I am thinking of a series that combines photography and poetry. Your style would be perfect for it.', createdAt: '2025-02-25T09:05:00Z', isRead: false },
  ],
};

export const mockConversations: Conversation[] = [
  {
    id: 'conv1',
    participant: mockUsers[0],
    lastMessage: mockMessages.conv1[mockMessages.conv1.length - 1],
    unreadCount: 0,
    updatedAt: '2025-02-27T10:20:00Z',
  },
  {
    id: 'conv2',
    participant: mockUsers[1],
    lastMessage: mockMessages.conv2[mockMessages.conv2.length - 1],
    unreadCount: 0,
    updatedAt: '2025-02-26T14:20:00Z',
  },
  {
    id: 'conv3',
    participant: mockUsers[2],
    lastMessage: mockMessages.conv3[mockMessages.conv3.length - 1],
    unreadCount: 2,
    updatedAt: '2025-02-25T09:05:00Z',
  },
];

/* ─── Following relationships ─── */
export const mockFollowing: Set<string> = new Set(['u1', 'u2', 'u3', 'u4']);
export const mockFollowers: Set<string> = new Set(['u1', 'u3', 'u5']);
