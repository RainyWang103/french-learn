import { useRef, useState } from 'react'
import type { DialogueLine } from '$types/curriculum'
import { spkV } from '$lib/speech'
import { computeLineDuration } from '$session/utils/dialogue'

export function useDialoguePlayer(dialogue: DialogueLine[], defaultSpeed: number) {
  const [isPlaying, setIsPlaying] = useState(false)
  const timeoutsRef = useRef<number[]>([])

  function play(speed = defaultSpeed) {
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
    setIsPlaying(true)

    let delay = 0
    dialogue.forEach(([speaker, text]) => {
      const id = window.setTimeout(() => {
        spkV(text, speaker === 'A' ? 'f' : 'm', speed)
      }, delay)
      timeoutsRef.current.push(id)
      delay += computeLineDuration(text)
    })

    const doneId = window.setTimeout(() => setIsPlaying(false), delay + 200)
    timeoutsRef.current.push(doneId)
  }

  return { isPlaying, play }
}
