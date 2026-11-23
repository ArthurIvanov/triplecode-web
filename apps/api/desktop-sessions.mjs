import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export const sessionIdPattern = /^[a-f0-9-]{36}$/;

let database;

function store() {
  if (database) return database;
  const path = process.env.DESKTOP_GRANT_DB;
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  database = new DatabaseSync(path);
  database.exec(`
    PRAGMA busy_timeout=2500;
    CREATE TABLE IF NOT EXISTS desktop_sessions (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      token TEXT NOT NULL,
      label TEXT,
      created_at INTEGER NOT NULL,
      last_seen_at INTEGER NOT NULL,
      revoked_at INTEGER
    );
    CREATE INDEX IF NOT EXISTS desktop_sessions_email ON desktop_sessions(email, revoked_at);
  `);
  return database;
}

function seal(id, value) {
  const key = createHash('sha256').update('triplecode-desktop-session:' + id).digest();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(value)), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString('base64url');
}

function open(id, payload) {
  const key = createHash('sha256').update('triplecode-desktop-session:' + id).digest();
  const data = Buffer.from(payload, 'base64url');
  const decipher = createDecipheriv('aes-256-gcm', key, data.subarray(0, 12));
  decipher.setAuthTag(data.subarray(12, 28));
  return JSON.parse(Buffer.concat([decipher.update(data.subarray(28)), decipher.final()]).toString('utf8'));
}

export function recordSession(email, session, label) {
  const id = randomUUID();
  const now = Date.now();
  store().prepare(`
    INSERT INTO desktop_sessions (id, email, token, label, created_at, last_seen_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, email, seal(id, session), label || null, now, now);
  return id;
}

export function touchSession(id, refreshToken) {
  if (!sessionIdPattern.test(id || '')) return;
  const exists = store().prepare('SELECT 1 FROM desktop_sessions WHERE id = ? AND revoked_at IS NULL').get(id);
  if (!exists) return;
  store().prepare('UPDATE desktop_sessions SET last_seen_at = ?, token = ? WHERE id = ?')
    .run(Date.now(), seal(id, { refresh_token: refreshToken }), id);
}

export function dropSession(id) {
  if (!sessionIdPattern.test(id || '')) return;
  store().prepare('UPDATE desktop_sessions SET revoked_at = ? WHERE id = ? AND revoked_at IS NULL')
    .run(Date.now(), id);
}

export function listSessions(email) {
  return store().prepare(`
    SELECT id, email, label, created_at, last_seen_at FROM desktop_sessions
    WHERE email = ? AND revoked_at IS NULL ORDER BY last_seen_at DESC
  `).all(email).map(row => ({
    id: row.id, email: row.email, label: row.label,
    created_at: row.created_at, last_seen_at: row.last_seen_at,
  }));
}

export function sessionRefreshToken(id) {
  if (!sessionIdPattern.test(id || '')) return null;
  const row = store().prepare('SELECT token FROM desktop_sessions WHERE id = ? AND revoked_at IS NULL').get(id);
  return row ? open(id, row.token).refresh_token : null;
}
