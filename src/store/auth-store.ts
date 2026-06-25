import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'
import type { User, Company } from '@/types/auth'

const TOKEN_KEY = 'auth_token'
const COMPANY_KEY = 'auth_company'
const API_BASE = 'https://api.squaremethods.com/api'

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
  needsLoginRedirect: boolean
  setAuth: (token: string, user: User, company: Company) => Promise<void>
  setUser: (user: User) => void
  logout: () => Promise<void>
  loadToken: () => Promise<void>
  clearLoginRedirect: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  company: null,
  isAuthenticated: false,
  isLoading: true,
  needsLoginRedirect: false,

  setAuth: async (token, user, company) => {
    await Promise.all([
      SecureStore.setItemAsync(TOKEN_KEY, token),
      SecureStore.setItemAsync(COMPANY_KEY, JSON.stringify(company)),
    ])
    set({ token, user, company, isAuthenticated: true, isLoading: false })
  },

  setUser: (user) => set({ user }),

  logout: async () => {
    set({ token: null, user: null, company: null, isAuthenticated: false, needsLoginRedirect: false })
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(COMPANY_KEY),
    ])
  },

  clearLoginRedirect: () => set({ needsLoginRedirect: false }),

  loadToken: async () => {
    try {
      const [token, companyStr] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEY),
        SecureStore.getItemAsync(COMPANY_KEY),
      ])
      const company: Company | null = companyStr ? JSON.parse(companyStr) : null

      if (token) {
        const exp = decodeJwtExp(token)
        if (exp && exp * 1000 > Date.now()) {
          try {
            const res = await fetch(`${API_BASE}/users/profile`, {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
                ...(company?.slug ? { 'x-company-slug': company.slug } : {}),
              },
            })
            if (res.ok) {
              const json = await res.json()
              set({ token, user: json.data, company, isAuthenticated: true, isLoading: false })
              return
            }
            if (res.status === 401) {
              await Promise.all([
                SecureStore.deleteItemAsync(TOKEN_KEY),
                SecureStore.deleteItemAsync(COMPANY_KEY),
              ])
              set({ isLoading: false })
              return
            }
            // Server error — keep auth with whatever we have
            set({ token, company, isAuthenticated: true, isLoading: false })
            return
          } catch {
            // No network — allow offline usage with stored token/company
            set({ token, company, isAuthenticated: true, isLoading: false })
            return
          }
        }
        await Promise.all([
          SecureStore.deleteItemAsync(TOKEN_KEY),
          SecureStore.deleteItemAsync(COMPANY_KEY),
        ])
      }
    } catch {
      // SecureStore unavailable
    }
    set({ isLoading: false })
  },
}))
