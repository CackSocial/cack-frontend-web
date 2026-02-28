import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout';
import { useAuthStore } from './stores/authStore';
import type { ReactNode } from 'react';

const LoginPage = lazy(() =>
  import('./pages/LoginPage/LoginPage').then((m) => ({ default: m.LoginPage }))
);
const RegisterPage = lazy(() =>
  import('./pages/RegisterPage/RegisterPage').then((m) => ({
    default: m.RegisterPage,
  }))
);
const HomePage = lazy(() =>
  import('./pages/HomePage/HomePage').then((m) => ({ default: m.HomePage }))
);
const ProfilePage = lazy(() =>
  import('./pages/ProfilePage/ProfilePage').then((m) => ({
    default: m.ProfilePage,
  }))
);
const PostDetailPage = lazy(() =>
  import('./pages/PostDetailPage/PostDetailPage').then((m) => ({
    default: m.PostDetailPage,
  }))
);
const ExplorePage = lazy(() =>
  import('./pages/ExplorePage/ExplorePage').then((m) => ({
    default: m.ExplorePage,
  }))
);
const MessagesPage = lazy(() =>
  import('./pages/MessagesPage/MessagesPage').then((m) => ({
    default: m.MessagesPage,
  }))
);
const ConversationPage = lazy(() =>
  import('./pages/ConversationPage/ConversationPage').then((m) => ({
    default: m.ConversationPage,
  }))
);
const SettingsPage = lazy(() =>
  import('./pages/SettingsPage/SettingsPage').then((m) => ({
    default: m.SettingsPage,
  }))
);

function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function PageFallback() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
        color: 'var(--color-text-muted)',
        fontSize: 'var(--text-sm)',
      }}
    >
      Loading…
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />

          {/* Protected routes with layout */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<HomePage />} />
            <Route path="profile/:username" element={<ProfilePage />} />
            <Route path="post/:postId" element={<PostDetailPage />} />
            <Route path="explore" element={<ExplorePage />} />
            <Route path="messages" element={<MessagesPage />} />
            <Route path="messages/:conversationId" element={<ConversationPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
