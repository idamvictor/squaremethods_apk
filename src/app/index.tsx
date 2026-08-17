import { Redirect } from 'expo-router'
import { useAuthStore } from '@/store/auth-store'
import { useCompanyStore } from '@/store/company-store'

export default function Index() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const companySlug = useCompanyStore((s) => s.companySlug)

  if (!companySlug) {
    return <Redirect href="/(auth)/company" />
  }

  if (isAuthenticated) {
    return <Redirect href="/home" />
  }

  return <Redirect href="/(auth)/login" />
}
