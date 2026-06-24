declare module 'expo-sqlite' {
  export class SQLiteDatabase {
    execAsync(source: string): Promise<void>
    runAsync(source: string, ...params: any[]): Promise<any>
    getAllAsync<T = any>(source: string, ...params: any[]): Promise<T[]>
    getFirstAsync<T = any>(source: string, ...params: any[]): Promise<T | null>
    prepareAsync(source: string): Promise<any>
    withTransactionAsync(task: () => Promise<void>): Promise<void>
    withExclusiveTransactionAsync(task: (txn: SQLiteDatabase) => Promise<void>): Promise<void>
  }

  export function openDatabaseAsync(
    databaseName: string,
    options?: Record<string, any>,
    directory?: string
  ): Promise<SQLiteDatabase>

  export function openDatabaseSync(
    databaseName: string,
    options?: Record<string, any>,
    directory?: string
  ): SQLiteDatabase
}
