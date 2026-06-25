import * as React from 'react'
import { Text, View } from 'react-native'
import { StatusBadge, PriorityBadge } from '@/components/ui/badge'
import type { Job } from '@/services/jobs/jobs-types'

interface JobCardProps {
  job: Job
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export function JobCard({ job }: JobCardProps) {
  return (
    <View className="bg-white rounded-2xl p-4 gap-y-3 border border-gray-100">
      {/* Title row */}
      <View className="flex-row items-start justify-between gap-x-3">
        <Text className="flex-1 text-sm font-semibold text-gray-900" numberOfLines={2}>
          {job.title}
        </Text>
        <StatusBadge status={job.status} />
      </View>

      {/* Meta row */}
      <View className="flex-row items-center gap-x-3">
        <PriorityBadge priority={job.priority} />
        {job.equipment && (
          <Text className="text-xs text-gray-500" numberOfLines={1}>
            {job.equipment.name}
          </Text>
        )}
      </View>

      {/* Due date */}
      <Text className="text-xs text-gray-400">
        Due {formatDate(job.due_date)}
      </Text>
    </View>
  )
}
