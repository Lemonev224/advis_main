'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export default function NavigationProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const prevPathRef = useRef(pathname)

  const clear = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  const complete = () => {
    clear()
    setProgress(100)
    timerRef.current = setTimeout(() => {
      setVisible(false)
      setProgress(0)
    }, 300)
  }

  useEffect(() => {
    // Only trigger when the path actually changes
    if (pathname === prevPathRef.current) return
    prevPathRef.current = pathname

    clear()
    setVisible(true)
    setProgress(15)

    // Ease the bar forward in increments, slowing as it approaches 85%
    let current = 15
    intervalRef.current = setInterval(() => {
      current += (85 - current) * 0.12
      setProgress(Math.min(current, 84))
    }, 120)

    // Auto-complete after a generous timeout
    timerRef.current = setTimeout(complete, 4000)

    return () => {
      complete()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams])

  if (!visible && progress === 0) return null

  return (
    <>
      {/* Progress bar */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          height: '2px',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #3B82F6, #60A5FA)',
            transition: progress === 100
              ? 'width 0.15s ease-out, opacity 0.3s ease'
              : 'width 0.4s cubic-bezier(0.1, 0.4, 0.6, 1)',
            opacity: progress === 100 ? 0 : 1,
            boxShadow: '0 0 8px rgba(96, 165, 250, 0.6)',
            borderRadius: '0 2px 2px 0',
          }}
        />
      </div>

      {/* Subtle page-dimming overlay while loading */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9998,
          pointerEvents: 'none',
          background: 'rgba(255,255,255,0.08)',
          opacity: visible && progress < 100 ? 1 : 0,
          transition: 'opacity 0.2s ease',
        }}
      />
    </>
  )
}