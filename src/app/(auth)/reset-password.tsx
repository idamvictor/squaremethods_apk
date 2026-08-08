import {
  Pressable,
  Text,
  View,
} from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { router, useLocalSearchParams } from 'expo-router'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { useResetPassword } from '@/lib/auth'

const passwordSchema = z
  .string()
  .min(8, 'At least 8 characters')
  .regex(/[A-Z]/, 'At least 1 uppercase letter')
  .regex(/[a-z]/, 'At least 1 lowercase letter')
  .regex(/[0-9]/, 'At least 1 number')
  .regex(/[^A-Za-z0-9]/, 'At least 1 special character')

const schema = z
  .object({
    password: passwordSchema,
    confirm_password: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "Passwords don't match",
    path: ['confirm_password'],
  })

type ResetForm = z.infer<typeof schema>

export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams<{ token: string }>()
  const { mutate: resetPassword, isPending, error } = useResetPassword()

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetForm>({ resolver: zodResolver(schema) })

  const apiError = error
    ? ((error as any)?.response?.data?.message ?? 'Reset failed. Please try again.')
    : null

  if (!token) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6 gap-y-4">
        <Text className="text-xl font-bold text-gray-900">Invalid Link</Text>
        <Text className="text-center text-base text-gray-500">
          This reset link is invalid or has expired.
        </Text>
        <Button
          label="Back to Sign In"
          variant="default"
          onPress={() => router.replace('/(auth)/login')}
        />
      </View>
    )
  }

  return (
    <View className="flex-1 bg-white">
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center px-6 py-12 gap-y-8">
          <Pressable onPress={() => router.back()} className="self-start">
            <Text className="text-sm text-blue-600">← Back</Text>
          </Pressable>

          <View className="gap-y-1">
            <Text className="text-3xl font-bold text-gray-900">New password</Text>
            <Text className="text-base text-gray-500">Create a strong password for your account.</Text>
          </View>

          <View className="gap-y-4">
            {apiError && (
              <View className="rounded-xl border border-red-200 bg-red-50 p-3">
                <Text className="text-sm text-red-600">{apiError}</Text>
              </View>
            )}

            <View className="gap-y-1">
              <Text className="text-sm font-medium text-gray-700">New Password</Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <PasswordInput
                    placeholder="Enter new password"
                    autoComplete="new-password"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={!!errors.password}
                  />
                )}
              />
              {errors.password && (
                <Text className="text-xs text-red-500">{errors.password.message}</Text>
              )}
            </View>

            <View className="gap-y-1">
              <Text className="text-sm font-medium text-gray-700">Confirm Password</Text>
              <Controller
                control={control}
                name="confirm_password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <PasswordInput
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={!!errors.confirm_password}
                  />
                )}
              />
              {errors.confirm_password && (
                <Text className="text-xs text-red-500">{errors.confirm_password.message}</Text>
              )}
            </View>
          </View>

          <Button
            label={isPending ? 'Resetting…' : 'Reset Password'}
            variant="default"
            size="lg"
            onPress={handleSubmit((data) =>
              resetPassword({ token: token as string, password: data.password })
            )}
            disabled={isPending}
          />
        </View>
      </KeyboardAwareScrollView>
    </View>
  )
}
