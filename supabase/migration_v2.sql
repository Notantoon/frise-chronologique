-- ============================================================
-- Migration v2 — Ajout des champs mois et jour
-- À exécuter si tu as déjà un projet Supabase créé avec la v1
-- Tes données existantes ne seront PAS supprimées.
-- ============================================================

ALTER TABLE timeline_events
  ADD COLUMN IF NOT EXISTS month INTEGER
    CHECK (month IS NULL OR (month >= 1 AND month <= 12));

ALTER TABLE timeline_events
  ADD COLUMN IF NOT EXISTS day INTEGER
    CHECK (day IS NULL OR (day >= 1 AND day <= 31));
