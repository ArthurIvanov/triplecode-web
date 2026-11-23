import { Button } from '@/components/ui/button';

export function Brand() {
  return <a href="/" className="brand"><span className="mark" aria-hidden="true"><i /><i /><i /></span>TripleCode</a>;
}

export function Header() {
  return (
    <header className="header">
      <div className="shell top">
        <Brand />
        <nav aria-label="Основная навигация">
          <a className="product-nav" href="/#workflow">Как работает</a>
          <Button asChild variant="ghost"><a href="/login">Войти</a></Button>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return <footer className="shell footer"><Brand /><span>Среда разработки с AI-агентом</span></footer>;
}
