export { default as ProfileSelect } from '$features/profile/components/ProfileSelect'
export { default as Settings } from '$features/profile/components/Settings'
export {
  useProfile,
  createDefaultProfile,
  getEffectiveDifficulty,
  loadProfile,
  saveProfile,
} from '$features/profile/hooks/useProfile'
export type {
  CreateDefaultProfileOptions,
  UseProfileResult,
} from '$features/profile/hooks/useProfile'
export type { UserProfile, SessionLog, Track, Level, Phase } from '$features/profile/types'
