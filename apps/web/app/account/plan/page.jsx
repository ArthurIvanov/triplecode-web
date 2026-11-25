import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CabinetShell } from '@/components/cabinet-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cookieName, getUser } from '@/lib/session';
import { softQuota } from '../../../../api/usage-events.mjs';

export const metadata = { title: 'План — TripleCode' };
export const dynamic = 'force-dynamic';

export default async function Plan() {
  const jar = await cookies();
  const user = await getUser(jar.get(cookieName('access'))?.value).catch(() => null);
  if (!user?.email) {
    redirect(jar.has(cookieName('refresh')) ? '/auth/session' : '/login');
  }
  const quota = softQuota(user.email);

  return (
    <CabinetShell email={user.email}>
      <div className="max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">План</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Пилотный тариф для TripleCode IDE. Жёсткий биллинг и hosted checkout — позже.
        </p>
        <Card className="mt-6 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Текущий план</p>
              <h2 className="mt-1 text-xl font-semibold">Pilot · BYOK</h2>
            </div>
            <span className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
              Soft quota
            </span>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Inference идёт через ваш OpenRouter-ключ или локальный Ollama. TripleCode
            считает только метаданные usage events для кабинета — без токенов промптов и без
            списания с карты.
          </p>
          <dl className="mt-6 grid grid-cols-3 gap-3">
            <div>
              <dt className="text-xs text-muted-foreground">Лимит / {quota.days}д</dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums">{quota.limit}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Использовано</dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums">{quota.used}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Остаток</dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums">{quota.remaining}</dd>
            </div>
          </dl>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
            <div className="h-full rounded-full bg-primary" style={{ width: `${Math.round(quota.ratio * 100)}%` }} />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Превышение soft-лимита не блокирует IDE — только сигнал для пилотной аналитики.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild variant="secondary"><Link href="/account/usage">Смотреть использование</Link></Button>
            <Button asChild variant="ghost"><Link href="/account">Профиль</Link></Button>
          </div>
        </Card>
      </div>
    </CabinetShell>
  );
}
