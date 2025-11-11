import { supabase } from '@/lib/supabase'

type FamilyLink = {
  id: string
  user_id: string
  member_id: string
  relation?: string | null
}

type UserShort = {
  id: string
  name?: string | null
  phone?: string | null
}

export async function fetchFamilyMembers(userId: string) {
  // 1) fetch links
  try {
    const { data: links, error } = await supabase
      .from('family_members')
      .select('*')
      .eq('user_id', userId)

    if (error) {
      // Log detailed information to help debugging schema/type mismatches
      console.error('supabase fetch family_members error', {
        message: error.message,
        details: (error as any).details,
        hint: (error as any).hint,
        code: (error as any).code,
      })
      return []
    }

    const memberIds = links?.map((l: any) => l.member_id) ?? []
    if (memberIds.length === 0) return []

    const { data: users, error: uErr } = await supabase
      .from('users')
      .select('id,name,phone')
      .in('id', memberIds)

    if (uErr) {
      console.error('supabase fetch users error', {
        message: uErr.message,
        details: (uErr as any).details,
        hint: (uErr as any).hint,
        code: (uErr as any).code,
      })
      return links!.map((l: any) => ({ id: l.id, relation: l.relation, member: { id: l.member_id } }))
    }

    // Map back to links with user info
    const result = (links as any[]).map((l) => ({
      id: l.id,
      relation: l.relation,
      member: (users as any[])?.find((u) => u.id === l.member_id) ?? { id: l.member_id }
    }))

    return result
  } catch (err: any) {
    // Defensive: supabase may throw or return unusual error objects. Provide useful logs and return empty.
    console.error('unexpected error in fetchFamilyMembers', {
      message: err?.message ?? String(err),
      stack: err?.stack,
      raw: err,
    })
    return []
  }
}

export async function sendMessage(senderId: string, receiverId: string, content: string) {
  const { data, error } = await supabase
    .from('messages')
    .insert({ sender_id: senderId, receiver_id: receiverId, content, status: 'sent' })
    .select()

  if (error) throw error
  return data?.[0]
}

export async function addFamilyMember(userId: string, phone: string, name?: string, relation?: string) {
  // Backwards-compatible: treat the phone arg as an identifier and try to resolve
  return addFamilyMemberByIdentifier(userId, phone, name, relation)
}

export async function addFamilyMemberByIdentifier(userId: string, identifier: string, name?: string, relation?: string) {
  try {
    const found = await findUsers(identifier)
    const u = (found && found.length > 0) ? found[0] : null
    if (!u) return { success: false, error: 'member_not_found' }
    return addFamilyMemberById(userId, u.id, relation)
  } catch (err: any) {
    console.error('unexpected error addFamilyMemberByIdentifier', err)
    return { success: false, error: err }
  }
}

export async function addFamilyMemberById(userId: string, memberId: string, relation?: string) {
  try {
    // prevent duplicate links
    const { data: existing, error: eErr } = await supabase
      .from('family_members')
      .select('id')
      .eq('user_id', userId)
      .eq('member_id', memberId)
      .limit(1)

    if (eErr) {
      console.error('error checking existing family_members', eErr)
      // continue to attempt insert; caller will see insert error if any
    }
    if (existing && existing.length > 0) {
      return { success: false, error: 'already_linked' }
    }
    const { data, error } = await supabase
      .from('family_members')
      .insert({ user_id: userId, member_id: memberId, relation })
      .select()

    if (error) {
      console.error('error inserting family_members', error)
      return { success: false, error }
    }

    return { success: true, data: data?.[0] }
  } catch (err: any) {
    console.error('unexpected error addFamilyMemberById', err)
    return { success: false, error: err }
  }
}

export async function removeFamilyMemberById(userId: string, memberId: string) {
  try {
    const { error } = await supabase
      .from('family_members')
      .delete()
      .eq('user_id', userId)
      .eq('member_id', memberId)

    if (error) {
      console.error('error deleting family_members', error)
      return { success: false, error }
    }

    return { success: true }
  } catch (err: any) {
    console.error('unexpected error removeFamilyMemberById', err)
    return { success: false, error: err }
  }
}

// ============================================
// FAMILY REQUEST FUNCTIONS
// ============================================

export async function sendFamilyRequest(fromUserId: string, toUserId: string, relation: string) {
  try {
    // Check if already linked
    const { data: existing } = await supabase
      .from('family_members')
      .select('id')
      .eq('user_id', fromUserId)
      .eq('member_id', toUserId)
      .limit(1)

    if (existing && existing.length > 0) {
      return { success: false, error: 'already_linked' }
    }

    // Check if pending request already exists
    const { data: pendingReq } = await supabase
      .from('family_requests')
      .select('id')
      .eq('from_user_id', fromUserId)
      .eq('to_user_id', toUserId)
      .eq('status', 'pending')
      .limit(1)

    if (pendingReq && pendingReq.length > 0) {
      return { success: false, error: 'request_already_sent' }
    }

    const { data, error } = await supabase
      .from('family_requests')
      .insert({ 
        from_user_id: fromUserId, 
        to_user_id: toUserId, 
        relation,
        status: 'pending'
      })
      .select()

    if (error) {
      console.error('error creating family_request', error)
      return { success: false, error }
    }

    return { success: true, data: data?.[0] }
  } catch (err: any) {
    console.error('unexpected error sendFamilyRequest', err)
    return { success: false, error: err }
  }
}

export async function getPendingFamilyRequests(userId: string) {
  try {
    const { data: requests, error } = await supabase
      .from('family_requests')
      .select('*')
      .eq('to_user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('error fetching pending family_requests', {
        message: error.message,
        details: (error as any).details,
        hint: (error as any).hint,
        code: (error as any).code,
      })
      // Table might not exist yet - return empty array
      return []
    }

    if (!requests || requests.length === 0) return []

    // Fetch sender details
    const senderIds = requests.map((r: any) => r.from_user_id)
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id,name,phone,email')
      .in('id', senderIds)

    if (usersError) {
      console.error('error fetching users for family_requests', usersError)
      // Return requests without user details
      return requests.map((r: any) => ({
        id: r.id,
        from_user_id: r.from_user_id,
        to_user_id: r.to_user_id,
        relation: r.relation,
        status: r.status,
        created_at: r.created_at,
        sender: { id: r.from_user_id, name: 'Unknown' }
      }))
    }

    // Map requests with sender info
    return requests.map((r: any) => ({
      id: r.id,
      from_user_id: r.from_user_id,
      to_user_id: r.to_user_id,
      relation: r.relation,
      status: r.status,
      created_at: r.created_at,
      sender: (users as any[])?.find((u) => u.id === r.from_user_id) ?? { id: r.from_user_id }
    }))
  } catch (err: any) {
    console.error('unexpected error getPendingFamilyRequests', err)
    return []
  }
}

export async function approveFamilyRequest(requestId: string) {
  try {
    // Get the request details
    const { data: request, error: fetchErr } = await supabase
      .from('family_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (fetchErr || !request) {
      console.error('error fetching request', fetchErr)
      return { success: false, error: 'request_not_found' }
    }

    // Create bidirectional family links
    const { error: link1Err } = await supabase
      .from('family_members')
      .insert({ 
        user_id: request.from_user_id, 
        member_id: request.to_user_id, 
        relation: request.relation 
      })

    const { error: link2Err } = await supabase
      .from('family_members')
      .insert({ 
        user_id: request.to_user_id, 
        member_id: request.from_user_id, 
        relation: getReciprocalRelation(request.relation)
      })

    if (link1Err || link2Err) {
      console.error('error creating family links', { link1Err, link2Err })
      return { success: false, error: link1Err || link2Err }
    }

    // Update request status to approved
    const { error: updateErr } = await supabase
      .from('family_requests')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', requestId)

    if (updateErr) {
      console.error('error updating request status', updateErr)
    }

    return { success: true }
  } catch (err: any) {
    console.error('unexpected error approveFamilyRequest', err)
    return { success: false, error: err }
  }
}

export async function rejectFamilyRequest(requestId: string) {
  try {
    const { error } = await supabase
      .from('family_requests')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', requestId)

    if (error) {
      console.error('error rejecting request', error)
      return { success: false, error }
    }

    // Optionally delete rejected requests
    await supabase
      .from('family_requests')
      .delete()
      .eq('id', requestId)

    return { success: true }
  } catch (err: any) {
    console.error('unexpected error rejectFamilyRequest', err)
    return { success: false, error: err }
  }
}

// Helper to get reciprocal relation
function getReciprocalRelation(relation: string): string {
  const relationMap: { [key: string]: string } = {
    'father': 'son/daughter',
    'mother': 'son/daughter',
    'son': 'father/mother',
    'daughter': 'father/mother',
    'brother': 'brother/sister',
    'sister': 'brother/sister',
    'husband': 'wife',
    'wife': 'husband',
    'grandfather': 'grandson/granddaughter',
    'grandmother': 'grandson/granddaughter',
    'uncle': 'nephew/niece',
    'aunt': 'nephew/niece',
  }

  return relationMap[relation.toLowerCase()] || 'family'
}

export async function findUsers(identifier: string) {
  try {
    if (!identifier) return []
    // Try exact phone
    const phoneRes = await supabase.from('users').select('id,name,email,phone').eq('phone', identifier).limit(10)
    if (phoneRes.error) {
      // log and continue
      console.warn('findUsers phone query error', phoneRes.error)
    }
    if (phoneRes.data && phoneRes.data.length) return phoneRes.data

    // Try exact email
    const emailRes = await supabase.from('users').select('id,name,email,phone').eq('email', identifier).limit(10)
    if (emailRes.error) {
      console.warn('findUsers email query error', emailRes.error)
    }
    if (emailRes.data && emailRes.data.length) return emailRes.data

    // Fallback: name search (ILIKE contains)
    const nameRes = await supabase.from('users').select('id,name,email,phone').ilike('name', `%${identifier}%`).limit(10)
    if (nameRes.error) {
      console.warn('findUsers name query error', nameRes.error)
    }
    return nameRes.data ?? []
  } catch (err: any) {
    console.error('unexpected error findUsers', err)
    return []
  }
}

export async function fetchUnreadCount(userId: string) {
  const { count, error } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: false })
    .eq('receiver_id', userId)
    .neq('status', 'read')

  if (error) throw error
  return count ?? 0
}

export function subscribeToIncomingMessages(userId: string, cb: (msg: any) => void) {
  const channel = supabase
    .channel('public:messages')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${userId}` }, (payload) => {
      cb(payload.new)
    })
    .subscribe()

  return channel
}

export async function markAllAsRead(userId: string) {
  const { error } = await supabase
    .from('messages')
    .update({ status: 'read' })
    .eq('receiver_id', userId)
    .neq('status', 'read')

  if (error) throw error
  return true
}

// Conversation helpers
export async function fetchConversation(userId: string, otherId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(
      `and(sender_id.eq.${userId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${userId})`
    )
    .order('created_at', { ascending: true })

  if (error) throw error
  return data ?? []
}

export function subscribeToConversation(userId: string, otherId: string, cb: (msg: any) => void) {
  // Subscribe broadly to messages INSERTs and filter in the callback for the two participants
  const channel = supabase
    .channel(`conversation:${[userId, otherId].sort().join(':')}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
      const m = payload.new
      const isBetween = (m.sender_id === userId && m.receiver_id === otherId) || (m.sender_id === otherId && m.receiver_id === userId)
      if (isBetween) cb(m)
    })
    .subscribe()

  return channel
}

export async function markConversationAsRead(userId: string, otherId: string) {
  const { error } = await supabase
    .from('messages')
    .update({ status: 'read' })
    .eq('receiver_id', userId)
    .eq('sender_id', otherId)
    .neq('status', 'read')

  if (error) throw error
  return true
}
