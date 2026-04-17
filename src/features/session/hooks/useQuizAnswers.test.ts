import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useQuizAnswers } from '$session/hooks/useQuizAnswers'

describe('useQuizAnswers', () => {
  it('initialises with empty answers and zero counts', () => {
    const { result } = renderHook(() => useQuizAnswers(3))
    expect(result.current.answeredCount).toBe(0)
    expect(result.current.score).toBe(0)
    expect(result.current.allAnswered).toBe(false)
  })

  it('increments answeredCount when recordAnswer is called', () => {
    const { result } = renderHook(() => useQuizAnswers(3))
    act(() => result.current.recordAnswer(0, true))
    expect(result.current.answeredCount).toBe(1)
  })

  it('increments score only for correct answers', () => {
    const { result } = renderHook(() => useQuizAnswers(3))
    act(() => result.current.recordAnswer(0, true))
    act(() => result.current.recordAnswer(1, false))
    expect(result.current.score).toBe(1)
    expect(result.current.answeredCount).toBe(2)
  })

  it('sets allAnswered when all questions are answered', () => {
    const { result } = renderHook(() => useQuizAnswers(2))
    act(() => result.current.recordAnswer(0, true))
    expect(result.current.allAnswered).toBe(false)
    act(() => result.current.recordAnswer(1, false))
    expect(result.current.allAnswered).toBe(true)
  })

  it('never sets allAnswered when total is 0', () => {
    const { result } = renderHook(() => useQuizAnswers(0))
    expect(result.current.allAnswered).toBe(false)
  })

  it('exposes answers record for downstream use', () => {
    const { result } = renderHook(() => useQuizAnswers(3))
    act(() => result.current.recordAnswer(1, true))
    expect(result.current.answers[1]).toBe(true)
    expect(result.current.answers[0]).toBeUndefined()
  })
})
