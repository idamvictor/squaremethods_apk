import axios from 'axios'
import { useAuthStore } from '@/store/auth-store'

const COMPANY_SLUG = process.env.EXPO_PUBLIC_COMPANY_SLUG ?? 'chowdeck'

const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://api.squaremethods.com/api',
  headers: {
    'Content-Type': 'application/json',
    'x-company-slug': COMPANY_SLUG,
    'x-company': COMPANY_SLUG,
  },
  timeout: 10000,
})

apiClient.interceptors.request.use((config) => {
  const { token, company } = useAuthStore.getState()
  if (token) config.headers.Authorization = `Bearer ${token}`
  if (company?.id) config.headers['x-company-id'] = company.id
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await useAuthStore.getState().logout()
      useAuthStore.setState({ needsLoginRedirect: true })
    }
    return Promise.reject(error)
  }
)

export default apiClient
