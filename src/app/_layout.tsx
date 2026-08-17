import '../../global.css'
import { useEffect } from 'react'
import { Stack, router } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { KeyboardProvider } from 'react-native-keyboard-controller'
import { useAuthStore } from '@/store/auth-store'
import { useCompanyStore } from '@/store/company-store'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1 },
    mutations: { retry: 0 },
  },
})

export default function RootLayout() {
  const loadToken = useAuthStore((s) => s.loadToken)
  const isLoading = useAuthStore((s) => s.isLoading)
  const needsLoginRedirect = useAuthStore((s) => s.needsLoginRedirect)
  const clearLoginRedirect = useAuthStore((s) => s.clearLoginRedirect)
  const loadCompany = useCompanyStore((s) => s.loadCompany)
  const isCompanyLoading = useCompanyStore((s) => s.isLoading)

  useEffect(() => {
    loadToken()
    loadCompany()
  }, [loadToken, loadCompany])

  useEffect(() => {
    if (needsLoginRedirect && !isLoading) {
      clearLoginRedirect()
      router.replace('/(auth)/login')
    }
  }, [needsLoginRedirect, isLoading, clearLoginRedirect])

  if (isLoading || isCompanyLoading) {
    return null
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <Stack screenOptions={{ headerShown: false }} />
          </QueryClientProvider>
        </SafeAreaProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  )
}
