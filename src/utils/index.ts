let counter = 0

export function generateId(): string {
  counter += 1
  const timestamp = Date.now().toString(36)
  const rand = Math.random().toString(36).substring(2, 8)
  return `${timestamp}-${rand}-${counter}`
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function formatTimeDisplay(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
