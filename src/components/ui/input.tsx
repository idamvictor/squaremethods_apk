import * as React from 'react'
import { TextInput, type TextInputProps } from 'react-native'
import { cn } from '@/lib/utils'

type InputProps = TextInputProps & {
  error?: boolean
}

function Input({ className, error, ...props }: InputProps) {
  return (
    <TextInput
      className={cn(
        'h-12 w-full rounded-xl border bg-white px-4 text-base text-gray-900',
        error ? 'border-red-400' : 'border-gray-200',
        className
      )}
      placeholderTextColor="#9CA3AF"
      {...props}
    />
  )
}

export { Input }
