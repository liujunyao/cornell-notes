/**
 * 认证状态管理
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  username: string
  email: string
  full_name?: string
  avatar_url?: string
  user_type: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (user: User, token: string) => void
  logout: () => void
  updateUser: (user: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (user, token) => {
        localStorage.setItem('access_token', token)
        localStorage.setItem('user', JSON.stringify(user))
        set({ user, token, isAuthenticated: true })
      },

      logout: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('user')
        set({ user: null, token: null, isAuthenticated: false })
      },

      updateUser: (updatedUser) => {
        set((state) => {
          if (state.user) {
            const newUser = { ...state.user, ...updatedUser }
            localStorage.setItem('user', JSON.stringify(newUser))
            return { user: newUser }
          }
          return state
        })
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)
