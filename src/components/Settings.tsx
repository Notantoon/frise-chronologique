import { useState } from 'react'
import { X, Copy, Check, AlertCircle, CloudOff } from 'lucide-react'
import { isSupabaseConfigured } from '../lib/supabase'

interface Props {
  workspaceId: string
  onChangeWorkspaceId: (id: string) => void
  onClose: () => void
}

export function Settings({ workspaceId, onChangeWorkspaceId, onClose }: Props) {
  const [copied, setCopied] = useState(false)
  const [importMode, setImportMode] = useState(false)
  const [newId, setNewId] = useState('')
  const [importError, setImportError] = useState('')

  const handleCopy = () => {
    navigator.clipboard.writeText(workspaceId).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleImport = () => {
    const trimmed = newId.trim()
    // UUID basique : 8-4-4-4-12 hexadécimaux
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(trimmed)) {
      setImportError("Identifiant invalide. Copie-le exactement depuis l'autre appareil.")
      return
    }
    onChangeWorkspaceId(trimmed)
  }

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-sm shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800 text-sm">Paramètres</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Mode local */}
          {!isSupabaseConfigured && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3.5">
              <CloudOff size={15} className="text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-amber-700 mb-0.5">
                  Stockage local uniquement
                </p>
                <p className="text-xs text-amber-600 leading-relaxed">
                  Les données sont sauvegardées dans ce navigateur. Pour synchroniser
                  entre appareils, configure Supabase (voir le README).
                </p>
              </div>
            </div>
          )}

          {/* Sync Supabase */}
          {isSupabaseConfigured && (
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-slate-500 mb-2">
                  Ton identifiant de synchronisation
                </p>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
                  <code className="flex-1 text-xs text-slate-600 truncate font-mono">
                    {workspaceId}
                  </code>
                  <button
                    onClick={handleCopy}
                    className="text-slate-400 hover:text-slate-700 transition-colors p-0.5"
                    title="Copier"
                  >
                    {copied ? (
                      <Check size={14} className="text-green-500" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Copie cet identifiant et entre-le sur un autre appareil pour
                  retrouver tes frises.
                </p>
              </div>

              <div className="border-t border-slate-100 pt-3">
                {!importMode ? (
                  <button
                    onClick={() => setImportMode(true)}
                    className="text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors"
                  >
                    Utiliser un identifiant existant →
                  </button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-slate-600">
                      Colle l'identifiant de l'autre appareil
                    </p>
                    <input
                      type="text"
                      value={newId}
                      onChange={(e) => { setNewId(e.target.value); setImportError('') }}
                      placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 font-mono placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all"
                    />
                    {importError && (
                      <div className="flex items-center gap-1.5 text-xs text-red-500">
                        <AlertCircle size={12} />
                        {importError}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setImportMode(false); setNewId(''); setImportError('') }}
                        className="flex-1 py-2 text-xs text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleImport}
                        className="flex-1 py-2 text-xs bg-indigo-500 text-white font-medium rounded-xl hover:bg-indigo-600 transition-colors"
                      >
                        Changer d'espace
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Version */}
          <div className="border-t border-slate-100 pt-3">
            <p className="text-xs text-slate-300 text-center">Frise Chronologique v0.1</p>
          </div>
        </div>
      </div>
    </div>
  )
}
