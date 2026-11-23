import { cookies } from 'next/headers';
import Link from 'next/link';
import { AuthShell } from '@/components/auth-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { desktopEnabled, desktopRequest } from '@/lib/desktop';
import { auth, emailChallenge } from '@/lib/session';

export const metadata = { title: 'Вход' };

const errors = new Map(Object.entries({
  email: 'Введите корректный email.',
  code: 'Код неверный или истёк. Проверьте письмо или запросите новый код.',
  'desktop-expired': 'Запрос входа истёк. Начните вход заново из приложения TripleCode.',
  expired: 'Сессия истекла. Запросите новый код.',
  send: 'Не удалось отправить код. Проверьте email и попробуйте снова.',
  'send-limit': 'Если письмо уже пришло, введите код. Повторить запрос можно через минуту.',
  'verify-limit': 'Слишком много попыток. Попробуйте позже.',
  unavailable: 'Вход временно недоступен. Попробуйте позже.',
}));

export default async function Login({ searchParams }) {
  const { flow, error, desktop } = await searchParams;
  const jar = await cookies();
  const context = desktop && desktopEnabled() ? desktopRequest(jar, desktop) : null;
  const pending = emailChallenge(jar, flow);
  const expired = Boolean(desktop && !context) || Boolean(pending && pending.desktop !== desktop);
  const email = expired ? undefined : pending?.email;
  const code = Boolean(email);
  const message = expired ? errors.get('desktop-expired')
    : errors.get(error) ?? (!auth.configured ? errors.get('unavailable') : null);
  const changeEmail = context ? '/login?' + new URLSearchParams({ desktop }) : '/login';

  return (
    <AuthShell>
      <Card as="section" variant="auth" aria-labelledby="login-title">
        <div className="eyebrow"><span /> {code ? 'Шаг 2 из 2' : context ? 'Вход из приложения' : 'Единый вход'}</div>
        <h1 id="login-title" className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
          {code ? 'Проверьте почту' : 'Войти в TripleCode'}
        </h1>
        <p className="mt-3 max-w-sm text-sm leading-6 text-[#92959e]">
          {code ? 'Код действует 10 минут. При первом подтверждении мы создадим аккаунт.'
            : 'Один email для первого входа и возвращения в существующий аккаунт.'}
        </p>
        {code && (
          <div className="mt-4 rounded-xl border border-white/[0.08] bg-white/[0.035] px-4 py-3">
            <p className="text-xs text-[#777b85]">Код отправлен на</p>
            <p className="mt-1 break-all text-sm font-medium text-white">{email}</p>
          </div>
        )}
        <form className={code ? 'mt-6 space-y-5' : 'mt-8 space-y-5'} method="post" action={code ? '/auth/verify' : '/auth/code'}>
          {context && <input type="hidden" name="desktop" value={desktop} />}
          {code ? (
            <div>
              <input type="hidden" name="flow" value={flow} />
              <label htmlFor="token" className="mb-2 block text-sm font-medium text-[#dfe1e6]">Код подтверждения</label>
              <Input variant="auth" className="code-input" id="token" name="token" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} placeholder="000000" required aria-invalid={error === 'code'} aria-describedby={message ? 'code-hint login-error' : 'code-hint'} />
              <p id="code-hint" className="mt-2 text-xs leading-5 text-[#777b85]">Вставьте код из письма целиком.</p>
            </div>
          ) : (
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-[#dfe1e6]">Рабочий email</label>
              <Input variant="auth" id="email" name="email" type="email" inputMode="email" autoComplete="email" maxLength={254} placeholder="name@company.ru" required aria-invalid={error === 'email'} aria-describedby={message ? 'email-hint login-error' : 'email-hint'} />
              <p id="email-hint" className="mt-2 text-xs leading-5 text-[#777b85]">Отправим одноразовый код. Пароль не нужен.</p>
            </div>
          )}
          {message && <Alert variant="auth" id="login-error">{message}</Alert>}
          <Button type="submit" variant="brand" className="w-full" disabled={!auth.configured || expired}>
            {code ? 'Подтвердить и войти' : 'Получить код'}
          </Button>
        </form>
        {code && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
            <form method="post" action="/auth/code">
              <input type="hidden" name="flow" value={flow} />
              {context && <input type="hidden" name="desktop" value={desktop} />}
              <button type="submit" className="text-[#b7f34a] underline-offset-4 hover:underline">Отправить новый код</button>
            </form>
            <Link href={changeEmail} className="text-[#a2a5ad] underline-offset-4 hover:underline">Сменить email</Link>
          </div>
        )}
      </Card>
    </AuthShell>
  );
}
