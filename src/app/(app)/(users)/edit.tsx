import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { useUserById, useUpdateUser } from '@/services/users/users-queries'
import { BottomSheetPicker } from '@/components/ui/bottom-sheet-picker'

const ROLE_ITEMS = [
  { label: 'Owner', value: 'owner' },
  { label: 'Admin', value: 'admin' },
  { label: 'Editor', value: 'editor' },
  { label: 'Viewer', value: 'viewer' },
  { label: 'Technician', value: 'technician' },
]

export default function EditUserScreen() {
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<{ id: string }>()
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  const { data: userData, isLoading: userLoading } = useUserById(id)
  const { mutate: updateUser, isPending, error: apiError } = useUpdateUser()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState('')
  const [showRolePicker, setShowRolePicker] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (userData && !initialized) {
      setFirstName(userData.first_name ?? '')
      setLastName(userData.last_name ?? '')
      setPhone(userData.phone ?? '')
      setRole(userData.role ?? '')
      setInitialized(true)
    }
  }, [userData, initialized])

  const selectedRoleLabel = ROLE_ITEMS.find((r) => r.value === role)?.label ?? ''

  function validate() {
    const e: Record<string, string> = {}
    if (!firstName.trim()) e.firstName = 'First name is required'
    if (!role) e.role = 'Role is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSave() {
    if (!id || !validate()) return
    updateUser(
      { userId: id, first_name: firstName.trim(), last_name: lastName.trim(), phone: phone.trim() || undefined, role },
      { onSuccess: () => router.back() },
    )
  }

  const apiErrorMsg = (apiError as any)?.response?.data?.message ?? (apiError as any)?.message ?? null

  if (userLoading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <View style={{ height: insets.top }} className="bg-black absolute top-0 left-0 right-0" />
        <ActivityIndicator color="#208AEF" />
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-gray-50"
    >
      <View style={{ paddingTop: insets.top }} className="bg-white border-b border-gray-100 px-4 pb-3 flex-row items-center justify-between">
        <View className="flex-row items-center gap-x-3">
          <Pressable onPress={() => router.back()} hitSlop={8} className="active:opacity-60">
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </Pressable>
          <Text className="text-lg font-bold text-gray-900">Edit User</Text>
        </View>
        <Pressable
          onPress={handleSave}
          disabled={isPending}
          className="px-4 py-1.5 bg-blue-600 rounded-xl active:opacity-70"
        >
          {isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-sm font-semibold text-white">Save</Text>
          )}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 32 }}
        keyboardShouldPersistTaps="handled"
      >
        {apiErrorMsg && (
          <View className="rounded-xl bg-red-50 border border-red-200 p-3">
            <Text className="text-sm text-red-600">{apiErrorMsg}</Text>
          </View>
        )}

        {/* First Name */}
        <View>
          <Text className="text-sm font-medium text-gray-700 mb-1">
            First Name <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            value={firstName}
            onChangeText={(v) => { setFirstName(v); setErrors((e) => ({ ...e, firstName: '' })) }}
            placeholder="First name"
            className={`h-12 rounded-xl border px-4 text-sm text-gray-800 bg-white ${
              errors.firstName ? 'border-red-400' : 'border-gray-200'
            }`}
            placeholderTextColor="#9CA3AF"
          />
          {!!errors.firstName && <Text className="text-xs text-red-500 mt-1">{errors.firstName}</Text>}
        </View>

        {/* Last Name */}
        <View>
          <Text className="text-sm font-medium text-gray-700 mb-1">Last Name</Text>
          <TextInput
            value={lastName}
            onChangeText={setLastName}
            placeholder="Last name"
            className="h-12 rounded-xl border border-gray-200 px-4 text-sm text-gray-800 bg-white"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Phone */}
        <View>
          <Text className="text-sm font-medium text-gray-700 mb-1">Phone</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="+1 555 000 0000"
            keyboardType="phone-pad"
            className="h-12 rounded-xl border border-gray-200 px-4 text-sm text-gray-800 bg-white"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Role */}
        <View>
          <Text className="text-sm font-medium text-gray-700 mb-1">
            Role <Text className="text-red-500">*</Text>
          </Text>
          <Pressable
            onPress={() => setShowRolePicker(true)}
            className={`h-12 rounded-xl border px-4 flex-row items-center justify-between bg-white ${
              errors.role ? 'border-red-400' : 'border-gray-200'
            }`}
          >
            <Text className={`text-sm ${role ? 'text-gray-800' : 'text-gray-400'}`}>
              {selectedRoleLabel || 'Select a role'}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
          </Pressable>
          {!!errors.role && <Text className="text-xs text-red-500 mt-1">{errors.role}</Text>}
        </View>
      </ScrollView>

      <BottomSheetPicker
        visible={showRolePicker}
        onClose={() => setShowRolePicker(false)}
        title="Select Role"
        items={ROLE_ITEMS}
        selected={role || null}
        onSelect={(v) => {
          setRole(v)
          setErrors((e) => ({ ...e, role: '' }))
          setShowRolePicker(false)
        }}
      />
    </KeyboardAvoidingView>
  )
}
