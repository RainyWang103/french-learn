import { progressPercent } from '$session/utils/quiz'
import styles from './ProgressBar.module.css'

interface ProgressBarProps {
  current: number
  total: number
  label: string
}

export default function ProgressBar({ current, total, label }: ProgressBarProps) {
  const pct = progressPercent(current, total)
  return (
    <div className={styles.wrapper}>
      <div className={styles.label}>{label}</div>
      <div className={styles.bar}>
        <div className={styles.fill} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
