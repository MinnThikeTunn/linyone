import { supabase } from '@/lib/supabase'

export type NotificationRecord = {
  id: string
  user_id: string
  type: string
  title?: string | null
  body?: string | null
  payload?: any
  read: boolean
  created_at: string
}

export async function createNotification(params: {
  userId: string
  type: string
  title?: string
  body?: string
  payload?: any
}) {
  const { userId, type, title, body, payload } = params
  const { data, error } = await supabase
    .from('notifications')
    .insert({ user_id: userId, type, title, body, payload })
    .select()

  if (error) {
    console.error('createNotification error', error)
    return { success: false, error }
  }
  return { success: true, data: data?.[0] as NotificationRecord }
}

export async function getNotifications(userId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getNotifications error', error)
    return [] as NotificationRecord[]
  }
  return (data ?? []) as NotificationRecord[]
}

export function subscribeToNotifications(
  userId: string,
  cb: (n: NotificationRecord) => void,
  options?: { channelId?: string }
) {
  // Use unique channel name to avoid collisions when multiple components subscribe
  const uniqueSuffix = (() => {
    try {
      // @ts-ignore
      if (typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function') {
        // @ts-ignore
        return (crypto as any).randomUUID()
      }
    } catch {}
    return Math.random().toString(36).slice(2)
  })()
  const channelName = options?.channelId ?? `notifications:${userId}:${uniqueSuffix}`

  const channel = supabase
    .channel(channelName)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`
    }, (payload) => {
      cb(payload.new as NotificationRecord)
    })
    .subscribe()

  return channel
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id)
  if (error) throw error
  return true
}

export async function markAllNotificationsRead(userId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false)
  if (error) throw error
  return true
}

export async function deleteNotification(id: string) {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id)
  if (error) throw error
  return true
}

export async function deleteAllNotifications(userId: string) {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', userId)
  if (error) throw error
  return true
}
