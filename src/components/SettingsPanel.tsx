import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { loadSettings, saveSettings } from '../lib/storage'
import type { AppSettings } from '../lib/types'

interface SettingsPanelProps {
  open: boolean
  onClose: () => void
  onDeleteRoutes?: () => void
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.55rem 0.75rem',
  borderRadius: '10px',
  border: '1px solid var(--border)',
  fontSize: '0.88rem',
}

export function SettingsPanel({ open, onClose, onDeleteRoutes }: SettingsPanelProps) {
  const [settings, setSettings] = useState<AppSettings | null>(null)

  useEffect(() => {
    if (open) loadSettings().then(setSettings)
  }, [open])

  const update = async (next: Partial<AppSettings>) => {
    if (!settings) return
    const merged = { ...settings, ...next }
    setSettings(merged)
    await saveSettings(merged)
  }

  if (!open) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-card"
        style={{
          borderRadius: '20px',
          padding: '2rem',
          maxWidth: '400px',
          width: '100%',
        }}
      >
        <h2 style={{ margin: '0 0 1.5rem', fontWeight: 700, fontSize: '1.2rem' }}>
          ⚙️ Settings
        </h2>
        {settings && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <label>
              <span style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.82rem', fontWeight: 600 }}>
                ⏱ Polling frequency
              </span>
              <select
                value={settings.pollingFrequencyMinutes}
                onChange={(e) => update({ pollingFrequencyMinutes: Number(e.target.value) })}
                style={inputStyle}
              >
                <option value={5}>Every 5 min</option>
                <option value={15}>Every 15 min</option>
                <option value={30}>Every 30 min</option>
              </select>
            </label>
            <label>
              <span style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.82rem', fontWeight: 600 }}>
                🔔 Notify when AQI ≤
              </span>
              <input
                type="number"
                min={0}
                max={500}
                value={settings.aqiThreshold}
                onChange={(e) => update({ aqiThreshold: Number(e.target.value) })}
                style={inputStyle}
              />
            </label>
            <label>
              <span style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.82rem', fontWeight: 600 }}>
                🗺️ Map style
              </span>
              <select
                value={settings.mapStyle}
                onChange={(e) => update({ mapStyle: e.target.value as 'light' | 'dark' })}
                style={inputStyle}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </label>
          </div>
        )}

        {onDeleteRoutes && (
          <div
            style={{
              marginTop: '1.75rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border)',
            }}
          >
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Delete all saved routes?')) {
                  onDeleteRoutes()
                  onClose()
                }
              }}
              style={{
                padding: '0.55rem 1rem',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem',
                boxShadow: '0 2px 8px rgba(239,68,68,0.3)',
              }}
            >
              🗑️ Delete all routes
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          style={{
            marginTop: '1.25rem',
            padding: '0.6rem 1.2rem',
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: '0.88rem',
            width: '100%',
          }}
        >
          Close
        </button>
      </motion.div>
    </motion.div>
  )
}
