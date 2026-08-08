import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useChangePassword, useProfile } from '@/services/users/users-queries'

const PASSWORD_RULES = [
  { test: (p: string) => p.length >= 8, label: 'At least 8 characters' },
  { test: (p: string) => /[A-Z]/.test(p), label: 'At least 1 uppercase letter' },
  { test: (p: string) => /[0-9]/.test(p), label: 'At least 1 number' },
]

export default function ChangePasswordScreen() {
  const insets = useSafeAreaInsets()
  const { data: profileData } = useProfile()
  const userId = profileData?.data?.id ?? ''
  const { mutate, isPending, error, isSuccess, reset } = useChangePassword(userId)

  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNext, setShowNext] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const passwordValid = PASSWORD_RULES.every((r) => r.test(next))

  function validate() {
    const errors: Record<string, string> = {}
    if (!current) errors.current = 'Current password is required'
    if (!next) errors.next = 'New password is required'
    else if (!passwordValid) errors.next = 'Password does not meet requirements'
    if (next !== confirm) errors.confirm = 'Passwords do not match'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  function handleSave() {
    reset()
    if (!validate()) return
    mutate(
      { current_password: current, new_password: next },
      {
        onSuccess: () => {
          setCurrent('')
          setNext('')
          setConfirm('')
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
        <Text className="text-lg font-bold text-gray-900">Change Password</Text>
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
        {isSuccess && (
          <View className="rounded-xl bg-green-50 border border-green-200 p-3">
            <Text className="text-sm text-green-700">Password changed successfully</Text>
          </View>
        )}

        <View className="gap-y-1.5">
          <Text className="text-sm font-medium text-gray-700">Current Password</Text>
          <View className="flex-row items-center">
            <Input
              className="flex-1"
              value={current}
              onChangeText={(v) => { setCurrent(v); setFieldErrors((e) => ({ ...e, current: '' })) }}
              placeholder="Enter current password"
              secureTextEntry={!showCurrent}
              error={!!fieldErrors.current}
            />
            <Pressable onPress={() => setShowCurrent((v) => !v)} className="absolute right-3">
              <Ionicons name={showCurrent ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9CA3AF" />
            </Pressable>
          </View>
          {fieldErrors.current && <Text className="text-xs text-red-500">{fieldErrors.current}</Text>}
        </View>

        <View className="gap-y-1.5">
          <Text className="text-sm font-medium text-gray-700">New Password</Text>
          <View className="flex-row items-center">
            <Input
              className="flex-1"
              value={next}
              onChangeText={(v) => { setNext(v); setFieldErrors((e) => ({ ...e, next: '' })) }}
              placeholder="Enter new password"
              secureTextEntry={!showNext}
              error={!!fieldErrors.next}
            />
            <Pressable onPress={() => setShowNext((v) => !v)} className="absolute right-3">
              <Ionicons name={showNext ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9CA3AF" />
            </Pressable>
          </View>
          {fieldErrors.next
            ? <Text className="text-xs text-red-500">{fieldErrors.next}</Text>
            : next.length > 0 && (
              <View className="gap-y-1 mt-1">
                {PASSWORD_RULES.map((r) => (
                  <View key={r.label} className="flex-row items-center gap-x-1.5">
                    <Ionicons
                      name={r.test(next) ? 'checkmark-circle' : 'ellipse-outline'}
                      size={14}
                      color={r.test(next) ? '#22C55E' : '#D1D5DB'}
                    />
                    <Text className={`text-xs ${r.test(next) ? 'text-green-600' : 'text-gray-400'}`}>
                      {r.label}
                    </Text>
                  </View>
                ))}
              </View>
            )
          }
        </View>

        <View className="gap-y-1.5">
          <Text className="text-sm font-medium text-gray-700">Confirm New Password</Text>
          <View className="flex-row items-center">
            <Input
              className="flex-1"
              value={confirm}
              onChangeText={(v) => { setConfirm(v); setFieldErrors((e) => ({ ...e, confirm: '' })) }}
              placeholder="Confirm new password"
              secureTextEntry={!showConfirm}
              error={!!fieldErrors.confirm}
            />
            <Pressable onPress={() => setShowConfirm((v) => !v)} className="absolute right-3">
              <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9CA3AF" />
            </Pressable>
          </View>
          {fieldErrors.confirm && <Text className="text-xs text-red-500">{fieldErrors.confirm}</Text>}
        </View>

        <Button
          label={isPending ? 'Updating…' : 'Update Password'}
          variant="default"
          size="lg"
          onPress={handleSave}
          disabled={isPending}
        />
      </KeyboardAwareScrollView>
    </View>
  )
}
