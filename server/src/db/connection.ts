import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

let dbInstance: DatabaseSync | null = null;

export function getDatabasePath(): string {
  if (process.env.DATABASE_PATH) {
    return process.env.DATABASE_PATH;
  }
  // On Vercel serverless or AWS Lambda, cwd is read-only. Use /tmp.
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join(process.env.TMPDIR || '/tmp', 'businessflow.sqlite');
  }
  const dbDir = path.resolve(process.cwd(), 'data');
  if (!fs.existsSync(dbDir)) {
    try {
      fs.mkdirSync(dbDir, { recursive: true });
    } catch {
      return path.join(process.env.TMPDIR || '/tmp', 'businessflow.sqlite');
    }
  }
  return path.join(dbDir, 'businessflow.sqlite');
}

export function getDb(): DatabaseSync {
  if (!dbInstance) {
    const dbPath = getDatabasePath();
    dbInstance = new DatabaseSync(dbPath);
    dbInstance.exec('PRAGMA foreign_keys = ON;');
    dbInstance.exec('PRAGMA journal_mode = WAL;');
  }
  return dbInstance;
}

export function closeDb(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

/**
 * Execute a function within an ACID transaction.
 * Rolls back automatically on any error.
 */
export function runTransaction<T>(fn: (db: DatabaseSync) => T): T {
  const db = getDb();
  db.exec('BEGIN IMMEDIATE;');
  try {
    const result = fn(db);
    db.exec('COMMIT;');
    return result;
  } catch (error) {
    try {
      db.exec('ROLLBACK;');
    } catch {
      // rollback error ignored
    }
    throw error;
  }
}
