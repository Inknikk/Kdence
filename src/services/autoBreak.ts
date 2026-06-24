import { getDatabase } from '../db'
import type { SessionTask } from '../types'

const db = getDatabase()

export function shouldAutoBreak(tasks: SessionTask[], completedIndex: number): { isBreak: boolean; nextTask: SessionTask | null } {
  const nextTask = tasks[completedIndex + 1]
  if (nextTask?.isBreak) {
    return { isBreak: true, nextTask }
  }
  const previousTask = tasks[completedIndex]
  if (previousTask && !previousTask.isBreak) {
    const taskDuration = previousTask.estimatedDuration
    if (taskDuration >= 90 && !nextTask?.isBreak) {
      return { isBreak: false, nextTask }
    }
  }
  return { isBreak: false, nextTask }
}

export function getRecommendedBreak(tasks: SessionTask[]): number {
  const completedFocus = tasks
    .filter(t => !t.isBreak && (t.status === 'completed' || t.status === 'active'))
    .reduce((sum, t) => sum + t.estimatedDuration, 0)

  if (completedFocus >= 120) return 15
  if (completedFocus >= 60) return 10
  return 5
}
