import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CabinetShell } from '@/components/cabinet-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { cookieName, getUser } from '@/lib/session';

export const metadata = { title: 'Профиль — TripleCode' };

export default async function Account({ searchParams }) {
  const { error } = await searchParams;
  const jar = await cookies();
  let user = null;
  let unavailable = error === 'service';
  if (!unavailable) {
    try {
      user = await getUser(jar.get(cookieName('access'))?.value);
    } catch {
      unavailable = true;
    }
  }
  if (!unavailable && !user?.email) {
    redirect(jar.has(cookieName('refresh')) ? '/auth/session' : '/login');
  }

  return (
    <CabinetShell email={user?.email}>
      <div className="max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">Профиль</h1>
        <p className="mt-1 text-sm text-muted-foreground">Данные вашей учётной записи TripleCode.</p>
        {unavailable ? (
          <Card className="mt-6 p-5">
            <Alert variant="auth">Не удалось проверить сессию. Попробуйте снова через несколько минут.</Alert>
            <Button asChild variant="secondary" className="mt-4"><a href="/account">Повторить</a></Button>
          </Card>
        ) : (
          <Card className="mt-6 p-5">
            {error === 'logout' && <Alert variant="auth" className="mb-4">Не удалось завершить сессию. Попробуйте ещё раз.</Alert>}
            <dl className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <dt className="text-xs text-muted-foreground">Email</dt>
                  <dd className="mt-1 break-all text-sm font-medium">{user.email}</dd>
                </div>
                <span className="shrink-0 rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground">Подтверждён</span>
              </div>
            </dl>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild variant="secondary"><Link href="/account/sessions">Управление сессиями</Link></Button>
              <Button asChild variant="ghost"><a href="/">На главную</a></Button>
            </div>
          </Card>
        )}
      </div>
    </CabinetShell>
  );
}
