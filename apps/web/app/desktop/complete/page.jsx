import { cookies } from 'next/headers';
import { desktopCallback } from '../../../../api/desktop-grants.mjs';
import { AuthShell } from '@/components/auth-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { desktopTicket } from '@/lib/desktop';

export const metadata = { title: 'Вход в приложение', referrer: 'no-referrer' };

export default async function DesktopComplete({ searchParams }) {
  const { desktop } = await searchParams;
  const ticket = desktopTicket(await cookies(), desktop);
  return (
    <AuthShell>
      <Card as="section" variant="auth">
        <h1 className="text-3xl font-semibold tracking-tight">{ticket ? 'Email подтверждён' : 'Вход истёк'}</h1>
        <p className="mt-4 text-sm">{ticket ? 'Вернитесь в TripleCode, чтобы завершить вход.' : 'Начните вход заново из приложения TripleCode.'}</p>
        {ticket && (
          <Button asChild variant="brand" className="mt-6">
            <a href={desktopCallback + '?' + new URLSearchParams(ticket)}>Открыть TripleCode</a>
          </Button>
        )}
      </Card>
    </AuthShell>
  );
}
