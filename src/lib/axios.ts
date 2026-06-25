import axios from 'axios'
import { useAuthStore } from '@/store/auth-store'

const apiClient = axios.create({
  baseURL: 'https://api.squaremethods.com/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
})

apiClient.interceptors.request.use((config) => {
  const { token, company } = useAuthStore.getState()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  if (company?.slug) {
    config.headers['x-company-slug'] = company.slug
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await useAuthStore.getState().logout()
      // Signal the root layout to navigate — avoids calling router before nav tree mounts
      useAuthStore.setState({ needsLoginRedirect: true })
    }
    return Promise.reject(error)
  }
)

export default apiClient
