import { useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { router } from 'expo-router'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useForgotPassword } from '@/lib/auth'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
})

type ForgotForm = z.infer<typeof schema>

export default function ForgotPasswordScreen() {
  const [success, setSuccess] = useState(false)
  const { mutate: forgotPassword, isPending, error } = useForgotPassword()

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ForgotForm>({ resolver: zodResolver(schema) })

  const apiError = error
    ? ((error as any)?.response?.data?.message ?? 'Request failed. Please try again.')
    : null

  if (success) {
    return (
      <View className="flex-1 bg-white justify-center px-6 gap-y-6">
        <View className="gap-y-2">
          <Text className="text-3xl font-bold text-gray-900">Check your email</Text>
          <Text className="text-base text-gray-500">
            We sent a reset link to{' '}
            <Text className="font-semibold text-gray-700">{getValues('email')}</Text>.
            Follow the link to create a new password.
          </Text>
        </View>
        <Button
          label="Back to Sign In"
          variant="default"
          size="lg"
          onPress={() => router.replace('/(auth)/login')}
        />
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center px-6 py-12 gap-y-8">
          <Pressable onPress={() => router.back()} className="self-start">
            <Text className="text-sm text-blue-600">← Back</Text>
          </Pressable>

          <View className="gap-y-1">
            <Text className="text-3xl font-bold text-gray-900">Forgot password?</Text>
            <Text className="text-base text-gray-500">
              Enter your email and we'll send you a reset link.
            </Text>
          </View>

          <View className="gap-y-4">
            {apiError && (
              <View className="rounded-xl border border-red-200 bg-red-50 p-3">
                <Text className="text-sm text-red-600">{apiError}</Text>
              </View>
            )}

            <View className="gap-y-1">
              <Text className="text-sm font-medium text-gray-700">Email</Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    placeholder="you@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={!!errors.email}
                  />
                )}
              />
              {errors.email && (
                <Text className="text-xs text-red-500">{errors.email.message}</Text>
              )}
            </View>
          </View>

          <Button
            label={isPending ? 'Sending…' : 'Send Reset Link'}
            variant="default"
            size="lg"
            onPress={handleSubmit((data) =>
              forgotPassword(data, { onSuccess: () => setSuccess(true) })
            )}
            disabled={isPending}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
