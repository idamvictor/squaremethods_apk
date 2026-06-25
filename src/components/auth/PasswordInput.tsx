import * as React from 'react'
import { useState } from 'react'
import { Pressable, Text, View, type TextInputProps } from 'react-native'
import { Input } from '@/components/ui/input'

type PasswordInputProps = Omit<TextInputProps, 'secureTextEntry'> & {
  error?: boolean
}

export function PasswordInput({ error, className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false)

  return (
    <View className="relative">
      <Input
        secureTextEntry={!visible}
        error={error}
        className={className}
        {...props}
      />
      <Pressable
        onPress={() => setVisible((v) => !v)}
        className="absolute right-4 top-3.5"
        hitSlop={8}
        accessibilityLabel={visible ? 'Hide password' : 'Show password'}
      >
        <Text className="text-sm font-medium text-blue-500">
          {visible ? 'Hide' : 'Show'}
        </Text>
      </Pressable>
    </View>
  )
}
