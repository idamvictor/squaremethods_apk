import { AdminDashboard } from '@/components/dashboard/AdminDashboard'
import { TechnicianDashboard } from '@/components/dashboard/TechnicianDashboard'
import { useAuthStore } from '@/store/auth-store'
import { useProfile } from '@/services/users/users-queries'

export default function DashboardScreen() {
  const storedRole = useAuthStore((s) => s.user?.role)
  const { data: profileData } = useProfile()
  const role = profileData?.data?.role ?? storedRole

  if (role === 'technician') {
    return <TechnicianDashboard />
  }

  return <AdminDashboard />
}
