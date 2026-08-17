import axios from 'axios'
import { router } from 'expo-router'
import { useAuthStore } from '@/store/auth-store'
import { useCompanyStore } from '@/store/company-store'

const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://api.squaremethods.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

apiClient.interceptors.request.use((config) => {
  const { token, company } = useAuthStore.getState()
  const { companySlug } = useCompanyStore.getState()
  if (token) config.headers.Authorization = `Bearer ${token}`
  if (company?.id) config.headers['x-company-id'] = company.id
  if (companySlug) {
    config.headers['x-company-slug'] = companySlug
    config.headers['x-company'] = companySlug
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.data?.code === 'COMPANY_SUSPENDED') {
      router.replace('/(auth)/suspended')
      return Promise.reject(error)
    }
    if (error.response?.status === 401) {
      await useAuthStore.getState().logout()
      useAuthStore.setState({ needsLoginRedirect: true })
    }
    return Promise.reject(error)
  }
)

export default apiClient
