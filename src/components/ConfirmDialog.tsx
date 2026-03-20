import { useState, useEffect } from 'react'

interface Props {
  visible: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  destructive?: boolean
}

export default function ConfirmDialog({ visible, title, message, confirmLabel = '확인', cancelLabel = '취소', onConfirm, onCancel, destructive }: Props) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (visible) requestAnimationFrame(() => setShow(true))
    else setShow(false)
  }, [visible])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/40" style={{ opacity: show ? 1 : 0, transition: 'opacity 200ms' }} />
      <div
        className="relative bg-white rounded-2xl p-6 w-full max-w-[320px]"
        style={{
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          transform: show ? 'scale(1)' : 'scale(0.95)',
          opacity: show ? 1 : 0,
          transition: 'all 200ms',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-base font-bold mb-2" style={{ color: '#831843' }}>{title}</h3>
        <p className="text-sm mb-5" style={{ color: '#9D174D' }}>{message}</p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl text-sm font-semibold cursor-pointer"
            style={{ backgroundColor: '#FDF2F8', color: '#9D174D' }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-white cursor-pointer"
            style={{ backgroundColor: destructive ? '#EF4444' : '#8B5CF6' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
