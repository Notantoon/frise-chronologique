-- ============================================================
-- Frise Chronologique — Schéma Supabase
-- À exécuter dans : Dashboard Supabase → SQL Editor
-- ============================================================

-- Table des profils (frises)
CREATE TABLE IF NOT EXISTS profiles (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id TEXT        NOT NULL,
  name         TEXT        NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Table des événements
CREATE TABLE IF NOT EXISTS timeline_events (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id  UUID        REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  year        INTEGER     NOT NULL CHECK (year >= 1700 AND year <= 2030),
  date_label  TEXT        NOT NULL,
  title       TEXT        NOT NULL,
  description TEXT,
  color       TEXT        NOT NULL DEFAULT '#4F86F7',
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS profiles_workspace_idx
  ON profiles (workspace_id);

CREATE INDEX IF NOT EXISTS events_profile_idx
  ON timeline_events (profile_id);

CREATE INDEX IF NOT EXISTS events_year_idx
  ON timeline_events (year);

-- ─── Sécurité RLS ────────────────────────────────────────────
-- Note : on utilise un workspace_id (UUID) comme token simple.
-- Sans authentification réelle, les données sont accessibles
-- à quiconque connaît le workspace_id.

ALTER TABLE profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;

-- Accès public (le workspace_id sert d'identifiant partagé)
CREATE POLICY "Accès public profils"
  ON profiles FOR ALL TO anon
  USING (true) WITH CHECK (true);

CREATE POLICY "Accès public événements"
  ON timeline_events FOR ALL TO anon
  USING (true) WITH CHECK (true);
