import { useState } from 'react'
import { Alert, Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import Constants from 'expo-constants'
import { useAuthStore } from '@/store/auth-store'
import { useDeleteAccount, useProfile } from '@/services/users/users-queries'
import type { UserRole } from '@/types/auth'

const ADMIN_ROLES: UserRole[] = ['superadmin', 'owner', 'admin']

function initials(firstName?: string | null, lastName?: string | null) {
  return `${(firstName?.[0] ?? '').toUpperCase()}${(lastName?.[0] ?? '').toUpperCase()}`
}

function Divider() {
  return <View className="h-px bg-gray-100 ml-4" />
}

function SubRow({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center pl-8 pr-4 py-3 active:bg-gray-50 gap-x-3"
    >
      <View className="w-1.5 h-1.5 rounded-full bg-gray-300 mr-1" />
      <Text className="flex-1 text-sm text-gray-600">{label}</Text>
      <Ionicons name="chevron-forward" size={14} color="#D1D5DB" />
    </Pressable>
  )
}

interface AccordionSectionProps {
  title: string
  icon: keyof typeof Ionicons.glyphMap
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}

function AccordionSection({ title, icon, open, onToggle, children }: AccordionSectionProps) {
  return (
    <View className="bg-white rounded-2xl overflow-hidden">
      <Pressable
        onPress={onToggle}
        className="flex-row items-center px-4 py-3.5 active:bg-gray-50 gap-x-3"
      >
        <View className="w-8 h-8 rounded-full bg-blue-50 items-center justify-center">
          <Ionicons name={icon} size={16} color="#208AEF" />
        </View>
        <Text className="flex-1 text-sm font-semibold text-gray-800">{title}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color="#9CA3AF" />
      </Pressable>
      {open && (
        <>
          <Divider />
          {children}
        </>
      )}
    </View>
  )
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets()
  const storedUser = useAuthStore((s) => s.user)
  const company = useAuthStore((s) => s.company)
  const logout = useAuthStore((s) => s.logout)
  const { data: profileData } = useProfile()

  const user = profileData?.data ?? storedUser
  const version = Constants.expoConfig?.version ?? '—'
  const isAdmin = user?.role ? ADMIN_ROLES.includes(user.role) : false

  const { mutate: deleteAccount, isPending: deleting } = useDeleteAccount(user?.id ?? '')
  const [openSection, setOpenSection] = useState<string | null>(null)

  function toggle(key: string) {
    setOpenSection((prev) => (prev === key ? null : key))
  }

  function confirmDeleteAccount() {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all associated data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteAccount(undefined, { onSuccess: () => logout() }),
        },
      ]
    )
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
    >
      {/* Header */}
      <View
        style={{ paddingTop: insets.top }}
        className="bg-white border-b border-gray-100 px-4 pb-3 flex-row items-center gap-x-3"
      >
        <Pressable onPress={() => router.back()} hitSlop={8} className="active:opacity-60">
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Settings</Text>
      </View>

      <View className="px-4 pt-6 gap-y-3">
        {/* Profile card */}
        <View className="bg-white rounded-2xl p-4 flex-row items-center gap-x-4 mb-3">
          <View className="w-14 h-14 rounded-full bg-blue-600 items-center justify-center">
            <Text className="text-xl font-bold text-white">
              {initials(user?.first_name, user?.last_name)}
            </Text>
          </View>
          <View className="flex-1 gap-y-0.5">
            <Text className="text-base font-semibold text-gray-900">
              {user?.first_name} {user?.last_name}
            </Text>
            <Text className="text-sm text-gray-500">{user?.email}</Text>
            <View className="mt-1 self-start bg-blue-50 rounded-full px-2.5 py-0.5">
              <Text className="text-xs font-medium text-blue-600 capitalize">{user?.role}</Text>
            </View>
          </View>
        </View>

        {/* Account accordion */}
        <AccordionSection
          title="Account"
          icon="person-outline"
          open={openSection === 'account'}
          onToggle={() => toggle('account')}
        >
          <SubRow label="Edit Profile" onPress={() => router.push('/(app)/(settings)/edit-profile')} />
          <Divider />
          <SubRow label="Change Password" onPress={() => router.push('/(app)/(settings)/change-password')} />
          <Divider />
          <SubRow label="Notifications" onPress={() => router.push('/(app)/(settings)/notifications')} />
          <Divider />
          <Pressable
            onPress={confirmDeleteAccount}
            disabled={deleting}
            className="flex-row items-center pl-8 pr-4 py-3 active:bg-gray-50 gap-x-3"
          >
            <View className="w-1.5 h-1.5 rounded-full bg-red-300 mr-1" />
            <Text className="flex-1 text-sm text-red-500">
              {deleting ? 'Deleting…' : 'Delete Account'}
            </Text>
          </Pressable>
        </AccordionSection>

        {/* Company accordion — admin only */}
        {isAdmin && (
          <AccordionSection
            title="Company"
            icon="business-outline"
            open={openSection === 'company'}
            onToggle={() => toggle('company')}
          >
            <SubRow label="Company Settings" onPress={() => router.push('/(app)/(settings)/company-settings')} />
            {company && (
              <>
                <Divider />
                <View className="pl-8 pr-4 py-3 gap-y-1">
                  <Text className="text-xs text-gray-400">{company.name}</Text>
                  <Text className="text-xs text-gray-400">{company.slug}.squaremethods.com</Text>
                </View>
              </>
            )}
          </AccordionSection>
        )}

        {/* App accordion */}
        <AccordionSection
          title="App"
          icon="information-circle-outline"
          open={openSection === 'app'}
          onToggle={() => toggle('app')}
        >
          <View className="flex-row items-center pl-8 pr-4 py-3">
            <Text className="flex-1 text-sm text-gray-600">Version</Text>
            <Text className="text-sm text-gray-400">{version}</Text>
          </View>
        </AccordionSection>

        {/* Sign out */}
        <View className="bg-white rounded-2xl overflow-hidden mt-3">
          <Pressable
            onPress={() => logout()}
            className="flex-row items-center px-4 py-3.5 active:bg-gray-50 gap-x-3"
          >
            <View className="w-8 h-8 rounded-full bg-red-50 items-center justify-center">
              <Ionicons name="log-out-outline" size={16} color="#EF4444" />
            </View>
            <Text className="flex-1 text-sm font-semibold text-red-500">Sign Out</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  )
}
