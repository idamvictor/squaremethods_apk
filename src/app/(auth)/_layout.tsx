import { Redirect, Stack, usePathname } from 'expo-router'
import { useAuthStore } from '@/store/auth-store'

export default function AuthLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const pathname = usePathname()

  if (isAuthenticated && pathname !== '/suspended') {
    return <Redirect href="/home" />
  }

  return <Stack screenOptions={{ headerShown: false }} />
}
