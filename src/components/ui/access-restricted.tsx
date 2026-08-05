import { Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'

interface AccessRestrictedProps {
  message?: string
}

export function AccessRestricted({ message = 'Access restricted' }: AccessRestrictedProps) {
  const insets = useSafeAreaInsets()
  return (
    <View
      className="flex-1 bg-gray-50 items-center justify-center gap-y-3"
      style={{ paddingTop: insets.top }}
    >
      <Ionicons name="lock-closed-outline" size={40} color="#D1D5DB" />
      <Text className="text-sm text-gray-400">{message}</Text>
      <Pressable onPress={() => router.back()} className="px-4 py-2 bg-blue-600 rounded-xl">
        <Text className="text-sm text-white font-medium">Go back</Text>
      </Pressable>
    </View>
  )
}
