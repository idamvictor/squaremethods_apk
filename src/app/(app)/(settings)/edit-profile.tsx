import { useEffect, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useProfile, useUpdateProfile } from '@/services/users/users-queries'
import { useAuthStore } from '@/store/auth-store'

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets()
  const setUser = useAuthStore((s) => s.setUser)
  const { data: profileData, isLoading: profileLoading } = useProfile()
  const { mutate, isPending, error } = useUpdateProfile()

  const user = profileData?.data

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ firstName?: string; lastName?: string }>({})

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name ?? '')
      setLastName(user.last_name ?? '')
      setPhone(user.phone ?? '')
    }
  }, [user])

  function validate() {
    const errors: typeof fieldErrors = {}
    if (!firstName.trim()) errors.firstName = 'First name is required'
    if (!lastName.trim()) errors.lastName = 'Last name is required'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  function handleSave() {
    if (!validate()) return
    mutate(
      { first_name: firstName.trim(), last_name: lastName.trim(), phone: phone.trim() || undefined },
      {
        onSuccess: (data) => {
          if (data?.data) setUser(data.data as any)
          router.back()
        },
      }
    )
  }

  const apiError = (error as any)?.response?.data?.message ?? (error as any)?.message ?? null

  return (
    <View className="flex-1 bg-gray-50">
      <View
        style={{ paddingTop: insets.top }}
        className="bg-white border-b border-gray-100 px-4 pb-3 flex-row items-center gap-x-3"
      >
        <Pressable onPress={() => router.back()} hitSlop={8} className="active:opacity-60">
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Edit Profile</Text>
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: insets.bottom + 32 }}
        keyboardShouldPersistTaps="handled"
      >
        {apiError && (
          <View className="rounded-xl bg-red-50 border border-red-200 p-3">
            <Text className="text-sm text-red-600">{apiError}</Text>
          </View>
        )}

        <View className="gap-y-1.5">
          <Text className="text-sm font-medium text-gray-700">First Name</Text>
          <Input
            value={firstName}
            onChangeText={(v) => { setFirstName(v); setFieldErrors((e) => ({ ...e, firstName: undefined })) }}
            placeholder="First name"
            autoCapitalize="words"
            error={!!fieldErrors.firstName}
          />
          {fieldErrors.firstName && <Text className="text-xs text-red-500">{fieldErrors.firstName}</Text>}
        </View>

        <View className="gap-y-1.5">
          <Text className="text-sm font-medium text-gray-700">Last Name</Text>
          <Input
            value={lastName}
            onChangeText={(v) => { setLastName(v); setFieldErrors((e) => ({ ...e, lastName: undefined })) }}
            placeholder="Last name"
            autoCapitalize="words"
            error={!!fieldErrors.lastName}
          />
          {fieldErrors.lastName && <Text className="text-xs text-red-500">{fieldErrors.lastName}</Text>}
        </View>

        <View className="gap-y-1.5">
          <Text className="text-sm font-medium text-gray-700">Phone</Text>
          <Input
            value={phone}
            onChangeText={setPhone}
            placeholder="Phone number"
            keyboardType="phone-pad"
          />
        </View>

        <View className="gap-y-1.5">
          <Text className="text-sm font-medium text-gray-700">Email</Text>
          <View className="h-12 rounded-xl border border-gray-100 bg-gray-50 px-4 justify-center">
            <Text className="text-base text-gray-400">{user?.email ?? '—'}</Text>
          </View>
          <Text className="text-xs text-gray-400">Email cannot be changed</Text>
        </View>

        <View className="gap-y-1.5">
          <Text className="text-sm font-medium text-gray-700">Role</Text>
          <View className="h-12 rounded-xl border border-gray-100 bg-gray-50 px-4 justify-center">
            <Text className="text-base text-gray-400 capitalize">{user?.role ?? '—'}</Text>
          </View>
        </View>

        <Button
          label={isPending ? 'Saving…' : 'Save Changes'}
          variant="default"
          size="lg"
          onPress={handleSave}
          disabled={isPending || profileLoading}
        />
      </KeyboardAwareScrollView>
    </View>
  )
}
