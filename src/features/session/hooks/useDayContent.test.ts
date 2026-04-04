import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useDayContent } from './useDayContent'

const mockContentDay = {
  day: 1,
  phase: 1,
  topic: 'Greetings',
  vocab: { standard: [], advanced: [] },
  listen: { standard: {}, advanced: {} },
  grammar: { standard: {}, advanced: {} },
  quiz: { standard: [], advanced: [] },
  speak: { standard: {}, advanced: {} },
}

const mockRevisionDay = {
  day: 4,
  phase: 1,
  isRevision: true,
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('useDayContent', () => {
  it('fetches day001.json for day 1 and returns full content', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockContentDay),
    } as Response)

    const { result } = renderHook(() => useDayContent(1, 1))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(fetchSpy).toHaveBeenCalledWith('/curriculum/phase1/day001.json')
    expect(result.current.content).toEqual(mockContentDay)
    expect(result.current.isRevisionDay).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('fetches day004.json for day 4 and returns revision', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockRevisionDay),
    } as Response)

    const { result } = renderHook(() => useDayContent(1, 4))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(fetchSpy).toHaveBeenCalledWith('/curriculum/phase1/day004.json')
    expect(result.current.isRevisionDay).toBe(true)
    expect(result.current.content).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('fetches day005.json for day 5 and returns full content', async () => {
    const contentDay5 = { ...mockContentDay, day: 5 }
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(contentDay5),
    } as Response)

    const { result } = renderHook(() => useDayContent(1, 5))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(fetchSpy).toHaveBeenCalledWith('/curriculum/phase1/day005.json')
    expect(result.current.content).toEqual(contentDay5)
    expect(result.current.isRevisionDay).toBe(false)
  })

  it('fetches day009.json for day 9 and returns full content', async () => {
    const contentDay9 = { ...mockContentDay, day: 9 }
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(contentDay9),
    } as Response)

    const { result } = renderHook(() => useDayContent(1, 9))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(fetchSpy).toHaveBeenCalledWith('/curriculum/phase1/day009.json')
    expect(result.current.content).toEqual(contentDay9)
    expect(result.current.isRevisionDay).toBe(false)
  })

  it('returns error when fetch fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 404,
    } as Response)

    const { result } = renderHook(() => useDayContent(1, 99))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toContain('Failed to fetch')
    expect(result.current.content).toBeNull()
    expect(result.current.isRevisionDay).toBe(false)
  })

  it('zero-pads day numbers to 3 digits', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockRevisionDay),
    } as Response)

    renderHook(() => useDayContent(1, 4))

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled())
    expect(fetchSpy).toHaveBeenCalledWith('/curriculum/phase1/day004.json')
  })

  it('uses correct phase in URL', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ...mockContentDay, phase: 2 }),
    } as Response)

    renderHook(() => useDayContent(2, 1))

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled())
    expect(fetchSpy).toHaveBeenCalledWith('/curriculum/phase2/day001.json')
  })
})
