import { useEffect, useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useCompanyProfile, useUpdateCompanySettings } from '@/services/company/company-queries'

export default function CompanySettingsScreen() {
  const insets = useSafeAreaInsets()
  const { data, isLoading } = useCompanyProfile()
  const { mutate, isPending, error } = useUpdateCompanySettings()

  const company = data?.data

  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; address?: string }>({})

  useEffect(() => {
    if (company) {
      setName(company.name ?? '')
      setAddress(company.address ?? '')
    }
  }, [company])

  function validate() {
    const errors: typeof fieldErrors = {}
    if (!name.trim()) errors.name = 'Company name is required'
    if (!address.trim()) errors.address = 'Company address is required'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  function handleSave() {
    if (!validate()) return
    mutate(
      { name: name.trim(), address: address.trim() },
      { onSuccess: () => router.back() }
    )
  }

  const apiError = (error as any)?.response?.data?.message ?? (error as any)?.message ?? null

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-gray-50"
    >
      <View
        style={{ paddingTop: insets.top }}
        className="bg-white border-b border-gray-100 px-4 pb-3 flex-row items-center gap-x-3"
      >
        <Pressable onPress={() => router.back()} hitSlop={8} className="active:opacity-60">
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Company Settings</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: insets.bottom + 32 }}
        keyboardShouldPersistTaps="handled"
      >
        {apiError && (
          <View className="rounded-xl bg-red-50 border border-red-200 p-3">
            <Text className="text-sm text-red-600">{apiError}</Text>
          </View>
        )}

        <View className="gap-y-1.5">
          <Text className="text-sm font-medium text-gray-700">Company Name</Text>
          <Input
            value={name}
            onChangeText={(v) => { setName(v); setFieldErrors((e) => ({ ...e, name: undefined })) }}
            placeholder="Company name"
            autoCapitalize="words"
            error={!!fieldErrors.name}
          />
          {fieldErrors.name && <Text className="text-xs text-red-500">{fieldErrors.name}</Text>}
        </View>

        <View className="gap-y-1.5">
          <Text className="text-sm font-medium text-gray-700">Address</Text>
          <Input
            value={address}
            onChangeText={(v) => { setAddress(v); setFieldErrors((e) => ({ ...e, address: undefined })) }}
            placeholder="Company address"
            autoCapitalize="sentences"
            error={!!fieldErrors.address}
          />
          {fieldErrors.address && <Text className="text-xs text-red-500">{fieldErrors.address}</Text>}
        </View>

        <View className="gap-y-1.5">
          <Text className="text-sm font-medium text-gray-700">Workspace URL</Text>
          <View className="h-12 rounded-xl border border-gray-100 bg-gray-50 px-4 justify-center">
            <Text className="text-base text-gray-400">
              {company?.slug ? `${company.slug}.squaremethods.com` : '—'}
            </Text>
          </View>
          <Text className="text-xs text-gray-400">Workspace URL cannot be changed</Text>
        </View>

        <Button
          label={isPending ? 'Saving…' : 'Save Changes'}
          variant="default"
          size="lg"
          onPress={handleSave}
          disabled={isPending || isLoading}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
