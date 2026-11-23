import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export const desktopSecret = /^[A-Za-z0-9_-]{43}$/;
export const digest = value => createHash('sha256').update(value).digest('base64url');
export const desktopCallback = 'triplecode://triplecode.triplecode-mvp/auth/callback';

let database;

function store() {
  if (database) return database;
  const path = process.env.DESKTOP_GRANT_DB;
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  database = new DatabaseSync(path);
  database.exec(`
    PRAGMA busy_timeout=2500;
    CREATE TABLE IF NOT EXISTS desktop_grants (
      code_hash TEXT PRIMARY KEY,
      challenge TEXT NOT NULL,
      payload TEXT NOT NULL,
      expires_at INTEGER NOT NULL
    )
  `);
  return database;
}

function key(code) {
  return createHash('sha256').update('triplecode-desktop-grant:' + code).digest();
}

export function issueGrant(challenge, session) {
  const code = randomBytes(32).toString('base64url');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(code), iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(session)), cipher.final()]);
  const payload = Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString('base64url');
  const now = Date.now();
  const db = store();
  db.prepare('DELETE FROM desktop_grants WHERE expires_at <= ?').run(now);
  db.prepare('INSERT INTO desktop_grants VALUES (?, ?, ?, ?)').run(digest(code), challenge, payload, now + 120_000);
  return code;
}

export function createGrant(challenge, state) {
  return issueGrant(challenge, { state });
}

export function exchangeGrant(code, verifier) {
  const now = Date.now();
  const db = store();
  db.prepare('DELETE FROM desktop_grants WHERE expires_at <= ?').run(now);
  const row = db.prepare(`
    DELETE FROM desktop_grants WHERE code_hash = ? AND challenge = ? AND expires_at > ?
    RETURNING payload
  `).get(digest(code), digest(verifier), now);
  if (!row) return null;
  const payload = Buffer.from(row.payload, 'base64url');
  const decipher = createDecipheriv('aes-256-gcm', key(code), payload.subarray(0, 12));
  decipher.setAuthTag(payload.subarray(12, 28));
  return JSON.parse(Buffer.concat([decipher.update(payload.subarray(28)), decipher.final()]).toString('utf8'));
}
