import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AuthShell } from '@/components/auth-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { cookieName, getUser } from '@/lib/session';

export const metadata = { title: 'Профиль' };

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
    <AuthShell>
      <Card as="section" variant="auth" aria-labelledby="profile-title">
        <div className="flex items-start justify-between gap-4">
          <div>
            {user && <div className="eyebrow"><span /> Аккаунт активен</div>}
            <h1 id="profile-title" className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">Профиль</h1>
          </div>
          {user && (
            <div aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-full border border-[#b7f34a]/25 bg-[#b7f34a]/10 text-sm font-semibold text-[#b7f34a]">
              {user.email.slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
        {unavailable ? (
          <>
            <Alert variant="auth" className="mt-5">Не удалось проверить сессию. Попробуйте снова через несколько минут.</Alert>
            <Button asChild variant="secondary" className="mt-5"><a href="/account">Повторить</a></Button>
          </>
        ) : (
          <>
            {error === 'logout' && <Alert variant="auth" className="mt-5">Не удалось завершить сессию. Попробуйте ещё раз.</Alert>}
            <div className="mt-8 rounded-xl border border-white/[0.08] bg-white/[0.035] p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs text-[#777b85]">Подтверждённый email</p>
                  <p className="mt-1 break-all text-sm font-medium text-white">{user.email}</p>
                </div>
                <span className="shrink-0 rounded-full border border-[#b7f34a]/20 bg-[#b7f34a]/10 px-2.5 py-1 text-[11px] font-medium text-[#b7f34a]">Подтверждён</span>
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="brand" className="flex-1 text-center"><a href="/">На главную</a></Button>
              <form method="post" action="/auth/logout" className="flex-1">
                <Button type="submit" variant="secondary" className="w-full">Выйти</Button>
              </form>
            </div>
          </>
        )}
      </Card>
    </AuthShell>
  );
}
