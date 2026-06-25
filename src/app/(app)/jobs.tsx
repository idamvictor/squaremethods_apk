import { SafeAreaView } from 'react-native-safe-area-context'
import { Text, View } from 'react-native'

export default function JobsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 items-center justify-center gap-y-2 px-6">
        <Text className="text-xl font-bold text-gray-900">Jobs</Text>
        <Text className="text-sm text-gray-400 text-center">
          Full job management coming in the next phase
        </Text>
      </View>
    </SafeAreaView>
  )
}
