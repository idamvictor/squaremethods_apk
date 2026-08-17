import { Modal, View, Text } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import apiClient from '@/lib/axios'
import { useCompanyStore } from '@/store/company-store'

const schema = z.object({
  company: z.string().min(1, 'Enter your company name or code'),
})

type CompanyForm = z.infer<typeof schema>

const DEFAULT_SLUG = process.env.EXPO_PUBLIC_COMPANY_SLUG

export function AttachCompanyModal({ visible }: { visible: boolean }) {
  const setCompany = useCompanyStore((s) => s.setCompany)
  const queryClient = useQueryClient()

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CompanyForm>({ resolver: zodResolver(schema) })

  const { mutate: lookupCompany, isPending } = useMutation({
    mutationFn: async (slug: string) => {
      const cleanSlug = slug.trim().toLowerCase().replace(/\s+/g, '-')
      const res = await apiClient.get(`/company/slug/${encodeURIComponent(cleanSlug)}`)
      return { slug: cleanSlug, name: res.data?.data?.name as string }
    },
    onSuccess: async ({ slug, name }) => {
      await setCompany(slug, name)
      // Every other query was fetched without (or with stale) company
      // headers, so anything already in an error/stale state needs to
      // retry now that the company context is set.
      queryClient.invalidateQueries()
    },
    onError: (error: any) => {
      const status = error?.response?.status
      const message =
        status === 404
          ? 'Company not found. Check the name and try again.'
          : (error?.response?.data?.message ?? 'Something went wrong. Please try again.')
      setError('company', { message })
    },
  })

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={() => {}}>
      <View className="flex-1 bg-white">
        <KeyboardAwareScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 justify-center px-6 py-12 gap-y-8">
            <View className="gap-y-1">
              <Text className="text-3xl font-bold text-gray-900">Find your company</Text>
              <Text className="text-base text-gray-500">
                Enter your company name to get started.
              </Text>
            </View>

            <View className="gap-y-4">
              <View className="gap-y-1">
                <Text className="text-sm font-medium text-gray-700">Company</Text>
                <Controller
                  control={control}
                  name="company"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      placeholder={DEFAULT_SLUG ?? 'e.g. acme'}
                      autoCapitalize="none"
                      autoCorrect={false}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      error={!!errors.company}
                    />
                  )}
                />
                {errors.company && (
                  <Text className="text-xs text-red-500">{errors.company.message}</Text>
                )}
              </View>
            </View>

            <Button
              label={isPending ? 'Checking…' : 'Continue'}
              variant="default"
              size="lg"
              onPress={handleSubmit((data) => lookupCompany(data.company))}
              disabled={isPending}
            />
          </View>
        </KeyboardAwareScrollView>
      </View>
    </Modal>
  )
}
