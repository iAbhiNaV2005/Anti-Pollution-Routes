import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface OnboardingModalProps {
  open: boolean
  onClose: () => void
  onAddSchedule: () => void
}

export function OnboardingModal({ open, onClose, onAddSchedule }: OnboardingModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    closeButtonRef.current?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={overlayRef}
          role="dialog"
          aria-labelledby="onboarding-title"
          aria-modal="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleOverlayClick}
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
              maxWidth: '420px',
              width: '100%',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🌿</div>
            <h2
              id="onboarding-title"
              style={{
                margin: '0 0 0.75rem',
                fontSize: '1.4rem',
                fontWeight: 800,
                background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-amber) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Anti Pollution Routes
            </h2>
            <p
              style={{
                margin: '0 0 1.75rem',
                color: 'var(--text-muted)',
                lineHeight: 1.65,
                fontSize: '0.9rem',
              }}
            >
              Add your weekly schedule to create routes and discover which paths have the best air
              quality for your commute.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                ref={closeButtonRef}
                onClick={onAddSchedule}
                style={{
                  padding: '0.7rem 1.4rem',
                  background: 'linear-gradient(135deg, var(--accent) 0%, #059669 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  boxShadow: '0 2px 12px var(--accent-glow)',
                }}
              >
                Add weekly schedule
              </button>
              <button
                onClick={onClose}
                style={{
                  padding: '0.7rem 1.4rem',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                Skip for now
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
