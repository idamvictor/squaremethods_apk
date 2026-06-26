import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useInviteUsers } from '@/services/users/users-queries'
import {
  useInvitations,
  useRevokeInvitation,
  useGenerateInvitationLink,
} from '@/services/invitations/invitations-queries'
import { BottomSheetPicker } from '@/components/ui/bottom-sheet-picker'
import type { Invitation } from '@/services/invitations/invitations-types'

const ROLE_ITEMS = [
  { label: 'Owner', value: 'owner' },
  { label: 'Admin', value: 'admin' },
  { label: 'Editor', value: 'editor' },
  { label: 'Viewer', value: 'viewer' },
  { label: 'Technician', value: 'technician' },
]

function formatExpiry(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function InvitationCard({
  item,
  onRevoke,
  revoking,
}: {
  item: Invitation
  onRevoke: (id: string) => void
  revoking: boolean
}) {
  const recipients =
    item.emails && item.emails.length > 0
      ? item.emails.join(', ')
      : 'Public link'

  function handleRevoke() {
    Alert.alert('Revoke Invitation', 'This link will no longer work.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Revoke',
        style: 'destructive',
        onPress: () => onRevoke(item.id),
      },
    ])
  }

  return (
    <View className="bg-white rounded-2xl p-4 gap-y-2">
      <View className="flex-row items-center justify-between">
        <View className="bg-blue-50 rounded-full px-2.5 py-1">
          <Text className="text-xs font-medium text-blue-700 capitalize">{item.role}</Text>
        </View>
        <Text className="text-xs text-gray-400">Expires {formatExpiry(item.expires_at)}</Text>
      </View>

      <Text className="text-sm text-gray-700" numberOfLines={2}>
        {recipients}
      </Text>

      <View className="flex-row items-center justify-between">
        <Text className="text-xs text-gray-400">
          Used {item.used_count} time{item.used_count !== 1 ? 's' : ''}
          {item.max_uses != null ? ` of ${item.max_uses}` : ''}
        </Text>
        <Pressable
          onPress={handleRevoke}
          disabled={revoking}
          hitSlop={8}
          className="active:opacity-60"
        >
          <Text className="text-xs font-medium text-red-500">Revoke</Text>
        </Pressable>
      </View>
    </View>
  )
}

export default function InviteScreen() {
  const insets = useSafeAreaInsets()

  // Send form state
  const [emails, setEmails] = useState('')
  const [role, setRole] = useState('')
  const [expiryDays, setExpiryDays] = useState('7')
  const [showRolePicker, setShowRolePicker] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Generate link state
  const [showGenerateForm, setShowGenerateForm] = useState(false)
  const [genRole, setGenRole] = useState('')
  const [genExpiry, setGenExpiry] = useState('7')
  const [genMaxUses, setGenMaxUses] = useState('')
  const [showGenRolePicker, setShowGenRolePicker] = useState(false)
  const [genErrors, setGenErrors] = useState<Record<string, string>>({})

  // Hooks
  const { mutate: inviteUsers, isPending: sending, error: sendError } = useInviteUsers()
  const { mutate: revokeInvitation, isPending: revoking } = useRevokeInvitation()
  const { mutate: generateLink, isPending: generating } = useGenerateInvitationLink()
  const {
    data: invitationsData,
    isLoading: invLoading,
    refetch: refetchInvitations,
  } = useInvitations({ page: 1, limit: 20 })

  const sendErrorMsg =
    (sendError as any)?.response?.data?.message ?? (sendError as any)?.message ?? null
  const selectedRoleLabel = ROLE_ITEMS.find((r) => r.value === role)?.label ?? ''
  const selectedGenRoleLabel = ROLE_ITEMS.find((r) => r.value === genRole)?.label ?? ''
  const invitations = invitationsData?.data ?? []

  function validateSend() {
    const e: Record<string, string> = {}
    const emailList = emails.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean)
    if (emailList.length === 0) e.emails = 'At least one email is required'
    if (!role) e.role = 'Role is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSend() {
    if (!validateSend()) return
    const emailList = emails.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean)
    inviteUsers(
      { emails: emailList, role, expires_in_days: Number(expiryDays) || 7 },
      {
        onSuccess: () => {
          setEmails('')
          setRole('')
          setExpiryDays('7')
          setErrors({})
          Alert.alert('Invites sent!', `${emailList.length} invite${emailList.length > 1 ? 's' : ''} sent successfully.`)
          refetchInvitations()
        },
      },
    )
  }

  function validateGenerate() {
    const e: Record<string, string> = {}
    if (!genRole) e.genRole = 'Role is required'
    setGenErrors(e)
    return Object.keys(e).length === 0
  }

  function handleGenerate() {
    if (!validateGenerate()) return
    generateLink(
      {
        emails: [],
        role: genRole,
        expires_in_days: Number(genExpiry) || 7,
        max_uses: genMaxUses ? Number(genMaxUses) : undefined,
      },
      {
        onSuccess: (res) => {
          const link = res.data.link
          setShowGenerateForm(false)
          setGenRole('')
          setGenExpiry('7')
          setGenMaxUses('')
          Share.share({ message: `You've been invited to SquareMethods: ${link}` })
        },
      },
    )
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-gray-50"
    >
      <View style={{ height: insets.top }} className="bg-black" />

      <View className="bg-white border-b border-gray-100 px-4 pb-3 flex-row items-center gap-x-3">
        <Pressable onPress={() => router.back()} hitSlop={8} className="active:opacity-60">
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Invitations</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 32 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Send Invite card */}
        <View className="bg-white rounded-2xl p-4 gap-y-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-gray-900">Send Invite</Text>
            <Pressable
              onPress={() => setShowGenerateForm((v) => !v)}
              hitSlop={8}
              className="active:opacity-60"
            >
              <Text className="text-sm font-medium text-blue-600">
                {showGenerateForm ? 'Cancel' : 'Generate Link'}
              </Text>
            </Pressable>
          </View>

          {sendErrorMsg && (
            <View className="rounded-xl bg-red-50 border border-red-200 p-3">
              <Text className="text-sm text-red-600">{sendErrorMsg}</Text>
            </View>
          )}

          {!showGenerateForm ? (
            <>
              {/* Email(s) */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">
                  Email address(es) <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  value={emails}
                  onChangeText={(v) => { setEmails(v); setErrors((e) => ({ ...e, emails: '' })) }}
                  placeholder="email@example.com, email2@example.com"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  className={`rounded-xl border px-4 py-3 text-sm text-gray-800 bg-gray-50 min-h-[80px] ${
                    errors.emails ? 'border-red-400' : 'border-gray-200'
                  }`}
                  placeholderTextColor="#9CA3AF"
                />
                <Text className="text-xs text-gray-400 mt-1">Separate multiple emails with commas or new lines</Text>
                {!!errors.emails && <Text className="text-xs text-red-500 mt-1">{errors.emails}</Text>}
              </View>

              {/* Role */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">
                  Role <Text className="text-red-500">*</Text>
                </Text>
                <Pressable
                  onPress={() => setShowRolePicker(true)}
                  className={`h-12 rounded-xl border px-4 flex-row items-center justify-between bg-gray-50 ${
                    errors.role ? 'border-red-400' : 'border-gray-200'
                  }`}
                >
                  <Text className={`text-sm ${role ? 'text-gray-800' : 'text-gray-400'}`}>
                    {selectedRoleLabel || 'Select a role'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
                </Pressable>
                {!!errors.role && <Text className="text-xs text-red-500 mt-1">{errors.role}</Text>}
              </View>

              {/* Expiry */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">
                  Expires after (days)
                </Text>
                <TextInput
                  value={expiryDays}
                  onChangeText={setExpiryDays}
                  placeholder="7"
                  keyboardType="number-pad"
                  className="h-12 rounded-xl border border-gray-200 px-4 text-sm text-gray-800 bg-gray-50"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <Pressable
                onPress={handleSend}
                disabled={sending}
                className="h-12 bg-blue-600 rounded-xl items-center justify-center active:opacity-70"
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-sm font-semibold text-white">Send Invites</Text>
                )}
              </Pressable>
            </>
          ) : (
            /* Generate Link form */
            <>
              <Text className="text-xs text-gray-500">
                Generate a shareable link that anyone can use to join with the selected role.
              </Text>

              {/* Role */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">
                  Role <Text className="text-red-500">*</Text>
                </Text>
                <Pressable
                  onPress={() => setShowGenRolePicker(true)}
                  className={`h-12 rounded-xl border px-4 flex-row items-center justify-between bg-gray-50 ${
                    genErrors.genRole ? 'border-red-400' : 'border-gray-200'
                  }`}
                >
                  <Text className={`text-sm ${genRole ? 'text-gray-800' : 'text-gray-400'}`}>
                    {selectedGenRoleLabel || 'Select a role'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
                </Pressable>
                {!!genErrors.genRole && <Text className="text-xs text-red-500 mt-1">{genErrors.genRole}</Text>}
              </View>

              {/* Expiry */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">Expires after (days)</Text>
                <TextInput
                  value={genExpiry}
                  onChangeText={setGenExpiry}
                  placeholder="7"
                  keyboardType="number-pad"
                  className="h-12 rounded-xl border border-gray-200 px-4 text-sm text-gray-800 bg-gray-50"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Max uses */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">
                  Max uses <Text className="text-gray-400 font-normal">(leave blank for unlimited)</Text>
                </Text>
                <TextInput
                  value={genMaxUses}
                  onChangeText={setGenMaxUses}
                  placeholder="Unlimited"
                  keyboardType="number-pad"
                  className="h-12 rounded-xl border border-gray-200 px-4 text-sm text-gray-800 bg-gray-50"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <Pressable
                onPress={handleGenerate}
                disabled={generating}
                className="h-12 bg-blue-600 rounded-xl items-center justify-center active:opacity-70"
              >
                {generating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-sm font-semibold text-white">Generate & Share Link</Text>
                )}
              </Pressable>
            </>
          )}
        </View>

        {/* Pending Invitations */}
        <View className="gap-y-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-gray-900">
              Pending Invitations{invitations.length > 0 ? ` (${invitations.length})` : ''}
            </Text>
            {invLoading && <ActivityIndicator size="small" color="#208AEF" />}
          </View>

          {!invLoading && invitations.length === 0 && (
            <View className="bg-white rounded-2xl py-10 items-center gap-y-2">
              <Ionicons name="mail-outline" size={32} color="#D1D5DB" />
              <Text className="text-sm text-gray-400">No pending invitations</Text>
            </View>
          )}

          {invitations.map((inv) => (
            <InvitationCard
              key={inv.id}
              item={inv}
              onRevoke={(id) => revokeInvitation(id)}
              revoking={revoking}
            />
          ))}
        </View>
      </ScrollView>

      {/* Role pickers */}
      <BottomSheetPicker
        visible={showRolePicker}
        onClose={() => setShowRolePicker(false)}
        title="Select Role"
        items={ROLE_ITEMS}
        selected={role || null}
        onSelect={(v) => {
          setRole(v)
          setErrors((e) => ({ ...e, role: '' }))
          setShowRolePicker(false)
        }}
      />

      <BottomSheetPicker
        visible={showGenRolePicker}
        onClose={() => setShowGenRolePicker(false)}
        title="Select Role"
        items={ROLE_ITEMS}
        selected={genRole || null}
        onSelect={(v) => {
          setGenRole(v)
          setGenErrors((e) => ({ ...e, genRole: '' }))
          setShowGenRolePicker(false)
        }}
      />
    </KeyboardAvoidingView>
  )
}
