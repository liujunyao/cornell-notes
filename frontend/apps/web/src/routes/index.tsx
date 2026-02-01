/**
 * 路由配置 - 按照原型重新设计
 */
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

// 页面组件
import Login from '../pages/Login'
import Register from '../pages/Register'
import Dashboard from '../pages/Dashboard'
import NotesPage from '../pages/NotesPage'
import NoteEditorPage from '../pages/NoteEditorPage'
import ProfilePage from '../pages/ProfilePage'
import AccountSecurityPage from '../pages/AccountSecurityPage'

// 受保护的路由组件
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

// 路由配置
export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/notes',
    element: (
      <ProtectedRoute>
        <NotesPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/notes/new',
    element: (
      <ProtectedRoute>
        <NoteEditorPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/notes/:noteId',
    element: (
      <ProtectedRoute>
        <NoteEditorPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/review',
    element: (
      <ProtectedRoute>
        <div style={{ padding: '2rem' }}>复习页面（开发中）</div>
      </ProtectedRoute>
    ),
  },
  {
    path: '/starred',
    element: (
      <ProtectedRoute>
        <div style={{ padding: '2rem' }}>收藏页面（开发中）</div>
      </ProtectedRoute>
    ),
  },
  {
    path: '/collab',
    element: (
      <ProtectedRoute>
        <div style={{ padding: '2rem' }}>协作页面（开发中）</div>
      </ProtectedRoute>
    ),
  },
  {
    path: '/profile',
    element: (
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/account-security',
    element: (
      <ProtectedRoute>
        <AccountSecurityPage />
      </ProtectedRoute>
    ),
  },
], {
  future: {
    v7_startTransition: true,
  },
})

export default router
