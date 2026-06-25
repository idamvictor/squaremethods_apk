import * as React from 'react'
import { Text, View } from 'react-native'
import { cn } from '@/lib/utils'
import type { JobStatus, JobPriority } from '@/services/jobs/jobs-types'

const statusConfig: Record<JobStatus, { label: string; className: string }> = {
  pending:     { label: 'Pending',     className: 'bg-yellow-100 text-yellow-700' },
  in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-700' },
  completed:   { label: 'Completed',   className: 'bg-green-100 text-green-700' },
  on_hold:     { label: 'On Hold',     className: 'bg-gray-100 text-gray-600' },
  cancelled:   { label: 'Cancelled',   className: 'bg-red-100 text-red-600' },
}

const priorityConfig: Record<JobPriority, { label: string; className: string }> = {
  urgent: { label: 'Urgent', className: 'bg-red-100 text-red-700' },
  high:   { label: 'High',   className: 'bg-orange-100 text-orange-700' },
  medium: { label: 'Medium', className: 'bg-yellow-100 text-yellow-700' },
  low:    { label: 'Low',    className: 'bg-green-100 text-green-700' },
}

interface StatusBadgeProps {
  status: JobStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]
  return (
    <View className={cn('rounded-full px-2.5 py-0.5', config.className, className)}>
      <Text className={cn('text-xs font-medium', config.className)}>{config.label}</Text>
    </View>
  )
}

interface PriorityBadgeProps {
  priority: JobPriority
  className?: string
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = priorityConfig[priority]
  return (
    <View className={cn('rounded-full px-2.5 py-0.5', config.className, className)}>
      <Text className={cn('text-xs font-medium', config.className)}>{config.label}</Text>
    </View>
  )
}
