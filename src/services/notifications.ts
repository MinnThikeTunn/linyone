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
  options?: { channelId?: string; onDelete?: (id: string) => void; onUpdate?: (n: NotificationRecord) => void }
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
    .on('postgres_changes', {
      event: 'DELETE',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`
    }, (payload) => {
      // Notify about deleted notification
      if (options?.onDelete) {
        options.onDelete(payload.old.id)
      }
    })
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`
    }, (payload) => {
      // Notify about updated notification (e.g., marked as read)
      if (options?.onUpdate) {
        options.onUpdate(payload.new as NotificationRecord)
      }
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

// Delete notifications by request_id (for family requests)
export async function deleteNotificationsByRequestId(userId: string, requestId: string) {
  try {
    // First, try to fetch all family_request notifications for this user
    // Filter in JavaScript since JSONB queries can be complex
    const { data: allNotifications, error: fetchError } = await supabase
      .from('notifications')
      .select('id, payload')
      .eq('user_id', userId)
      .eq('type', 'family_request')

    if (fetchError) {
      console.error('failed to find notifications by request_id', fetchError)
      return { success: false, error: fetchError }
    }

    if (!allNotifications || allNotifications.length === 0) {
      // No notifications found - this is okay
      return { success: true, deleted: 0, notificationIds: [] }
    }

    // Filter notifications that match the request_id
    const matchingNotifications = allNotifications.filter((n: any) => {
      try {
        const payload = typeof n.payload === 'string' ? JSON.parse(n.payload) : n.payload
        return payload?.request_id === requestId
      } catch {
        return false
      }
    })

    if (matchingNotifications.length === 0) {
      // No matching notifications found
      return { success: true, deleted: 0, notificationIds: [] }
    }

    // Delete all matching notifications
    const notificationIds = matchingNotifications.map((n: any) => n.id)
    
    console.log(`[deleteNotificationsByRequestId] Attempting to delete ${notificationIds.length} notification(s) for request ${requestId}:`, notificationIds)
    
    const { error: deleteError, data: deletedData } = await supabase
      .from('notifications')
      .delete()
      .in('id', notificationIds)
      .select()

    if (deleteError) {
      console.error(`[deleteNotificationsByRequestId] Failed to delete notifications for request ${requestId}:`, deleteError)
      return { success: false, error: deleteError, notificationIds: [] }
    }

    console.log(`[deleteNotificationsByRequestId] Deleted ${deletedData?.length || 0} notification(s) from database for request ${requestId}`)

    // Wait a bit for database to process deletion
    await new Promise(resolve => setTimeout(resolve, 100))

    // Verify deletion by checking if notifications still exist
    const { data: verifyNotifications, error: verifyError } = await supabase
      .from('notifications')
      .select('id')
      .in('id', notificationIds)

    if (verifyError) {
      console.warn(`[deleteNotificationsByRequestId] Failed to verify deletion for request ${requestId}:`, verifyError)
    } else if (verifyNotifications && verifyNotifications.length > 0) {
      console.warn(`[deleteNotificationsByRequestId] Some notifications were not deleted for request ${requestId}:`, verifyNotifications.map((n: any) => n.id).join(', '))
      // Try to delete again
      const remainingIds = verifyNotifications.map((n: any) => n.id)
      const { error: retryError } = await supabase
        .from('notifications')
        .delete()
        .in('id', remainingIds)
      
      if (retryError) {
        console.error(`[deleteNotificationsByRequestId] Failed to delete remaining notifications on retry for request ${requestId}:`, retryError)
        return { success: false, error: retryError, notificationIds: notificationIds.filter(id => !remainingIds.includes(id)) }
      } else {
        console.log(`[deleteNotificationsByRequestId] Successfully deleted ${remainingIds.length} remaining notification(s) on retry for request ${requestId}`)
      }
    } else {
      console.log(`[deleteNotificationsByRequestId] Verified: All ${notificationIds.length} notification(s) deleted for request ${requestId}`)
    }

    console.log(`[deleteNotificationsByRequestId] Successfully deleted ${notificationIds.length} notification(s) for request ${requestId}`)
    return { success: true, deleted: notificationIds.length, notificationIds: notificationIds }
  } catch (err: any) {
    console.error('unexpected error deleteNotificationsByRequestId', err)
    return { success: false, error: err, deleted: 0, notificationIds: [] }
  }
}
