import { useState, useEffect } from 'react'
import type { DayContent, RevisionDay } from '$types/curriculum'

export function useDayContent(
  phase: number,
  day: number,
): {
  content: DayContent | null
  loading: boolean
  error: string | null
  isRevisionDay: boolean
} {
  const [content, setContent] = useState<DayContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRevisionDay, setIsRevisionDay] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setContent(null)
    setIsRevisionDay(false)

    const paddedDay = String(day).padStart(3, '0')
    const url = `/curriculum/phase${phase}/day${paddedDay}.json`

    fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`)
        return response.json()
      })
      .then((data: DayContent | RevisionDay) => {
        if (cancelled) return
        if ('isRevision' in data && data.isRevision) {
          setIsRevisionDay(true)
        } else {
          setContent(data as DayContent)
        }
        setLoading(false)
      })
      .catch((fetchError: Error) => {
        if (cancelled) return
        setError(fetchError.message)
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [phase, day])

  return { content, loading, error, isRevisionDay }
}
