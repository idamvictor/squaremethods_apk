import axios from 'axios'
import { useAuthStore } from '@/store/auth-store'

const chatApiClient = axios.create({
  baseURL: 'https://chatapi.squaremethods.com/prod',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

chatApiClient.interceptors.request.use((config) => {
  const { token } = useAuthStore.getState()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

chatApiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await useAuthStore.getState().logout()
      useAuthStore.setState({ needsLoginRedirect: true })
    }
    return Promise.reject(error)
  }
)

export default chatApiClient
