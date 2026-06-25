import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'
import type { User, Company } from '@/types/auth'

const TOKEN_KEY = 'auth_token'

function decodeJwtExp(token: string): number | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(base64))
    return typeof payload.exp === 'number' ? payload.exp : null
  } catch {
    return null
  }
}

interface AuthState {
  token: string | null
  user: User | null
  company: Company | null
  isAuthenticated: boolean
  isLoading: boolean
  setAuth: (token: string, user: User, company: Company) => Promise<void>
  setUser: (user: User) => void
  logout: () => Promise<void>
  loadToken: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  company: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: async (token, user, company) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token)
    set({ token, user, company, isAuthenticated: true, isLoading: false })
  },

  setUser: (user) => set({ user }),

  logout: async () => {
    set({ token: null, user: null, company: null, isAuthenticated: false })
    await SecureStore.deleteItemAsync(TOKEN_KEY)
  },

  loadToken: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY)
      if (token) {
        const exp = decodeJwtExp(token)
        if (exp && exp * 1000 > Date.now()) {
          set({ token, isAuthenticated: true, isLoading: false })
          return
        }
        await SecureStore.deleteItemAsync(TOKEN_KEY)
      }
    } catch {
      // SecureStore unavailable (e.g. web without https) — proceed unauthenticated
    }
    set({ isLoading: false })
  },
}))
