import { View, Text } from 'react-native'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth-store'

export default function DashboardScreen() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  return (
    <View className="flex-1 items-center justify-center bg-gray-50 px-6 gap-y-6">
      <View className="items-center gap-y-2">
        <Text className="text-2xl font-bold text-gray-900">Welcome back!</Text>
        {user && (
          <Text className="text-base text-gray-500">
            {user.first_name} {user.last_name}
          </Text>
        )}
        <Text className="text-sm text-gray-400 capitalize">{user?.role}</Text>
      </View>

      <Button label="Sign Out" variant="outline" onPress={() => logout()} />
    </View>
  )
}
