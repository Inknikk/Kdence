import { getDatabase } from '../db'
import type { DailyStats } from '../types'

const db = getDatabase()

export async function getStatsForDate(date: string): Promise<DailyStats | null> {
  const stats = await db.getFirstAsync<any>(
    'SELECT * FROM daily_stats WHERE date = ?', date
  )
  if (!stats) return null
  return {
    date: stats.date,
    totalFocusMinutes: stats.totalFocusMinutes,
    tasksCompleted: stats.tasksCompleted,
    sessionsCompleted: stats.sessionsCompleted,
  }
}

export async function getStatsForRange(startDate: string, endDate: string): Promise<DailyStats[]> {
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM daily_stats WHERE date >= ? AND date <= ? ORDER BY date ASC',
    startDate, endDate
  )
  return rows.map(r => ({
    date: r.date,
    totalFocusMinutes: r.totalFocusMinutes,
    tasksCompleted: r.tasksCompleted,
    sessionsCompleted: r.sessionsCompleted,
  }))
}

export async function getWeekStats(): Promise<DailyStats[]> {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - 6)
  const fmt = (d: Date) => d.toISOString().split('T')[0]
  return getStatsForRange(fmt(start), fmt(end))
}

export async function getMonthStats(): Promise<DailyStats[]> {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const fmt = (d: Date) => d.toISOString().split('T')[0]
  return getStatsForRange(fmt(start), fmt(end))
}

export async function updateDailyStats(date: string, focusMinutes: number, tasksCompleted: number, sessionsCompleted: number): Promise<void> {
  const existing = await getStatsForDate(date)
  if (existing) {
    await db.runAsync(
      'UPDATE daily_stats SET totalFocusMinutes = ?, tasksCompleted = ?, sessionsCompleted = ? WHERE date = ?',
      existing.totalFocusMinutes + focusMinutes,
      existing.tasksCompleted + tasksCompleted,
      existing.sessionsCompleted + sessionsCompleted,
      date
    )
  } else {
    await db.runAsync(
      'INSERT INTO daily_stats (date, totalFocusMinutes, tasksCompleted, sessionsCompleted) VALUES (?, ?, ?, ?)',
      date, focusMinutes, tasksCompleted, sessionsCompleted
    )
  }
}

export async function getStreak(): Promise<number> {
  const rows = await db.getAllAsync<any>(
    'SELECT date FROM daily_stats ORDER BY date DESC'
  )
  if (rows.length === 0) return 0

  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (const row of rows) {
    const expected = new Date(today)
    expected.setDate(expected.getDate() - streak)
    const expectedStr = expected.toISOString().split('T')[0]

    if (row.date === expectedStr) {
      streak++
    } else {
      break
    }
  }
  return streak
}
