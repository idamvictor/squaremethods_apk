import { useAuthStore } from '@/store/auth-store'
import type { UserRole } from '@/types/auth'

const ADMIN_ROLES: UserRole[] = ['superadmin', 'owner', 'admin']

export function isAdmin(role: UserRole | undefined | null): boolean {
  return !!role && ADMIN_ROLES.includes(role)
}

export function isSuperAdmin(role: UserRole | undefined | null): boolean {
  return role === 'superadmin'
}

export function isTechnician(role: UserRole | undefined | null): boolean {
  return role === 'technician'
}

export function usePermissions() {
  const role = useAuthStore((s) => s.user?.role)
  return {
    role,
    isAdmin: isAdmin(role),
    isSuperAdmin: isSuperAdmin(role),
    isTechnician: isTechnician(role),
  }
}
