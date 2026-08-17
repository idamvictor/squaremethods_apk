import { Redirect, Stack, usePathname } from 'expo-router'
import { useAuthStore } from '@/store/auth-store'
import { useCompanyStore } from '@/store/company-store'

export default function AuthLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const companySlug = useCompanyStore((s) => s.companySlug)
  const pathname = usePathname()

  if (!companySlug && pathname !== '/company') {
    return <Redirect href="/(auth)/company" />
  }

  if (isAuthenticated && pathname !== '/suspended') {
    return <Redirect href="/home" />
  }

  return <Stack screenOptions={{ headerShown: false }} />
}
