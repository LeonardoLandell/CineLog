import { createClient } from '@libsql/client';

export const db = createClient({
  url: process.env.TURSO_DATABASE_URL || '',
  authToken: process.env.TURSO_AUTH_TOKEN || '',
});

export async function initDb() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS watchlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT DEFAULT 'default_user',
      media_uid TEXT NOT NULL,
      external_id INTEGER NOT NULL,
      source TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      poster TEXT,
      year TEXT,
      rating REAL,
      overview TEXT,
      status TEXT CHECK(status IN ('planned', 'watched')) DEFAULT 'planned',
      personal_rating INTEGER CHECK(personal_rating BETWEEN 1 AND 10 OR personal_rating IS NULL),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, media_uid)
    );
  `);
}