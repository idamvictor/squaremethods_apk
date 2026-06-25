import { View, Text } from "react-native";
import { Button } from "@/components/ui/button";

export default function Index() {
  return (
    <View className="flex-1 items-center justify-center bg-gray-50 px-6 gap-y-8">
      <View className="items-center gap-y-3">
        <Text className="text-5xl font-bold text-gray-900 tracking-tight">
          SquareMethods
        </Text>
        <Text className="text-base text-gray-500 text-center leading-relaxed">
          Welcome to your app powered by NativeWind
        </Text>
      </View>

      <View className="w-full gap-y-3">
        <Button label="Get Started" variant="default" size="lg" />
        <Button label="Learn More" variant="outline" />
        <Button label="Secondary Action" variant="secondary" size="sm" />
      </View>
    </View>
  );
}
