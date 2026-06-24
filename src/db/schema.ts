import * as SQLite from 'expo-sqlite'

export async function initDatabase() {
  const db = getDatabase()
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      estimatedDuration INTEGER NOT NULL,
      isBreak INTEGER NOT NULL DEFAULT 0,
      "order" INTEGER NOT NULL,
      createdAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      startedAt INTEGER NOT NULL,
      completedAt INTEGER,
      status TEXT NOT NULL DEFAULT 'active'
    );

    CREATE TABLE IF NOT EXISTS session_tasks (
      id TEXT PRIMARY KEY,
      sessionId TEXT NOT NULL,
      taskName TEXT NOT NULL,
      estimatedDuration INTEGER NOT NULL,
      actualDuration INTEGER,
      isBreak INTEGER NOT NULL DEFAULT 0,
      completedAt INTEGER,
      status TEXT NOT NULL DEFAULT 'pending',
      flowStateEntered INTEGER NOT NULL DEFAULT 0,
      "order" INTEGER NOT NULL,
      FOREIGN KEY (sessionId) REFERENCES sessions(id)
    );

    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS template_tasks (
      id TEXT PRIMARY KEY,
      templateId TEXT NOT NULL,
      name TEXT NOT NULL,
      estimatedDuration INTEGER NOT NULL,
      isBreak INTEGER NOT NULL DEFAULT 0,
      "order" INTEGER NOT NULL,
      FOREIGN KEY (templateId) REFERENCES templates(id)
    );

    CREATE TABLE IF NOT EXISTS daily_stats (
      date TEXT PRIMARY KEY,
      totalFocusMinutes INTEGER NOT NULL DEFAULT 0,
      tasksCompleted INTEGER NOT NULL DEFAULT 0,
      sessionsCompleted INTEGER NOT NULL DEFAULT 0
    );
  `)
}

let _db: SQLite.SQLiteDatabase | null = null

export function getDatabase(): SQLite.SQLiteDatabase {
  if (!_db) {
    _db = SQLite.openDatabaseSync('kdence.db')
  }
  return _db
}
