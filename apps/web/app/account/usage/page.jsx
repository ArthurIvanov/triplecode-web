import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { CabinetShell } from '@/components/cabinet-shell';
import { Card } from '@/components/ui/card';
import { cookieName, getUser } from '@/lib/session';
import { softQuota, usageSummary } from '../../../../api/usage-events.mjs';

export const metadata = { title: 'Использование — TripleCode' };
export const dynamic = 'force-dynamic';

const featureLabels = {
  agent: 'Agent', plan: 'Plan', ask: 'Ask', rewrite: 'Rewrite', inline: 'Inline', other: 'Прочее',
};

const outcomeLabels = {
  ok: 'Успешно', error: 'Ошибка', stopped: 'Остановлено', accepted: 'Принято', rejected: 'Отклонено',
};

function Bar({ value, max }) {
  return (
    <span className="block h-1.5 rounded-full bg-muted" aria-hidden="true">
      <span className="block h-full rounded-full bg-primary" style={{ width: `${max ? Math.round((value / max) * 100) : 0}%` }} />
    </span>
  );
}

export default async function Usage() {
  const jar = await cookies();
  const user = await getUser(jar.get(cookieName('access'))?.value).catch(() => null);
  if (!user?.email) {
    redirect(jar.has(cookieName('refresh')) ? '/auth/session' : '/login');
  }
  const summary = usageSummary(user.email);
  const quota = softQuota(user.email);
  const maxDay = Math.max(1, ...summary.days.map(day => day.count));
  const maxFeature = Math.max(1, ...summary.byFeature.map(item => item.count));
  const maxModel = Math.max(1, ...summary.byModel.map(item => item.count));

  return (
    <CabinetShell email={user.email}>
      <div className="max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">Использование</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          AI-запросы из TripleCode IDE за последние 30 дней. Soft quota Pilot · BYOK:
          {' '}{quota.used}/{quota.limit}.
        </p>
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            ['Запросов', summary.totals.events],
            ['Успешных', summary.totals.ok],
            ['Ошибок', summary.totals.errors],
          ].map(([label, value]) => (
            <Card key={label} className="p-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
            </Card>
          ))}
        </div>
        {(summary.totals.accepted > 0 || summary.totals.rejected > 0) && (
          <Card className="mt-4 p-5">
            <h2 className="text-sm font-medium">Ревью патчей</h2>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                ['Принято', summary.totals.accepted],
                ['Отклонено', summary.totals.rejected],
                ['Доля принятых', summary.totals.accepted + summary.totals.rejected > 0
                  ? Math.round((summary.totals.accepted / (summary.totals.accepted + summary.totals.rejected)) * 100) + '%'
                  : '—'],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
                </div>
              ))}
            </div>
          </Card>
        )}
        <Card className="mt-4 p-5">
          <h2 className="text-sm font-medium">По дням</h2>
          {summary.days.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Данных пока нет — запросы появятся после первого AI-запроса в IDE.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {summary.days.map(day => (
                <li key={day.date} className="flex items-center gap-3 text-sm">
                  <span className="w-24 shrink-0 text-xs text-muted-foreground tabular-nums">{day.date}</span>
                  <span className="flex-1"><Bar value={day.count} max={maxDay} /></span>
                  <span className="w-8 text-right text-xs tabular-nums">{day.count}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Card className="p-5">
            <h2 className="text-sm font-medium">По функциям</h2>
            {summary.byFeature.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">Нет данных.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {summary.byFeature.map(item => (
                  <li key={item.name}>
                    <div className="flex justify-between text-sm">
                      <span>{featureLabels[item.name] || item.name}</span>
                      <span className="tabular-nums text-muted-foreground">{item.count}</span>
                    </div>
                    <Bar value={item.count} max={maxFeature} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card className="p-5">
            <h2 className="text-sm font-medium">По моделям</h2>
            {summary.byModel.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">Нет данных.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {summary.byModel.map(item => (
                  <li key={item.name}>
                    <div className="flex justify-between gap-3 text-sm">
                      <span className="truncate" title={item.name}>{item.name}</span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">{item.count}</span>
                    </div>
                    <Bar value={item.count} max={maxModel} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </CabinetShell>
  );
}
