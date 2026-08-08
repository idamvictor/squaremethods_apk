import { useState } from 'react'
import {
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { useUpdateAdminCompany } from '@/services/admin/admin-queries'
import type { AdminCompanyStatus } from '@/services/admin/admin-types'

type Params = {
  id: string
  name: string
  email: string
  address: string
  status: string
}

const STATUS_OPTIONS: AdminCompanyStatus[] = ['active', 'inactive', 'suspended']

export default function EditCompanyScreen() {
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<Params>()

  const [name, setName] = useState(params.name ?? '')
  const [email, setEmail] = useState(params.email ?? '')
  const [address, setAddress] = useState(params.address ?? '')
  const [status, setStatus] = useState<AdminCompanyStatus>(
    (params.status as AdminCompanyStatus) ?? 'active',
  )

  const { mutate: update, isPending, error } = useUpdateAdminCompany()
  const errorMsg = (error as any)?.response?.data?.message ?? (error as any)?.message ?? null

  function handleSave() {
    if (!params.id) return
    update(
      {
        id: params.id,
        data: {
          name: name.trim(),
          email: email.trim(),
          address: address.trim() || undefined,
          status,
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
        <Text className="flex-1 text-lg font-bold text-gray-900">Edit Company</Text>
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
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1.5">Company Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Company name"
                placeholderTextColor="#9CA3AF"
                className="h-11 rounded-xl border border-gray-200 px-4 text-sm text-gray-800 bg-gray-50"
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1.5">Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="company@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#9CA3AF"
                className="h-11 rounded-xl border border-gray-200 px-4 text-sm text-gray-800 bg-gray-50"
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1.5">Address</Text>
              <TextInput
                value={address}
                onChangeText={setAddress}
                placeholder="Optional"
                placeholderTextColor="#9CA3AF"
                className="h-11 rounded-xl border border-gray-200 px-4 text-sm text-gray-800 bg-gray-50"
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Status</Text>
              <View className="flex-row gap-x-2">
                {STATUS_OPTIONS.map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => setStatus(s)}
                    className={`flex-1 h-9 rounded-xl border items-center justify-center ${
                      status === s ? 'bg-blue-600 border-blue-600' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium capitalize ${status === s ? 'text-white' : 'text-gray-600'}`}
                    >
                      {s}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          <Pressable
            onPress={handleSave}
            disabled={isPending || !name.trim()}
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
