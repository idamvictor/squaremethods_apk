import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '@/store/auth-store'

const NAV_ITEMS = [
  { label: 'Job Aids', icon: '📋', href: '/(app)/(job-aids)' as const },
  { label: 'Tasks', icon: '✅', href: '/(app)/(tasks)' as const },
  { label: 'Users', icon: '👥', href: '/(app)/(users)' as const },
  { label: 'Failure Mode', icon: '⚠️', href: '/(app)/(failure-mode)' as const },
  { label: 'Settings', icon: '⚙️', href: '/(app)/(settings)' as const },
]

export default function MoreScreen() {
  const insets = useSafeAreaInsets()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  return (
    <View className="flex-1 bg-gray-50">
      <View style={{ height: insets.top }} className="bg-black" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24, gap: 24 }}>
        {/* User info */}
        <View className="bg-white rounded-2xl p-4 gap-y-1">
          <Text className="text-base font-semibold text-gray-900">
            {user?.first_name} {user?.last_name}
          </Text>
          <Text className="text-sm text-gray-500">{user?.email}</Text>
          <Text className="text-xs text-blue-600 capitalize font-medium mt-0.5">{user?.role}</Text>
        </View>

        {/* Navigation items */}
        <View className="bg-white rounded-2xl overflow-hidden">
          {NAV_ITEMS.map((item, index) => (
            <View key={item.label}>
              <Pressable
                onPress={() => item.href ? router.push(item.href) : undefined}
                className="flex-row items-center px-4 py-3.5 active:bg-gray-50 gap-x-3"
              >
                <Text className="text-base">{item.icon}</Text>
                <Text className="flex-1 text-sm font-medium text-gray-700">{item.label}</Text>
                <Text className="text-gray-300">›</Text>
              </Pressable>
              {index < NAV_ITEMS.length - 1 && (
                <View className="h-px bg-gray-100 ml-12" />
              )}
            </View>
          ))}
        </View>

        {/* Admin Console — superadmin only */}
        {user?.role === 'superadmin' && (
          <View className="bg-white rounded-2xl overflow-hidden">
            <Pressable
              onPress={() => router.push('/(app)/(admin)')}
              className="flex-row items-center px-4 py-3.5 active:bg-gray-50 gap-x-3"
            >
              <Ionicons name="shield-checkmark-outline" size={20} color="#208AEF" />
              <Text className="flex-1 text-sm font-medium text-gray-700">Admin Console</Text>
              <Text className="text-gray-300">›</Text>
            </Pressable>
          </View>
        )}

        {/* Sign out */}
        <Pressable
          onPress={() => logout()}
          className="bg-white rounded-2xl p-4 items-center active:opacity-70"
        >
          <Text className="text-sm font-semibold text-red-500">Sign Out</Text>
        </Pressable>
      </ScrollView>
    </View>
  )
}
