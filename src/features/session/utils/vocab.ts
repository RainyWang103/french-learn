import type { Gender } from '$types/curriculum'

/**
 * Returns a short French grammatical gender label suitable for display badges,
 * or null when the word has no grammatical gender.
 */
export function genderLabel(gender: Gender): string | null {
  if (gender === 'male') {
    return 'masc.'
  }
  if (gender === 'female') {
    return 'fém.'
  }
  return null
}
