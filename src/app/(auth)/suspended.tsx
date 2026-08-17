import { Linking, Pressable, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Button } from '@/components/ui/button'

export default function SuspendedScreen() {
  return (
    <View className="flex-1 bg-white justify-center px-6 py-12 gap-y-8">
      <View className="items-center gap-y-4">
        <View className="w-20 h-20 rounded-2xl bg-blue-50 items-center justify-center">
          <Ionicons name="shield-outline" size={40} color="#208AEF" />
        </View>
        <View className="gap-y-2 items-center">
          <Text className="text-2xl font-bold text-gray-900">Account Suspended</Text>
          <Text className="text-base text-gray-500 text-center">
            Your company account has been suspended. Please contact your administrator or our
            support team for more information.
          </Text>
        </View>
      </View>

      <View className="gap-y-3">
        <Button
          label="Email Support"
          variant="default"
          size="lg"
          onPress={() => Linking.openURL('mailto:Info@squaremethods.com')}
        />
        <Button
          label="Live Chat"
          variant="outline"
          size="lg"
          onPress={() => Linking.openURL('https://tawk.to/chat/657bf23370c9f2407f80014b/1hhm2k68p')}
        />
        <Pressable
          className="h-12 items-center justify-center"
          onPress={() => router.replace('/(auth)/login')}
        >
          <Text className="text-sm font-semibold text-gray-500">← Back to Login</Text>
        </Pressable>
      </View>

      <Text className="text-xs text-gray-300 text-center uppercase tracking-widest">
        Error Code: COMPANY_SUSPENDED
      </Text>
    </View>
  )
}
