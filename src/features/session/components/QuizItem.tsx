import { useState } from 'react'
import styles from './QuizItem.module.css'

export interface DrillQuestion {
  type: 'multipleChoice' | 'fillInTheBlank'
  question: string
  options?: string[]
  correctAnswer: string
  explanation?: string
}

function normalise(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['']/g, "'")
    .replace(/\s+/g, ' ')
}

interface QuizItemProps {
  question: DrillQuestion
  index: number
  onAnswer: (correct: boolean) => void
}

export default function QuizItem({ question, index, onAnswer }: QuizItemProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [answered, setAnswered] = useState<boolean | null>(null)

  const isCorrect = answered === true

  function submitAnswer(value: string) {
    if (answered !== null) return
    const correct = normalise(value) === normalise(question.correctAnswer)
    setSelected(value)
    setAnswered(correct)
    onAnswer(correct)
  }

  function handleSubmitFib() {
    if (!inputValue.trim()) return
    submitAnswer(inputValue)
  }

  if (question.type === 'multipleChoice' && question.options) {
    return (
      <div className={styles.container} style={{ animationDelay: `${index * 0.07}s` }}>
        <div className={styles.index}>Question {index + 1}</div>
        <p className={styles.question}>{question.question}</p>
        <div className={styles.options}>
          {question.options.map((option) => {
            const isSelected = selected === option
            const isCorrectOption =
              answered !== null && normalise(option) === normalise(question.correctAnswer)
            const isWrongOption = isSelected && answered === false
            return (
              <button
                key={option}
                className={[
                  styles.option,
                  isSelected ? styles.selected : '',
                  isCorrectOption ? styles.correct : '',
                  isWrongOption ? styles.wrong : '',
                  answered !== null ? styles.disabled : '',
                ].join(' ')}
                onClick={() => submitAnswer(option)}
                disabled={answered !== null}
              >
                {option}
              </button>
            )
          })}
        </div>
        {answered !== null && (
          <div
            className={[
              styles.feedback,
              isCorrect ? styles.feedbackCorrect : styles.feedbackWrong,
            ].join(' ')}
          >
            <div
              className={[
                styles.feedbackLabel,
                isCorrect ? styles.labelCorrect : styles.labelWrong,
              ].join(' ')}
            >
              {isCorrect ? 'Correct ✓' : `Incorrect — ${question.correctAnswer}`}
            </div>
            {question.explanation && (
              <div className={styles.feedbackExplanation}>{question.explanation}</div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={styles.container} style={{ animationDelay: `${index * 0.07}s` }}>
      <div className={styles.index}>Question {index + 1}</div>
      <p className={styles.question}>{question.question}</p>
      <div className={styles.inputRow}>
        <input
          className={[
            styles.input,
            answered === true ? styles.inputCorrect : '',
            answered === false ? styles.inputWrong : '',
          ].join(' ')}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmitFib()}
          placeholder="Tapez votre réponse…"
          disabled={answered !== null}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
        />
        <button
          className={styles.submitBtn}
          onClick={handleSubmitFib}
          disabled={answered !== null}
          aria-label="Submit"
        >
          →
        </button>
      </div>
      {answered !== null && (
        <div
          className={[
            styles.feedback,
            isCorrect ? styles.feedbackCorrect : styles.feedbackWrong,
          ].join(' ')}
        >
          <div
            className={[
              styles.feedbackLabel,
              isCorrect ? styles.labelCorrect : styles.labelWrong,
            ].join(' ')}
          >
            {isCorrect ? 'Correct ✓' : `Incorrect — ${question.correctAnswer}`}
          </div>
          {question.explanation && (
            <div className={styles.feedbackExplanation}>{question.explanation}</div>
          )}
        </div>
      )}
    </div>
  )
}
