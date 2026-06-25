import axios from 'axios'
import { router } from 'expo-router'
import { useAuthStore } from '@/store/auth-store'

const apiClient = axios.create({
  baseURL: 'https://api.squaremethods.com/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
})

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await useAuthStore.getState().logout()
      router.replace('/(auth)/login')
    }
    return Promise.reject(error)
  }
)

export default apiClient
