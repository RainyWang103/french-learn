/**
 * Web Speech API wrapper.
 * All speak() calls must be triggered by a user gesture on iOS Safari.
 */

export function speak(text: string, lang = 'fr-FR', rate = 0.8): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!window.speechSynthesis) {
      reject(new Error('Speech synthesis not supported'))
      return
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = rate
    utterance.onend = () => resolve()
    utterance.onerror = (e) => reject(e)

    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  })
}

export function stopSpeaking(): void {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
}

export function isSpeechSupported(): boolean {
  return 'speechSynthesis' in window
}
