import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

let database;

const FEATURES = new Set(['agent', 'plan', 'ask', 'rewrite', 'inline', 'other']);
const PROVIDERS = new Set(['ollama', 'openrouter', 'auto']);
const OUTCOMES = new Set(['ok', 'error', 'stopped']);

function store() {
  if (database) return database;
  const path = process.env.DESKTOP_GRANT_DB;
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  database = new DatabaseSync(path);
  database.exec(`
    PRAGMA busy_timeout=2500;
    CREATE TABLE IF NOT EXISTS usage_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      ts INTEGER NOT NULL,
      feature TEXT NOT NULL,
      provider TEXT,
      model TEXT,
      duration_ms INTEGER,
      outcome TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS usage_events_email_ts ON usage_events(email, ts);
  `);
  return database;
}

export function recordUsage(email, event) {
  const feature = FEATURES.has(event.feature) ? event.feature : 'other';
  const outcome = OUTCOMES.has(event.outcome) ? event.outcome : 'error';
  const provider = PROVIDERS.has(event.provider) ? event.provider : null;
  const model = typeof event.model === 'string' ? event.model.slice(0, 120) : null;
  const duration = Number.isFinite(event.duration_ms) ? Math.max(0, Math.min(event.duration_ms, 3600000)) : null;
  store().prepare(`
    INSERT INTO usage_events (email, ts, feature, provider, model, duration_ms, outcome)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(email, Date.now(), feature, provider, model, duration, outcome);
}

export function usageSummary(email, { days = 30 } = {}) {
  if (!process.env.DESKTOP_GRANT_DB) return { days: [], byFeature: [], byModel: [], totals: { events: 0, ok: 0, errors: 0 } };
  const since = Date.now() - days * 86400000;
  const rows = store().prepare(`
    SELECT ts, feature, model, outcome FROM usage_events
    WHERE email = ? AND ts >= ? ORDER BY ts
  `).all(email, since);

  const byDay = new Map();
  const byFeature = new Map();
  const byModel = new Map();
  const totals = { events: 0, ok: 0, errors: 0 };
  for (const row of rows) {
    totals.events += 1;
    if (row.outcome === 'ok') totals.ok += 1;
    if (row.outcome === 'error') totals.errors += 1;
    const day = new Date(row.ts).toISOString().slice(0, 10);
    byDay.set(day, (byDay.get(day) || 0) + 1);
    byFeature.set(row.feature, (byFeature.get(row.feature) || 0) + 1);
    const model = row.model || 'unknown';
    byModel.set(model, (byModel.get(model) || 0) + 1);
  }
  const daysList = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));
  const ranked = map => [...map.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
  return { days: daysList, byFeature: ranked(byFeature), byModel: ranked(byModel), totals };
}
