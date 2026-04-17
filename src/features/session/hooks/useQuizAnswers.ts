import { useState } from 'react'
import { countAnswered, countCorrect } from '../utils/quiz'

export function useQuizAnswers(total: number) {
  const [answers, setAnswers] = useState<Record<number, boolean>>({})

  const answeredCount = countAnswered(answers)
  const allAnswered = total > 0 && answeredCount === total
  const score = countCorrect(answers)

  function recordAnswer(index: number, correct: boolean) {
    setAnswers((prev) => ({ ...prev, [index]: correct }))
  }

  return { answers, answeredCount, allAnswered, score, recordAnswer }
}
