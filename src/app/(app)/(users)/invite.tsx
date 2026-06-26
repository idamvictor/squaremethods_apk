import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
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
import { router } from 'expo-router'
import { useInviteUsers } from '@/services/users/users-queries'
import { BottomSheetPicker } from '@/components/ui/bottom-sheet-picker'

const ROLE_ITEMS = [
  { label: 'Owner', value: 'owner' },
  { label: 'Admin', value: 'admin' },
  { label: 'Editor', value: 'editor' },
  { label: 'Viewer', value: 'viewer' },
  { label: 'Technician', value: 'technician' },
]

export default function InviteUserScreen() {
  const insets = useSafeAreaInsets()
  const { mutate: inviteUsers, isPending, error: apiError } = useInviteUsers()

  const [emails, setEmails] = useState('')
  const [role, setRole] = useState('')
  const [expiryDays, setExpiryDays] = useState('7')
  const [showRolePicker, setShowRolePicker] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const selectedRoleLabel = ROLE_ITEMS.find((r) => r.value === role)?.label ?? ''

  function validate() {
    const e: Record<string, string> = {}
    const emailList = emails.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean)
    if (emailList.length === 0) e.emails = 'At least one email is required'
    if (!role) e.role = 'Role is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSend() {
    if (!validate()) return
    const emailList = emails.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean)
    inviteUsers(
      { emails: emailList, role, expires_in_days: Number(expiryDays) || 7 },
      {
        onSuccess: () => {
          Alert.alert('Invites sent!', `${emailList.length} invite${emailList.length > 1 ? 's' : ''} sent successfully.`, [
            { text: 'OK', onPress: () => router.back() },
          ])
        },
      },
    )
  }

  const apiErrorMsg = (apiError as any)?.response?.data?.message ?? (apiError as any)?.message ?? null

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-gray-50"
    >
      <View style={{ height: insets.top }} className="bg-black" />

      <View className="bg-white border-b border-gray-100 px-4 pb-3 flex-row items-center justify-between">
        <View className="flex-row items-center gap-x-3">
          <Pressable onPress={() => router.back()} hitSlop={8} className="active:opacity-60">
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </Pressable>
          <Text className="text-lg font-bold text-gray-900">Invite Users</Text>
        </View>
        <Pressable
          onPress={handleSend}
          disabled={isPending}
          className="px-4 py-1.5 bg-blue-600 rounded-xl active:opacity-70"
        >
          {isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-sm font-semibold text-white">Send</Text>
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

        {/* Email(s) */}
        <View>
          <Text className="text-sm font-medium text-gray-700 mb-1">
            Email address(es) <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            value={emails}
            onChangeText={(v) => { setEmails(v); setErrors((e) => ({ ...e, emails: '' })) }}
            placeholder="email@example.com, email2@example.com"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            className={`rounded-xl border px-4 py-3 text-sm text-gray-800 bg-white min-h-[80px] ${
              errors.emails ? 'border-red-400' : 'border-gray-200'
            }`}
            placeholderTextColor="#9CA3AF"
          />
          <Text className="text-xs text-gray-400 mt-1">Separate multiple emails with commas or new lines</Text>
          {!!errors.emails && <Text className="text-xs text-red-500 mt-1">{errors.emails}</Text>}
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

        {/* Expiry days */}
        <View>
          <Text className="text-sm font-medium text-gray-700 mb-1">
            Invite expires after (days) <Text className="text-gray-400 font-normal">(optional)</Text>
          </Text>
          <TextInput
            value={expiryDays}
            onChangeText={setExpiryDays}
            placeholder="7"
            keyboardType="number-pad"
            className="h-12 rounded-xl border border-gray-200 px-4 text-sm text-gray-800 bg-white"
            placeholderTextColor="#9CA3AF"
          />
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
