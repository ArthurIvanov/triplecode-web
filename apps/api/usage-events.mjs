import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

let database;

const FEATURES = new Set(['agent', 'plan', 'ask', 'rewrite', 'inline', 'other']);
const PROVIDERS = new Set(['ollama', 'openrouter', 'auto']);
const OUTCOMES = new Set(['ok', 'error', 'stopped', 'accepted', 'rejected']);
const PILOT_STEPS = new Set(['import', 'first_agent', 'review_keep', 'done']);
const PILOT_TASK_ID = /^[A-Za-z0-9_-]{1,64}$/;

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
    CREATE TABLE IF NOT EXISTS pilot_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      ts INTEGER NOT NULL,
      task_id TEXT NOT NULL,
      step TEXT NOT NULL,
      duration_ms INTEGER
    );
    CREATE INDEX IF NOT EXISTS pilot_events_email_ts ON pilot_events(email, ts);
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

export function recordPilotStep(email, pilot) {
  if (!pilot || typeof pilot !== 'object') return false;
  const taskId = typeof pilot.task_id === 'string' ? pilot.task_id : '';
  const step = typeof pilot.step === 'string' ? pilot.step : '';
  if (!PILOT_TASK_ID.test(taskId) || !PILOT_STEPS.has(step)) return false;
  const duration = Number.isFinite(pilot.duration_ms)
    ? Math.max(0, Math.min(pilot.duration_ms, 3600000))
    : null;
  store().prepare(`
    INSERT INTO pilot_events (email, ts, task_id, step, duration_ms)
    VALUES (?, ?, ?, ?, ?)
  `).run(email, Date.now(), taskId, step, duration);
  return true;
}

export function pilotSummary(email, { days = 90 } = {}) {
  if (!process.env.DESKTOP_GRANT_DB) {
    return { tasks: [], totals: { tasks: 0, completed: 0, importDone: 0, firstAgentDone: 0, reviewKeepDone: 0 } };
  }
  const since = Date.now() - days * 86400000;
  const rows = store().prepare(`
    SELECT task_id, step, ts, duration_ms FROM pilot_events
    WHERE email = ? AND ts >= ? ORDER BY ts
  `).all(email, since);
  const tasks = new Map();
  for (const row of rows) {
    if (!tasks.has(row.task_id)) tasks.set(row.task_id, { taskId: row.task_id, steps: new Set(), firstTs: row.ts, lastTs: row.ts });
    const task = tasks.get(row.task_id);
    task.steps.add(row.step);
    task.lastTs = Math.max(task.lastTs, row.ts);
  }
  const list = [...tasks.values()].map(task => ({
    taskId: task.taskId,
    steps: [...task.steps].sort(),
    durationMs: task.lastTs - task.firstTs,
    completed: task.steps.has('done')
  })).sort((a, b) => a.taskId.localeCompare(b.taskId));
  const totals = {
    tasks: list.length,
    completed: list.filter(task => task.completed).length,
    importDone: list.filter(task => task.steps.includes('import')).length,
    firstAgentDone: list.filter(task => task.steps.includes('first_agent')).length,
    reviewKeepDone: list.filter(task => task.steps.includes('review_keep')).length
  };
  return { tasks: list, totals };
}

export function softQuota(email, {
  days = 30,
  limit = Number(process.env.USAGE_SOFT_LIMIT || 500)
} = {}) {
  const summary = usageSummary(email, { days });
  const used = summary.totals.events;
  const softLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 500;
  return {
    plan: 'pilot-byok',
    soft: true,
    days,
    limit: softLimit,
    used,
    remaining: Math.max(0, softLimit - used),
    ratio: softLimit ? Math.min(1, used / softLimit) : 0
  };
}

export function usageSummary(email, { days = 30 } = {}) {
  if (!process.env.DESKTOP_GRANT_DB) return { days: [], byFeature: [], byModel: [], byOutcome: [], totals: { events: 0, ok: 0, errors: 0, accepted: 0, rejected: 0 } };
  const since = Date.now() - days * 86400000;
  const rows = store().prepare(`
    SELECT ts, feature, model, outcome FROM usage_events
    WHERE email = ? AND ts >= ? ORDER BY ts
  `).all(email, since);

  const byDay = new Map();
  const byFeature = new Map();
  const byModel = new Map();
  const byOutcome = new Map();
  const totals = { events: 0, ok: 0, errors: 0, accepted: 0, rejected: 0 };
  for (const row of rows) {
    totals.events += 1;
    if (row.outcome === 'ok') totals.ok += 1;
    if (row.outcome === 'error') totals.errors += 1;
    if (row.outcome === 'accepted') totals.accepted += 1;
    if (row.outcome === 'rejected') totals.rejected += 1;
    const day = new Date(row.ts).toISOString().slice(0, 10);
    byDay.set(day, (byDay.get(day) || 0) + 1);
    byFeature.set(row.feature, (byFeature.get(row.feature) || 0) + 1);
    const model = row.model || 'unknown';
    byModel.set(model, (byModel.get(model) || 0) + 1);
    byOutcome.set(row.outcome, (byOutcome.get(row.outcome) || 0) + 1);
  }
  const daysList = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));
  const ranked = map => [...map.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
  return { days: daysList, byFeature: ranked(byFeature), byModel: ranked(byModel), byOutcome: ranked(byOutcome), totals };
}
