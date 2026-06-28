import { useState, useEffect, useCallback } from 'react'
import { ProfileList } from './components/ProfileList'
import { Timeline } from './components/Timeline'
import { Settings } from './components/Settings'
import {
  getProfiles,
  createProfile,
  deleteProfile,
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getWorkspaceId,
  setWorkspaceId,
} from './lib/storage'
import type { Profile, TimelineEvent } from './types'

export default function App() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null)
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [profilesLoading, setProfilesLoading] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [workspaceId, setWid] = useState(getWorkspaceId())

  // Chargement des profils
  const loadProfiles = useCallback(async () => {
    setProfilesLoading(true)
    try {
      const data = await getProfiles()
      setProfiles(data)
    } catch (err) {
      console.error('Erreur chargement profils:', err)
    } finally {
      setProfilesLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProfiles()
  }, [loadProfiles, workspaceId])

  // Chargement des événements quand on entre dans un profil
  useEffect(() => {
    if (!currentProfile) {
      setEvents([])
      return
    }
    getEvents(currentProfile.id)
      .then(setEvents)
      .catch((err) => console.error('Erreur chargement événements:', err))
  }, [currentProfile])

  // ─── Actions profils ───────────────────────────────────────────────────────
  const handleCreateProfile = async (name: string) => {
    const profile = await createProfile(name)
    setProfiles((prev) => [...prev, profile])
  }

  const handleDeleteProfile = (id: string) => {
    const profile = profiles.find((p) => p.id === id)
    if (!profile) return
    if (!confirm(`Supprimer la frise « ${profile.name} » ? Tous les événements seront perdus.`))
      return
    deleteProfile(id)
      .then(() => setProfiles((prev) => prev.filter((p) => p.id !== id)))
      .catch((err) => console.error('Erreur suppression profil:', err))
  }

  // ─── Actions événements ────────────────────────────────────────────────────
  const handleAddEvent = async (data: Omit<TimelineEvent, 'id' | 'created_at'>) => {
    const newEvent = await createEvent(data)
    setEvents((prev) => [...prev, newEvent].sort((a, b) => a.year - b.year))
  }

  const handleUpdateEvent = async (event: TimelineEvent) => {
    const updated = await updateEvent(event)
    setEvents((prev) =>
      prev.map((e) => (e.id === updated.id ? updated : e)).sort((a, b) => a.year - b.year)
    )
  }

  const handleDeleteEvent = async (id: string) => {
    if (!currentProfile) return
    await deleteEvent(id, currentProfile.id)
    setEvents((prev) => prev.filter((e) => e.id !== id))
  }

  // ─── Changement d'espace de travail (sync multi-appareils) ────────────────
  const handleChangeWorkspaceId = (id: string) => {
    setWorkspaceId(id)
    setWid(id)
    setCurrentProfile(null)
    setShowSettings(false)
  }

  // ─── Rendu ────────────────────────────────────────────────────────────────
  if (currentProfile) {
    return (
      <Timeline
        profile={currentProfile}
        events={events}
        onBack={() => setCurrentProfile(null)}
        onAddEvent={handleAddEvent}
        onUpdateEvent={handleUpdateEvent}
        onDeleteEvent={handleDeleteEvent}
      />
    )
  }

  return (
    <>
      <ProfileList
        profiles={profiles}
        loading={profilesLoading}
        onSelect={setCurrentProfile}
        onCreateProfile={handleCreateProfile}
        onDeleteProfile={handleDeleteProfile}
        onOpenSettings={() => setShowSettings(true)}
      />

      {showSettings && (
        <Settings
          workspaceId={workspaceId}
          onChangeWorkspaceId={handleChangeWorkspaceId}
          onClose={() => setShowSettings(false)}
        />
      )}
    </>
  )
}
