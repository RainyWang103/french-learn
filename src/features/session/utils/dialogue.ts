/**
 * Returns the minimum milliseconds to wait before starting the next dialogue
 * line: at least 2400 ms, or 75 ms × character count for longer lines.
 */
export function computeLineDuration(text: string): number {
  return Math.max(2400, text.length * 75)
}
