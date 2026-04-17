import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDialoguePlayer } from './useDialoguePlayer'
import * as speech from '$lib/speech'

vi.mock('$lib/speech', () => ({ spkV: vi.fn() }))

const dialogue: ['A' | 'B', string][] = [
  ['A', 'Bonjour !'],
  ['B', 'Salut !'],
]

beforeEach(() => {
  vi.useFakeTimers()
  vi.mocked(speech.spkV).mockClear()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useDialoguePlayer', () => {
  it('starts with isPlaying false', () => {
    const { result } = renderHook(() => useDialoguePlayer(dialogue, 0.8))
    expect(result.current.isPlaying).toBe(false)
  })

  it('sets isPlaying to true immediately when play is called', () => {
    const { result } = renderHook(() => useDialoguePlayer(dialogue, 0.8))
    act(() => result.current.play())
    expect(result.current.isPlaying).toBe(true)
  })

  it('calls spkV for each dialogue line with correct voice', () => {
    const { result } = renderHook(() => useDialoguePlayer(dialogue, 0.8))
    act(() => {
      result.current.play()
      vi.runAllTimers()
    })
    expect(speech.spkV).toHaveBeenCalledWith('Bonjour !', 'f', 0.8)
    expect(speech.spkV).toHaveBeenCalledWith('Salut !', 'm', 0.8)
  })

  it('uses override speed when provided', () => {
    const { result } = renderHook(() => useDialoguePlayer(dialogue, 0.8))
    act(() => {
      result.current.play(0.5)
      vi.runAllTimers()
    })
    expect(speech.spkV).toHaveBeenCalledWith('Bonjour !', 'f', 0.5)
  })

  it('sets isPlaying back to false after all timeouts fire', () => {
    const { result } = renderHook(() => useDialoguePlayer(dialogue, 0.8))
    act(() => {
      result.current.play()
      vi.runAllTimers()
    })
    expect(result.current.isPlaying).toBe(false)
  })

  it('cancels previous playback when play is called again', () => {
    const { result } = renderHook(() => useDialoguePlayer(dialogue, 0.8))
    act(() => result.current.play())
    const firstCallCount = vi.mocked(speech.spkV).mock.calls.length
    act(() => {
      result.current.play()
      vi.runAllTimers()
    })
    // spkV should only be called for the second play run (each line once)
    expect(vi.mocked(speech.spkV).mock.calls.length - firstCallCount).toBe(dialogue.length)
  })
})
