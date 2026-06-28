import { v4 as uuidv4 } from 'uuid'
import { supabase, isSupabaseConfigured } from './supabase'
import type { Profile, TimelineEvent } from '../types'

// ─── Workspace ID ─────────────────────────────────────────────────────────────
// L'ID d'espace de travail identifie un utilisateur sans authentification.
// Stocké en localStorage, il peut être partagé entre appareils (si Supabase).

export function getWorkspaceId(): string {
  let id = localStorage.getItem('frise_workspace_id')
  if (!id) {
    id = uuidv4()
    localStorage.setItem('frise_workspace_id', id)
  }
  return id
}

export function setWorkspaceId(id: string): void {
  localStorage.setItem('frise_workspace_id', id)
}

// ─── Profils ──────────────────────────────────────────────────────────────────

export async function getProfiles(): Promise<Profile[]> {
  const workspaceId = getWorkspaceId()

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data ?? []) as Profile[]
  }

  const raw = localStorage.getItem(`frise_profiles_${workspaceId}`)
  return raw ? (JSON.parse(raw) as Profile[]) : []
}

export async function createProfile(name: string): Promise<Profile> {
  const workspaceId = getWorkspaceId()

  const profile: Profile = {
    id: uuidv4(),
    workspace_id: workspaceId,
    name,
    created_at: new Date().toISOString(),
  }

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('profiles')
      .insert(profile)
      .select()
      .single()
    if (error) throw error
    return data as Profile
  }

  const existing = await getProfiles()
  localStorage.setItem(
    `frise_profiles_${workspaceId}`,
    JSON.stringify([...existing, profile])
  )
  return profile
}

export async function deleteProfile(id: string): Promise<void> {
  const workspaceId = getWorkspaceId()

  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('profiles').delete().eq('id', id)
    if (error) throw error
    return
  }

  const existing = await getProfiles()
  localStorage.setItem(
    `frise_profiles_${workspaceId}`,
    JSON.stringify(existing.filter((p) => p.id !== id))
  )
  localStorage.removeItem(`frise_events_${id}`)
}

// ─── Événements ───────────────────────────────────────────────────────────────

export async function getEvents(profileId: string): Promise<TimelineEvent[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('timeline_events')
      .select('*')
      .eq('profile_id', profileId)
      .order('year', { ascending: true })
    if (error) throw error
    return (data ?? []) as TimelineEvent[]
  }

  const raw = localStorage.getItem(`frise_events_${profileId}`)
  const events: TimelineEvent[] = raw ? JSON.parse(raw) : []
  return events.sort((a, b) => a.year - b.year)
}

export async function createEvent(
  event: Omit<TimelineEvent, 'id' | 'created_at'>
): Promise<TimelineEvent> {
  const newEvent: TimelineEvent = {
    ...event,
    id: uuidv4(),
    created_at: new Date().toISOString(),
  }

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('timeline_events')
      .insert(newEvent)
      .select()
      .single()
    if (error) throw error
    return data as TimelineEvent
  }

  const existing = await getEvents(event.profile_id)
  localStorage.setItem(
    `frise_events_${event.profile_id}`,
    JSON.stringify([...existing, newEvent])
  )
  return newEvent
}

export async function updateEvent(event: TimelineEvent): Promise<TimelineEvent> {
  if (isSupabaseConfigured && supabase) {
    const { id, profile_id, created_at, ...fields } = event
    void profile_id
    void created_at
    const { data, error } = await supabase
      .from('timeline_events')
      .update(fields)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as TimelineEvent
  }

  const existing = await getEvents(event.profile_id)
  const updated = existing.map((e) => (e.id === event.id ? event : e))
  localStorage.setItem(`frise_events_${event.profile_id}`, JSON.stringify(updated))
  return event
}

export async function deleteEvent(id: string, profileId: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('timeline_events').delete().eq('id', id)
    if (error) throw error
    return
  }

  const existing = await getEvents(profileId)
  localStorage.setItem(
    `frise_events_${profileId}`,
    JSON.stringify(existing.filter((e) => e.id !== id))
  )
}
