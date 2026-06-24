export interface Task {
  id: string
  name: string
  estimatedDuration: number
  isBreak: boolean
  order: number
  createdAt: number
}

export interface Template {
  id: string
  name: string
  description?: string
  tasks: TemplateTask[]
  createdAt: number
  updatedAt: number
}

export interface FocusSession {
  id: string
  startedAt: number
  completedAt: number | null
  tasks: SessionTask[]
  status: 'active' | 'paused' | 'completed' | 'abandoned'
}

export interface SessionTask {
  id: string
  sessionId: string
  taskName: string
  estimatedDuration: number
  actualDuration: number | null
  isBreak: boolean
  completedAt: number | null
  status: 'pending' | 'active' | 'completed' | 'skipped'
  flowStateEntered: boolean
  order: number
}

export interface TemplateTask {
  id: string
  templateId: string
  name: string
  estimatedDuration: number
  isBreak: boolean
  order: number
}

export interface TimerState {
  mode: 'countdown' | 'countup'
  status: 'idle' | 'running' | 'paused'
  elapsed: number
  remaining: number
  totalDuration: number
  isFlowState: boolean
  overtime: number
}

export interface DailyStats {
  date: string
  totalFocusMinutes: number
  tasksCompleted: number
  sessionsCompleted: number
}
