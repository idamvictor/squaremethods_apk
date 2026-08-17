import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'

const COMPANY_SLUG_KEY = 'company_slug'
const COMPANY_NAME_KEY = 'company_display_name'

interface CompanyState {
  companySlug: string | null
  companyName: string | null
  isLoading: boolean
  loadCompany: () => Promise<void>
  setCompany: (slug: string, name: string) => Promise<void>
  clearCompany: () => Promise<void>
}

export const useCompanyStore = create<CompanyState>((set) => ({
  companySlug: null,
  companyName: null,
  isLoading: true,

  loadCompany: async () => {
    try {
      const [companySlug, companyName] = await Promise.all([
        SecureStore.getItemAsync(COMPANY_SLUG_KEY),
        SecureStore.getItemAsync(COMPANY_NAME_KEY),
      ])
      set({ companySlug, companyName, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  setCompany: async (slug, name) => {
    await Promise.all([
      SecureStore.setItemAsync(COMPANY_SLUG_KEY, slug),
      SecureStore.setItemAsync(COMPANY_NAME_KEY, name),
    ])
    set({ companySlug: slug, companyName: name })
  },

  clearCompany: async () => {
    set({ companySlug: null, companyName: null })
    await Promise.all([
      SecureStore.deleteItemAsync(COMPANY_SLUG_KEY),
      SecureStore.deleteItemAsync(COMPANY_NAME_KEY),
    ])
  },
}))
