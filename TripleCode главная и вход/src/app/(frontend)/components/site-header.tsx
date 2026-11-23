import Link from 'next/link'
import { Brand } from './brand'
import { ThemeToggle } from './theme-toggle'

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="mx-auto flex h-16 max-w-[1360px] items-center justify-between px-5 sm:px-8">
        <Brand />
        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Основная навигация">
          <a href="#how" className="nav-link hidden sm:block">
            Как работает
          </a>
          <span
            className="nav-disabled hidden rounded-md px-3 py-2 text-sm sm:block"
            title="Появится в следующем релизе"
          >
            Скачать
          </span>
          <ThemeToggle />
          <Link href="/login" className="nav-login">
            Войти
          </Link>
        </nav>
      </div>
    </header>
  )
}
