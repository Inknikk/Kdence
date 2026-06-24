import { getDatabase } from '../db'
import { generateId } from '../utils'
import { captureEvent, AnalyticsEvents } from '../services/analytics'
import type { FocusSession, SessionTask } from '../types'

const db = getDatabase()

export async function createSession(taskNames: { name: string; duration: number; isBreak: boolean }[]): Promise<FocusSession> {
  const id = generateId()
  const now = Date.now()

  await db.runAsync(
    'INSERT INTO sessions (id, startedAt, status) VALUES (?, ?, ?)',
    id, now, 'active'
  )

  const tasks: SessionTask[] = []
  for (let i = 0; i < taskNames.length; i++) {
    const t = taskNames[i]
    const taskId = generateId()
    await db.runAsync(
      `INSERT INTO session_tasks (id, sessionId, taskName, estimatedDuration, isBreak, "order", status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      taskId, id, t.name, t.duration, t.isBreak ? 1 : 0, i, i === 0 ? 'active' : 'pending'
    )
    tasks.push({
      id: taskId,
      sessionId: id,
      taskName: t.name,
      estimatedDuration: t.duration,
      actualDuration: null,
      isBreak: t.isBreak,
      completedAt: null,
      status: i === 0 ? 'active' : 'pending',
      flowStateEntered: false,
      order: i,
    })
  }

  captureEvent(AnalyticsEvents.SESSION_STARTED, { taskCount: taskNames.length })

  return { id, startedAt: now, completedAt: null, tasks, status: 'active' }
}

export async function getSession(id: string): Promise<FocusSession | null> {
  const session = await db.getFirstAsync<any>(
    'SELECT * FROM sessions WHERE id = ?', id
  )
  if (!session) return null

  const taskRows = await db.getAllAsync<any>(
    'SELECT * FROM session_tasks WHERE sessionId = ? ORDER BY "order" ASC',
    id
  )

  return {
    id: session.id,
    startedAt: session.startedAt,
    completedAt: session.completedAt,
    status: session.status,
    tasks: taskRows.map(r => ({
      id: r.id,
      sessionId: r.sessionId,
      taskName: r.taskName,
      estimatedDuration: r.estimatedDuration,
      actualDuration: r.actualDuration,
      isBreak: r.isBreak === 1,
      completedAt: r.completedAt,
      status: r.status,
      flowStateEntered: r.flowStateEntered === 1,
      order: r.order,
    })),
  }
}

export async function getActiveSession(): Promise<FocusSession | null> {
  const session = await db.getFirstAsync<any>(
    "SELECT * FROM sessions WHERE status IN ('active', 'paused') ORDER BY startedAt DESC LIMIT 1"
  )
  if (!session) return null
  return getSession(session.id)
}

export async function completeCurrentTask(sessionId: string): Promise<FocusSession> {
  const session = await getSession(sessionId)
  if (!session) throw new Error('Session not found')

  const activeIndex = session.tasks.findIndex(t => t.status === 'active')
  if (activeIndex === -1) throw new Error('No active task')

  const now = Date.now()
  const activeTask = session.tasks[activeIndex]

  await db.runAsync(
    'UPDATE session_tasks SET status = ?, completedAt = ? WHERE id = ?',
    'completed', now, activeTask.id
  )

  const nextTask = session.tasks[activeIndex + 1]
  if (nextTask) {
    await db.runAsync(
      'UPDATE session_tasks SET status = ? WHERE id = ?',
      'active', nextTask.id
    )
  } else {
    await db.runAsync(
      'UPDATE sessions SET status = ?, completedAt = ? WHERE id = ?',
      'completed', now, sessionId
    )
    captureEvent(AnalyticsEvents.SESSION_COMPLETED, { taskCount: session.tasks.length })
  }

  captureEvent(AnalyticsEvents.TASK_COMPLETED, { taskName: activeTask.taskName })
  const updated = await getSession(sessionId)
  return updated!
}

export async function skipCurrentTask(sessionId: string): Promise<FocusSession> {
  const session = await getSession(sessionId)
  if (!session) throw new Error('Session not found')

  const activeIndex = session.tasks.findIndex(t => t.status === 'active')
  if (activeIndex === -1) throw new Error('No active task')

  const now = Date.now()
  const activeTask = session.tasks[activeIndex]

  await db.runAsync(
    'UPDATE session_tasks SET status = ?, actualDuration = ? WHERE id = ?',
    'skipped', 0, activeTask.id
  )

  const nextTask = session.tasks[activeIndex + 1]
  if (nextTask) {
    await db.runAsync(
      'UPDATE session_tasks SET status = ? WHERE id = ?',
      'active', nextTask.id
    )
  } else {
    await db.runAsync(
      'UPDATE sessions SET status = ?, completedAt = ? WHERE id = ?',
      'completed', now, sessionId
    )
  }

  const updated = await getSession(sessionId)
  return updated!
}

export async function pauseSession(sessionId: string): Promise<void> {
  await db.runAsync(
    "UPDATE sessions SET status = 'paused' WHERE id = ?",
    sessionId
  )
}

export async function resumeSession(sessionId: string): Promise<void> {
  await db.runAsync(
    "UPDATE sessions SET status = 'active' WHERE id = ?",
    sessionId
  )
}

export async function abandonSession(sessionId: string): Promise<void> {
  const now = Date.now()
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      'UPDATE sessions SET status = ?, completedAt = ? WHERE id = ?',
      'abandoned', now, sessionId
    )
    const remaining = await db.getAllAsync<any>(
      "SELECT id FROM session_tasks WHERE sessionId = ? AND status = 'pending'",
      sessionId
    )
    for (const task of remaining) {
      await db.runAsync(
        'UPDATE session_tasks SET status = ? WHERE id = ?',
        'skipped', task.id
      )
    }
  })
}

export async function addTaskToSession(sessionId: string, task: { name: string; duration: number; isBreak: boolean }): Promise<SessionTask> {
  const session = await getSession(sessionId)
  if (!session) throw new Error('Session not found')

  const id = generateId()
  const nextOrder = session.tasks.length

  await db.runAsync(
    `INSERT INTO session_tasks (id, sessionId, taskName, estimatedDuration, isBreak, "order", status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    id, sessionId, task.name, task.duration, task.isBreak ? 1 : 0, nextOrder, 'pending'
  )

  return {
    id,
    sessionId,
    taskName: task.name,
    estimatedDuration: task.duration,
    actualDuration: null,
    isBreak: task.isBreak,
    completedAt: null,
    status: 'pending',
    flowStateEntered: false,
    order: nextOrder,
  }
}

export async function getTodayStats() {
  const today = new Date()
  const dateStr = today.toISOString().split('T')[0]
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()

  const completedTasks = await db.getAllAsync<any>(
    "SELECT COUNT(*) as count, COALESCE(SUM(actualDuration), 0) as totalMinutes FROM session_tasks WHERE status = 'completed' AND completedAt >= ?",
    startOfDay
  )

  const sessionsCount = await db.getFirstAsync<any>(
    "SELECT COUNT(*) as count FROM sessions WHERE status = 'completed' AND completedAt >= ?",
    startOfDay
  )

  return {
    date: dateStr,
    totalFocusMinutes: completedTasks[0]?.totalMinutes ?? 0,
    tasksCompleted: completedTasks[0]?.count ?? 0,
    sessionsCompleted: sessionsCount?.count ?? 0,
  }
}
