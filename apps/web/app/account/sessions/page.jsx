import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { CabinetShell } from '@/components/cabinet-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { cookieName, getUser } from '@/lib/session';
import { accountSessions } from '@/lib/account-sessions';

export const metadata = { title: 'Сессии — TripleCode' };

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default async function Sessions({ searchParams }) {
  const { revoked, error } = await searchParams;
  const jar = await cookies();
  const user = await getUser(jar.get(cookieName('access'))?.value).catch(() => null);
  if (!user?.email) {
    redirect(jar.has(cookieName('refresh')) ? '/auth/session' : '/login');
  }
  const sessions = accountSessions(user.email);

  return (
    <CabinetShell email={user.email}>
      <div className="max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">Сессии</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Устройства, в которых выполнен вход в TripleCode IDE. Отзыв завершает сессию на выбранном устройстве.
        </p>
        {error === 'revoke' && <Alert variant="auth" className="mt-4">Не удалось отозвать сессию. Попробуйте ещё раз.</Alert>}
        {revoked && <Alert variant="auth" className="mt-4">Сессия завершена.</Alert>}
        <Card className="mt-6 overflow-hidden p-0">
          {sessions.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">Активных сессий нет. Войдите в TripleCode из IDE, чтобы устройство появилось здесь.</p>
          ) : (
            <ul className="divide-y divide-border">
              {sessions.map(session => (
                <li key={session.id} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{session.label || 'TripleCode IDE'}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Создана {formatDate(session.created_at)} · Активна {formatDate(session.last_seen_at)}
                    </p>
                  </div>
                  <form method="post" action="/account/sessions/revoke">
                    <input type="hidden" name="session_id" value={session.id} />
                    <Button type="submit" variant="secondary" className="shrink-0">Завершить</Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </CabinetShell>
  );
}
