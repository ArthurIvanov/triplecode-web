import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function NotFound() {
  return <section className="shell auth-shell"><Card className="auth-card">
    <h1>Страница не найдена</h1>
    <p>Проверьте адрес или вернитесь на главную.</p>
    <Button asChild variant="outline" className="mt-5"><a href="/">На главную</a></Button>
  </Card></section>;
}
