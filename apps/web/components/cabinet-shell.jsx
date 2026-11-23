'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Brand } from './brand';
import { ThemeToggle } from './theme-toggle';

const sections = [
  { href: '/account', label: 'Профиль', exact: true },
  { href: '/account/sessions', label: 'Сессии' },
  { href: '/account/plan', label: 'План', soon: true },
  { href: '/account/usage', label: 'Использование', soon: true },
  { href: '/account/billing', label: 'Счета', soon: true },
];

export function CabinetShell({ email, children }) {
  const pathname = usePathname();
  return (
    <main id="main" tabIndex={-1} className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-5 sm:px-8">
          <Brand />
          <nav aria-label="Кабинет" className="flex items-center gap-1 overflow-x-auto">
            {sections.map(section => {
              const active = section.exact ? pathname === section.href : pathname.startsWith(section.href);
              if (section.soon) {
                return (
                  <span key={section.href} aria-disabled="true" title="Скоро"
                    className="cursor-default rounded-md px-3 py-1.5 text-sm text-muted-foreground/60">
                    {section.label}
                  </span>
                );
              }
              return (
                <Link key={section.href} href={section.href}
                  aria-current={active ? 'page' : undefined}
                  className={active
                    ? 'rounded-md bg-muted px-3 py-1.5 text-sm font-medium text-foreground'
                    : 'rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground'}>
                  {section.label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden max-w-48 truncate text-xs text-muted-foreground sm:inline" title={email}>{email}</span>
            <ThemeToggle />
            <form method="post" action="/auth/logout">
              <button type="submit" className="rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                Выйти
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">{children}</div>
    </main>
  );
}
