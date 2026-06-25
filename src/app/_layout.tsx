import '../../global.css'
import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth-store'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1 },
    mutations: { retry: 0 },
  },
})

export default function RootLayout() {
  const loadToken = useAuthStore((s) => s.loadToken)
  const isLoading = useAuthStore((s) => s.isLoading)

  useEffect(() => {
    loadToken()
  }, [loadToken])

  if (isLoading) {
    return null
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  )
}
