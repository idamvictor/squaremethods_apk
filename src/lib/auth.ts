import { useMutation } from '@tanstack/react-query'
import { router } from 'expo-router'
import apiClient from '@/lib/axios'
import { useAuthStore } from '@/store/auth-store'
import type {
  AuthResponse,
  LoginInput,
  RegisterInput,
  OtpPayload,
  ForgotPasswordInput,
  ResetPasswordInput,
} from '@/types/auth'

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth)

  return useMutation({
    mutationFn: async (data: LoginInput) => {
      const res = await apiClient.post<AuthResponse>('/auth/login', data)
      return res.data
    },
    onSuccess: async ({ data }) => {
      await setAuth(data.token, data.user, data.company)
      router.replace('/home')
    },
  })
}

export function useRegister() {
  return useMutation({
    mutationFn: async (data: RegisterInput) => {
      const res = await apiClient.post('/auth/register', {
        ...data,
        phone: data.phone ?? 'Not provided',
        company_address: data.company_address ?? 'Not provided',
      })
      return res.data
    },
  })
}

export function useSendOtp() {
  return useMutation({
    mutationFn: async (data: Pick<OtpPayload, 'email'>) => {
      const res = await apiClient.post('/auth/send-otp', { email: data.email })
      return res.data
    },
  })
}

export function useVerifyOtp() {
  return useMutation({
    mutationFn: async (data: OtpPayload) => {
      const res = await apiClient.post('/auth/verify-otp', data)
      return res.data
    },
    onSuccess: () => {
      router.replace('/(auth)/login')
    },
  })
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (data: ForgotPasswordInput) => {
      const res = await apiClient.post('/auth/forgot-password', data)
      return res.data
    },
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (data: ResetPasswordInput) => {
      const res = await apiClient.post('/auth/reset-password', data)
      return res.data
    },
    onSuccess: () => {
      router.replace('/(auth)/login')
    },
  })
}
