import { useState } from 'react'
import {
  Pressable,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { useUpdateAdminUser } from '@/services/admin/admin-queries'

type Params = {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  is_active: string
  email_verified: string
}

export default function EditUserScreen() {
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<Params>()

  const [firstName, setFirstName] = useState(params.first_name ?? '')
  const [lastName, setLastName] = useState(params.last_name ?? '')
  const [email, setEmail] = useState(params.email ?? '')
  const [phone, setPhone] = useState(params.phone ?? '')
  const [isActive, setIsActive] = useState(params.is_active === 'true')
  const [emailVerified, setEmailVerified] = useState(params.email_verified === 'true')

  const { mutate: update, isPending, error } = useUpdateAdminUser()
  const errorMsg = (error as any)?.response?.data?.message ?? (error as any)?.message ?? null

  function handleSave() {
    if (!params.id) return
    update(
      {
        id: params.id,
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          is_active: isActive,
          email_verified: emailVerified,
        },
      },
      { onSuccess: () => router.back() },
    )
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View
        style={{ paddingTop: insets.top }}
        className="bg-white border-b border-gray-100 px-4 pb-3 flex-row items-center gap-x-3"
      >
        <Pressable onPress={() => router.back()} hitSlop={8} className="active:opacity-60">
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </Pressable>
        <Text className="flex-1 text-lg font-bold text-gray-900">Edit User</Text>
      </View>

      <View className="flex-1">
        <KeyboardAwareScrollView
          contentContainerStyle={{
            padding: 16,
            gap: 16,
            paddingBottom: insets.bottom + 32,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {errorMsg && (
            <View className="rounded-xl bg-red-50 border border-red-200 p-3">
              <Text className="text-sm text-red-600">{errorMsg}</Text>
            </View>
          )}

          <View className="bg-white rounded-2xl p-4 gap-y-4">
            <View className="flex-row gap-x-3">
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-1.5">First Name</Text>
                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="First name"
                  placeholderTextColor="#9CA3AF"
                  className="h-11 rounded-xl border border-gray-200 px-4 text-sm text-gray-800 bg-gray-50"
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-1.5">Last Name</Text>
                <TextInput
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Last name"
                  placeholderTextColor="#9CA3AF"
                  className="h-11 rounded-xl border border-gray-200 px-4 text-sm text-gray-800 bg-gray-50"
                />
              </View>
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1.5">Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="user@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#9CA3AF"
                className="h-11 rounded-xl border border-gray-200 px-4 text-sm text-gray-800 bg-gray-50"
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1.5">Phone</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="Optional"
                keyboardType="phone-pad"
                placeholderTextColor="#9CA3AF"
                className="h-11 rounded-xl border border-gray-200 px-4 text-sm text-gray-800 bg-gray-50"
              />
            </View>
          </View>

          <View className="bg-white rounded-2xl p-4 gap-y-1">
            <View className="flex-row items-center justify-between py-2">
              <View>
                <Text className="text-sm font-medium text-gray-800">Active Account</Text>
                <Text className="text-xs text-gray-400 mt-0.5">User can log in</Text>
              </View>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                trackColor={{ false: '#E5E7EB', true: '#208AEF' }}
                thumbColor="#fff"
              />
            </View>
            <View className="h-px bg-gray-100" />
            <View className="flex-row items-center justify-between py-2">
              <View>
                <Text className="text-sm font-medium text-gray-800">Email Verified</Text>
                <Text className="text-xs text-gray-400 mt-0.5">Mark email as verified</Text>
              </View>
              <Switch
                value={emailVerified}
                onValueChange={setEmailVerified}
                trackColor={{ false: '#E5E7EB', true: '#208AEF' }}
                thumbColor="#fff"
              />
            </View>
          </View>

          <Pressable
            onPress={handleSave}
            disabled={isPending || !firstName.trim() || !lastName.trim()}
            className="h-12 rounded-xl bg-blue-600 items-center justify-center active:opacity-80"
          >
            <Text className="text-sm font-semibold text-white">
              {isPending ? 'Saving…' : 'Save Changes'}
            </Text>
          </Pressable>
        </KeyboardAwareScrollView>
      </View>
    </View>
  )
}
