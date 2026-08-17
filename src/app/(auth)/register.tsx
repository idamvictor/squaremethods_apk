import { useState } from 'react'
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
import { OtpInput } from '@/components/auth/OtpInput'
import { useRegister, useSendOtp, useVerifyOtp } from '@/lib/auth'

const passwordSchema = z
  .string()
  .min(8, 'At least 8 characters')
  .regex(/[A-Z]/, 'At least 1 uppercase letter')
  .regex(/[a-z]/, 'At least 1 lowercase letter')
  .regex(/[0-9]/, 'At least 1 number')
  .regex(/[^A-Za-z0-9]/, 'At least 1 special character')

const schema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  company_name: z.string().min(1, 'Company name is required'),
  email: z.string().email('Enter a valid email address'),
  password: passwordSchema,
})

type RegisterForm = z.infer<typeof schema>

export default function RegisterScreen() {
  const [step, setStep] = useState<'form' | 'otp'>('form')
  const [registeredEmail, setRegisteredEmail] = useState('')
  const [otp, setOtp] = useState('')

  const { mutate: register, isPending: isRegistering, error: registerError } = useRegister()
  const { mutate: sendOtp, isPending: isSendingOtp } = useSendOtp()
  const { mutate: verifyOtp, isPending: isVerifying, error: otpError } = useVerifyOtp()

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({ resolver: zodResolver(schema) })

  const onSubmit = (data: RegisterForm) => {
    setRegisteredEmail(data.email)
    register(
      {
        first_name: data.first_name,
        last_name: data.last_name,
        company_name: data.company_name,
        email: data.email,
        password: data.password,
      },
      {
        onSuccess: (res) => {
          if (res.emailVerificationRequired === false) {
            router.replace('/(auth)/login')
          } else {
            setStep('otp')
          }
        },
      }
    )
  }

  const apiError = registerError
    ? ((registerError as any)?.response?.data?.message ?? 'Registration failed.')
    : null

  const otpApiError = otpError
    ? ((otpError as any)?.response?.data?.message ?? 'Verification failed.')
    : null

  // ── OTP step ──────────────────────────────────────────────────────────
  if (step === 'otp') {
    return (
      <View className="flex-1 bg-white">
        <KeyboardAwareScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 justify-center px-6 py-12 gap-y-8">
            <View className="gap-y-1">
              <Text className="text-3xl font-bold text-gray-900">Verify your email</Text>
              <Text className="text-base text-gray-500">
                Enter the 6-digit code sent to{' '}
                <Text className="font-semibold text-gray-700">{registeredEmail}</Text>
              </Text>
            </View>

            {otpApiError && (
              <View className="rounded-xl border border-red-200 bg-red-50 p-3">
                <Text className="text-sm text-red-600">{otpApiError}</Text>
              </View>
            )}

            <OtpInput
              value={otp}
              onChange={setOtp}
              onResend={() => sendOtp({ email: registeredEmail })}
              isResending={isSendingOtp}
            />

            <Button
              label={isVerifying ? 'Verifying…' : 'Verify Email'}
              variant="default"
              size="lg"
              onPress={() => {
                if (otp.replace(/ /g, '').length === 6) {
                  verifyOtp({ email: registeredEmail, otp: otp.replace(/ /g, '') })
                }
              }}
              disabled={isVerifying || otp.replace(/ /g, '').length < 6}
            />

            <Pressable onPress={() => setStep('form')} className="items-center">
              <Text className="text-sm text-gray-400">← Back to registration</Text>
            </Pressable>
          </View>
        </KeyboardAwareScrollView>
      </View>
    )
  }

  // ── Registration form ─────────────────────────────────────────────────
  return (
    <View className="flex-1 bg-white">
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center px-6 py-12 gap-y-8">
          <View className="gap-y-1">
            <Text className="text-3xl font-bold text-gray-900">Create account</Text>
            <Text className="text-base text-gray-500">Join Squaremethods today</Text>
          </View>

          <View className="gap-y-4">
            {apiError && (
              <View className="rounded-xl border border-red-200 bg-red-50 p-3">
                <Text className="text-sm text-red-600">{apiError}</Text>
              </View>
            )}

            {/* First + Last name row */}
            <View className="flex-row gap-x-3">
              <View className="flex-1 gap-y-1">
                <Text className="text-sm font-medium text-gray-700">First Name</Text>
                <Controller
                  control={control}
                  name="first_name"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      placeholder="John"
                      autoComplete="given-name"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      error={!!errors.first_name}
                    />
                  )}
                />
                {errors.first_name && (
                  <Text className="text-xs text-red-500">{errors.first_name.message}</Text>
                )}
              </View>

              <View className="flex-1 gap-y-1">
                <Text className="text-sm font-medium text-gray-700">Last Name</Text>
                <Controller
                  control={control}
                  name="last_name"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      placeholder="Doe"
                      autoComplete="family-name"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      error={!!errors.last_name}
                    />
                  )}
                />
                {errors.last_name && (
                  <Text className="text-xs text-red-500">{errors.last_name.message}</Text>
                )}
              </View>
            </View>

            <View className="gap-y-1">
              <Text className="text-sm font-medium text-gray-700">Company Name</Text>
              <Controller
                control={control}
                name="company_name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    placeholder="Acme Inc."
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={!!errors.company_name}
                  />
                )}
              />
              {errors.company_name && (
                <Text className="text-xs text-red-500">{errors.company_name.message}</Text>
              )}
            </View>

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
              <Text className="text-sm font-medium text-gray-700">Password</Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <PasswordInput
                    placeholder="Create a strong password"
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
          </View>

          <Button
            label={isRegistering ? 'Creating account…' : 'Create Account'}
            variant="default"
            size="lg"
            onPress={handleSubmit(onSubmit)}
            disabled={isRegistering}
          />

          <View className="flex-row items-center justify-center gap-x-1">
            <Text className="text-sm text-gray-500">Already have an account?</Text>
            <Link href="/(auth)/login" asChild>
              <Pressable>
                <Text className="text-sm font-semibold text-blue-600">Sign In</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </View>
  )
}
