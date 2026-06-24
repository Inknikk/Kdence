import { getDatabase } from '../db'
import { generateId } from '../utils'
import type { Task, Template, TemplateTask } from '../types'

const db = getDatabase()

export async function createTask(
  name: string,
  estimatedDuration: number,
  isBreak = false,
  order?: number
): Promise<Task> {
  const id = generateId()
  const now = Date.now()
  const maxOrder = await db.getFirstAsync<{ m: number }>(
    'SELECT COALESCE(MAX("order"), -1) + 1 as m FROM tasks'
  )
  const taskOrder = order ?? maxOrder?.m ?? 0

  await db.runAsync(
    'INSERT INTO tasks (id, name, estimatedDuration, isBreak, "order", createdAt) VALUES (?, ?, ?, ?, ?, ?)',
    id, name, estimatedDuration, isBreak ? 1 : 0, taskOrder, now
  )

  return { id, name, estimatedDuration, isBreak, order: taskOrder, createdAt: now }
}

export async function getAllTasks(): Promise<Task[]> {
  const rows = await db.getAllAsync<any>(
    'SELECT id, name, estimatedDuration, isBreak, "order", createdAt FROM tasks ORDER BY "order" ASC'
  )
  return rows.map(r => ({
    ...r,
    isBreak: r.isBreak === 1,
    estimatedDuration: r.estimatedDuration,
    order: r.order,
    createdAt: r.createdAt,
  }))
}

export async function getTaskById(id: string): Promise<Task | null> {
  const row = await db.getFirstAsync<any>(
    'SELECT id, name, estimatedDuration, isBreak, "order", createdAt FROM tasks WHERE id = ?',
    id
  )
  if (!row) return null
  return { ...row, isBreak: row.isBreak === 1 }
}

export async function updateTask(
  id: string,
  data: { name?: string; estimatedDuration?: number; isBreak?: boolean; order?: number }
): Promise<void> {
  const updates: string[] = []
  const params: any[] = []

  if (data.name !== undefined) {
    updates.push('name = ?')
    params.push(data.name)
  }
  if (data.estimatedDuration !== undefined) {
    updates.push('estimatedDuration = ?')
    params.push(data.estimatedDuration)
  }
  if (data.isBreak !== undefined) {
    updates.push('isBreak = ?')
    params.push(data.isBreak ? 1 : 0)
  }
  if (data.order !== undefined) {
    updates.push('"order" = ?')
    params.push(data.order)
  }

  if (updates.length === 0) return
  params.push(id)
  await db.runAsync(
    `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`,
    ...params
  )
}

export async function deleteTask(id: string): Promise<void> {
  await db.runAsync('DELETE FROM tasks WHERE id = ?', id)
}

export async function reorderTasks(taskIds: string[]): Promise<void> {
  await db.withTransactionAsync(async () => {
    for (let i = 0; i < taskIds.length; i++) {
      await db.runAsync('UPDATE tasks SET "order" = ? WHERE id = ?', i, taskIds[i])
    }
  })
}

export async function clearTasks(): Promise<void> {
  await db.runAsync('DELETE FROM tasks')
}

export async function createTemplate(name: string, tasks: { name: string; estimatedDuration: number; isBreak: boolean; order?: number }[]): Promise<Template> {
  const id = generateId()
  const now = Date.now()
  await db.runAsync(
    'INSERT INTO templates (id, name, createdAt, updatedAt) VALUES (?, ?, ?, ?)',
    id, name, now, now
  )
  for (let i = 0; i < tasks.length; i++) {
    const t = tasks[i]
    await db.runAsync(
      'INSERT INTO template_tasks (id, templateId, name, estimatedDuration, isBreak, "order") VALUES (?, ?, ?, ?, ?, ?)',
      generateId(), id, t.name, t.estimatedDuration, t.isBreak ? 1 : 0, i
    )
  }
  return { id, name, tasks: tasks.map((t, i) => ({ ...t, id: generateId(), templateId: id, order: i })), createdAt: now, updatedAt: now }
}

export async function getAllTemplates(): Promise<Template[]> {
  const rows = await db.getAllAsync<any>('SELECT * FROM templates ORDER BY updatedAt DESC')
  const templates: Template[] = []
  for (const row of rows) {
    const tasks = await db.getAllAsync<any>(
      'SELECT id, templateId, name, estimatedDuration, isBreak, "order" FROM template_tasks WHERE templateId = ? ORDER BY "order" ASC',
      row.id
    )
    templates.push({
      id: row.id,
      name: row.name,
      tasks: tasks.map(t => ({ ...t, isBreak: t.isBreak === 1 })),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    })
  }
  return templates
}

export async function deleteTemplate(id: string): Promise<void> {
  await db.runAsync('DELETE FROM template_tasks WHERE templateId = ?', id)
  await db.runAsync('DELETE FROM templates WHERE id = ?', id)
}
