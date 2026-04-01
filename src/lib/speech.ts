/**
 * Web Speech API wrapper — French language.
 * All speak calls MUST be triggered by a user gesture on iOS Safari.
 * Cancel any in-progress speech before starting new speech.
 */

export function spk(text: string, rate = 0.8): void {
  if (!window.speechSynthesis) return
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'fr-FR'
  utterance.rate = rate
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
}

export function spkV(text: string, voice: 'f' | 'm', rate = 0.8): void {
  if (!window.speechSynthesis) return
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'fr-FR'
  utterance.rate = rate

  const voices = window.speechSynthesis.getVoices()
  const frVoices = voices.filter(v => v.lang.startsWith('fr'))
  const genderHints =
    voice === 'f'
      ? ['female', 'amelie', 'amélie', 'aurélie', 'aurelie']
      : ['male', 'thomas']
  const match = frVoices.find(v =>
    genderHints.some(h => v.name.toLowerCase().includes(h)),
  )
  if (match) utterance.voice = match

  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
}

export function stopSpeaking(): void {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
}

export function isSpeechSupported(): boolean {
  return 'speechSynthesis' in window
}
