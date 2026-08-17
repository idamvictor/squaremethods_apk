import {
  Pressable,
  Text,
  View,
} from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { Link, router } from 'expo-router'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { useLogin } from '@/lib/auth'
import { useCompanyStore } from '@/store/company-store'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof schema>

export default function LoginScreen() {
  const { mutate: login, isPending, error } = useLogin()
  const companyName = useCompanyStore((s) => s.companyName)
  const clearCompany = useCompanyStore((s) => s.clearCompany)

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(schema) })

  const apiError = error
    ? ((error as any)?.response?.data?.message ?? 'Login failed. Please try again.')
    : null

  return (
    <View className="flex-1 bg-white">
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center px-6 py-12 gap-y-8">
          {/* Header */}
          <View className="gap-y-1">
            <Text className="text-3xl font-bold text-gray-900">Welcome back</Text>
            <Text className="text-base text-gray-500">Sign in to your account</Text>
          </View>

          {/* Fields */}
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

            <View className="gap-y-1">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-medium text-gray-700">Password</Text>
                <Link href="/(auth)/forgot-password" asChild>
                  <Pressable>
                    <Text className="text-sm text-blue-600">Forgot password?</Text>
                  </Pressable>
                </Link>
              </View>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <PasswordInput
                    placeholder="Enter your password"
                    autoComplete="password"
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
          </View>

          {/* Submit */}
          <Button
            label={isPending ? 'Signing in…' : 'Sign In'}
            variant="default"
            size="lg"
            onPress={handleSubmit((data) => login(data))}
            disabled={isPending}
          />

          {/* Footer */}
          <View className="flex-row items-center justify-center gap-x-1">
            <Text className="text-sm text-gray-500">Don't have an account?</Text>
            <Link href="/(auth)/register" asChild>
              <Pressable>
                <Text className="text-sm font-semibold text-blue-600">Register</Text>
              </Pressable>
            </Link>
          </View>

          {!!companyName && (
            <Pressable
              className="items-center"
              onPress={() => {
                clearCompany()
                router.replace('/(auth)/company')
              }}
            >
              <Text className="text-xs text-gray-400">
                Not <Text className="font-semibold text-gray-500">{companyName}</Text>? Change company
              </Text>
            </Pressable>
          )}
        </View>
      </KeyboardAwareScrollView>
    </View>
  )
}
