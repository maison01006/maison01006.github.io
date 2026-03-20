import { useState, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'

interface ToastItem {
  id: number
  message: string
  action?: { label: string; onClick: () => void }
}

let addToastFn: ((msg: string, action?: ToastItem['action']) => void) | null = null

export function showToast(message: string, action?: ToastItem['action']) {
  addToastFn?.(message, action)
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const addToast = useCallback((message: string, action?: ToastItem['action']) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, action }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000)
  }, [])

  useEffect(() => {
    addToastFn = addToast
    return () => { addToastFn = null }
  }, [addToast])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-[340px] max-w-[90vw]">
      {toasts.map(t => (
        <div
          key={t.id}
          className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-white animate-in fade-in slide-in-from-bottom-2"
          style={{ backgroundColor: '#1F2937', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}
        >
          <span className="flex-1">{t.message}</span>
          {t.action && (
            <button
              onClick={t.action.onClick}
              className="text-sm font-bold px-2 py-1 rounded cursor-pointer"
              style={{ color: '#EC4899' }}
            >
              {t.action.label}
            </button>
          )}
          <button
            onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
            className="cursor-pointer opacity-60 hover:opacity-100"
            aria-label="닫기"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
