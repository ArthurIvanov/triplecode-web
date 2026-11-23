import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
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
    <section className="shell auth-shell">
      <Card className="auth-card">
        <h1>Профиль</h1>
        {unavailable ? <>
          <Alert>Не удалось проверить сессию. Попробуйте снова через несколько минут.</Alert>
          <Button asChild variant="outline" className="mt-5"><a href="/account">Повторить</a></Button>
        </> : <>
          {error === 'logout' && <Alert>Не удалось завершить сессию. Попробуйте ещё раз.</Alert>}
          <dl className="profile-data"><dt>Email</dt><dd>{user.email}</dd></dl>
          <form method="post" action="/auth/logout"><Button type="submit" variant="outline">Выйти</Button></form>
        </>}
      </Card>
    </section>
  );
}
