import { AuthShell } from '@/components/auth-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function NotFound() {
  return (
    <AuthShell>
      <Card as="section" variant="auth">
        <h1 className="text-3xl font-semibold tracking-tight">Страница не найдена</h1>
        <p className="mt-3 text-sm text-[#92959e]">Проверьте адрес или вернитесь на главную.</p>
        <Button asChild variant="secondary" className="mt-5"><a href="/">На главную</a></Button>
      </Card>
    </AuthShell>
  );
}
