import { getDatabase } from '../db'

const db = getDatabase()

export interface SyncPayload {
  tasks: any[]
  sessions: any[]
  sessionTasks: any[]
  templates: any[]
  templateTasks: any[]
  dailyStats: any[]
  syncedAt: number
}

export async function exportLocalData(): Promise<SyncPayload> {
  const tasks = await db.getAllAsync<any>('SELECT * FROM tasks')
  const sessions = await db.getAllAsync<any>('SELECT * FROM sessions')
  const sessionTasks = await db.getAllAsync<any>('SELECT * FROM session_tasks')
  const templates = await db.getAllAsync<any>('SELECT * FROM templates')
  const templateTasks = await db.getAllAsync<any>('SELECT * FROM template_tasks')
  const dailyStats = await db.getAllAsync<any>('SELECT * FROM daily_stats')

  return {
    tasks, sessions, sessionTasks, templates, templateTasks, dailyStats,
    syncedAt: Date.now(),
  }
}

export async function importRemoteData(payload: SyncPayload): Promise<void> {
  await db.withTransactionAsync(async () => {
    for (const task of payload.tasks) {
      await db.runAsync(
        'INSERT OR REPLACE INTO tasks (id, name, estimatedDuration, isBreak, "order", createdAt) VALUES (?, ?, ?, ?, ?, ?)',
        task.id, task.name, task.estimatedDuration, task.isBreak, task.order, task.createdAt
      )
    }
    for (const session of payload.sessions) {
      await db.runAsync(
        'INSERT OR REPLACE INTO sessions (id, startedAt, completedAt, status) VALUES (?, ?, ?, ?)',
        session.id, session.startedAt, session.completedAt, session.status
      )
    }
    for (const st of payload.sessionTasks) {
      await db.runAsync(
        `INSERT OR REPLACE INTO session_tasks (id, sessionId, taskName, estimatedDuration, actualDuration, isBreak, completedAt, status, flowStateEntered, "order") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        st.id, st.sessionId, st.taskName, st.estimatedDuration, st.actualDuration, st.isBreak, st.completedAt, st.status, st.flowStateEntered, st.order
      )
    }
    for (const t of payload.templates) {
      await db.runAsync(
        'INSERT OR REPLACE INTO templates (id, name, createdAt, updatedAt) VALUES (?, ?, ?, ?)',
        t.id, t.name, t.createdAt, t.updatedAt
      )
    }
    for (const tt of payload.templateTasks) {
      await db.runAsync(
        'INSERT OR REPLACE INTO template_tasks (id, templateId, name, estimatedDuration, isBreak, "order") VALUES (?, ?, ?, ?, ?, ?)',
        tt.id, tt.templateId, tt.name, tt.estimatedDuration, tt.isBreak, tt.order
      )
    }
    for (const ds of payload.dailyStats) {
      await db.runAsync(
        'INSERT OR REPLACE INTO daily_stats (date, totalFocusMinutes, tasksCompleted, sessionsCompleted) VALUES (?, ?, ?, ?)',
        ds.date, ds.totalFocusMinutes, ds.tasksCompleted, ds.sessionsCompleted
      )
    }
  })
}

export function getSyncDate(): number {
  return Date.now()
}
