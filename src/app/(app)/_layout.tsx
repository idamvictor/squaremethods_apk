import { Redirect, Stack } from 'expo-router'
import { useAuthStore } from '@/store/auth-store'

export default function AppLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />
  }

  return <Stack screenOptions={{ headerShown: false }} />
}
