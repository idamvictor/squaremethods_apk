import * as React from 'react'
import { useEffect, useRef, useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import { cn } from '@/lib/utils'

const RESEND_TIMEOUT = 270 // 4 min 30 sec

interface OtpInputProps {
  value: string
  onChange: (value: string) => void
  onResend: () => void
  isResending?: boolean
}

export function OtpInput({ value, onChange, onResend, isResending }: OtpInputProps) {
  const [seconds, setSeconds] = useState(RESEND_TIMEOUT)
  const inputRefs = useRef<(TextInput | null)[]>([])

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(timer)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleResend = () => {
    setSeconds(RESEND_TIMEOUT)
    onResend()
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const digits = value.padEnd(6, '').split('').slice(0, 6)

  const handleChange = (text: string, index: number) => {
    const digit = text.replace(/[^0-9]/g, '').slice(-1)
    const next = [...digits]
    next[index] = digit
    onChange(next.join('').replace(/ /g, ''))
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      const next = [...digits]
      next[index - 1] = ''
      onChange(next.join('').replace(/ /g, ''))
      inputRefs.current[index - 1]?.focus()
    }
  }

  return (
    <View className="gap-y-5">
      <View className="flex-row justify-between gap-x-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <TextInput
            key={i}
            ref={(el) => {
              inputRefs.current[i] = el
            }}
            value={digits[i] === ' ' ? '' : digits[i]}
            onChangeText={(text) => handleChange(text, i)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
            keyboardType="numeric"
            maxLength={1}
            selectTextOnFocus
            className={cn(
              'h-14 flex-1 rounded-xl border text-center text-xl font-bold text-gray-900',
              digits[i] && digits[i] !== ' '
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white'
            )}
          />
        ))}
      </View>

      <View className="items-center">
        {seconds > 0 ? (
          <Text className="text-sm text-gray-400">
            Resend code in{' '}
            <Text className="font-semibold text-gray-600">{formatTime(seconds)}</Text>
          </Text>
        ) : (
          <Pressable onPress={handleResend} disabled={isResending}>
            <Text className="text-sm font-semibold text-blue-600">
              {isResending ? 'Sending...' : 'Resend Code'}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  )
}
