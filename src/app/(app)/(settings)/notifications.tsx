import { useState } from 'react'
import { Pressable, ScrollView, Switch, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useAuthStore } from '@/store/auth-store'
import { useProfile } from '@/services/users/users-queries'
import type { UserRole } from '@/types/auth'

const ADMIN_ROLES: UserRole[] = ['superadmin', 'owner', 'admin', 'user', 'viewer']

function NotificationRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string
  description?: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <View className="flex-row items-center px-4 py-3.5 gap-x-3">
      <View className="flex-1 gap-y-0.5">
        <Text className="text-sm font-medium text-gray-700">{label}</Text>
        {description && <Text className="text-xs text-gray-400">{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#E5E7EB', true: '#208AEF' }}
        thumbColor="#FFFFFF"
      />
    </View>
  )
}

function Divider() {
  return <View className="h-px bg-gray-100 ml-4" />
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets()
  const storedUser = useAuthStore((s) => s.user)
  const { data: profileData } = useProfile()
  const role = profileData?.data?.role ?? storedUser?.role
  const isAdmin = role ? ADMIN_ROLES.includes(role) : false

  const [newTask, setNewTask] = useState(false)
  const [teamMember, setTeamMember] = useState(true)
  const [sopCreated, setSopCreated] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(false)
  const [emailNotifications, setEmailNotifications] = useState(true)

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
    >
      <View
        style={{ paddingTop: insets.top }}
        className="bg-white border-b border-gray-100 px-4 pb-3 flex-row items-center gap-x-3"
      >
        <Pressable onPress={() => router.back()} hitSlop={8} className="active:opacity-60">
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Notifications</Text>
      </View>

      <View className="px-4 pt-6 gap-y-6">
        <View className="gap-y-1">
          <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mb-1">
            Notify me when
          </Text>
          <View className="bg-white rounded-2xl overflow-hidden">
            <NotificationRow
              label="New task is added"
              description="Get notified when a new task is assigned"
              value={newTask}
              onChange={setNewTask}
            />
            {isAdmin && (
              <>
                <Divider />
                <NotificationRow
                  label="Team member is added"
                  description="Get notified when someone joins your team"
                  value={teamMember}
                  onChange={setTeamMember}
                />
                <Divider />
                <NotificationRow
                  label="A Job Aid is created"
                  description="Get notified when a new job aid is published"
                  value={sopCreated}
                  onChange={setSopCreated}
                />
              </>
            )}
          </View>
        </View>

        <View className="gap-y-1">
          <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mb-1">
            Delivery
          </Text>
          <View className="bg-white rounded-2xl overflow-hidden">
            <NotificationRow
              label="Push Notifications"
              description="Receive alerts on your device"
              value={pushNotifications}
              onChange={setPushNotifications}
            />
            <Divider />
            <NotificationRow
              label="Email Notifications"
              description="Receive updates in your inbox"
              value={emailNotifications}
              onChange={setEmailNotifications}
            />
          </View>
        </View>
      </View>
    </ScrollView>
  )
}
