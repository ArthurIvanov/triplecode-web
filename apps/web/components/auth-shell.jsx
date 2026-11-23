import { Brand } from './brand'
import { ThemeToggle } from './theme-toggle'

export function AuthShell({ children }) {
  return (
    <main id="main" tabIndex={-1} className="auth-shell relative min-h-screen overflow-hidden px-5 py-6 sm:px-8">
      <div className="auth-glow" aria-hidden="true" />
      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-[1160px] flex-col">
        <div className="flex h-10 items-center justify-between">
          <Brand />
          <ThemeToggle />
        </div>
        <div className="grid flex-1 place-items-center py-10">{children}</div>
        <p className="auth-footer text-center text-xs">TripleCode · Первый веб-релиз</p>
      </div>
    </main>
  )
}
