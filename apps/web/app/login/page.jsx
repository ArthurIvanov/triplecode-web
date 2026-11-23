import { cookies } from 'next/headers';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { auth, challengeName, cookieName } from '@/lib/session';

export const metadata = { title: 'Вход' };

const errors = new Map(Object.entries({
  email: 'Введите корректный email.',
  code: 'Код неверный или истёк. Проверьте письмо или запросите новый код.',
  expired: 'Сессия истекла. Запросите новый код.',
  send: 'Не удалось отправить код. Проверьте email и попробуйте снова.',
  'send-limit': 'Если письмо уже пришло, введите код. Повторить запрос можно через минуту.',
  'verify-limit': 'Слишком много попыток. Попробуйте позже.',
  unavailable: 'Вход временно недоступен. Попробуйте позже.',
}));

export default async function Login({ searchParams }) {
  const { flow, error } = await searchParams;
  const name = challengeName(flow);
  const email = name ? (await cookies()).get(cookieName(name))?.value : undefined;
  const code = Boolean(email);
  const message = errors.get(error) ?? (!auth.configured ? errors.get('unavailable') : null);
  return (
    <section className="shell auth-shell">
      <Card className="auth-card">
        <h1>{code ? 'Введите код' : 'Вход в TripleCode'}</h1>
        {code ? <p>Введите код из письма на <strong>{email}</strong>. Он действует 10 минут.</p>
          : <p>Введите email. Код из письма создаст аккаунт или откроет существующий.</p>}
        {message && <Alert className="mt-4" id="login-error">{message}</Alert>}
        <form className="auth-form" method="post" action={code ? '/auth/verify' : '/auth/code'}>
          {code ? <>
            <input type="hidden" name="flow" value={flow} />
            <label htmlFor="token">Код из письма</label>
            <Input id="token" name="token" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required aria-describedby={message ? 'login-error' : undefined} />
          </> : <>
            <label htmlFor="email">Email</label>
            <Input id="email" name="email" type="email" autoComplete="email" maxLength={254} required aria-describedby={message ? 'login-error' : undefined} />
          </>}
          <Button type="submit" disabled={!auth.configured}>{code ? 'Войти' : 'Получить код'}</Button>
        </form>
        {code && <div className="auth-options">
          <form method="post" action="/auth/code"><input type="hidden" name="flow" value={flow} /><Button type="submit" variant="link">Отправить код снова</Button></form>
          <Button asChild variant="link"><a href="/login">Сменить email</a></Button>
        </div>}
      </Card>
    </section>
  );
}
