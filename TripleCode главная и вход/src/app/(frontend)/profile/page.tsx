import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/app-auth'
import { logout } from '../auth/actions'
import { AuthShell } from '../components/auth-shell'

export const metadata: Metadata = { title: 'Профиль — TripleCode' }

export default async function ProfilePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  return (
    <AuthShell>
      <section className="auth-card" aria-labelledby="profile-title">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="eyebrow">
              <span /> Аккаунт активен
            </div>
            <h1
              id="profile-title"
              className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl"
            >
              Профиль
            </h1>
          </div>
          <div className="grid size-11 shrink-0 place-items-center rounded-full border border-[#b7f34a]/25 bg-[#b7f34a]/10 text-sm font-semibold text-[#b7f34a]">
            {user.email?.slice(0, 1).toUpperCase()}
          </div>
        </div>
        <div className="mt-8 rounded-xl border border-white/[0.08] bg-white/[0.035] p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs text-[#777b85]">Подтверждённый email</p>
              <p className="mt-1 truncate text-sm font-medium text-white">{user.email}</p>
            </div>
            <span className="shrink-0 rounded-full border border-[#b7f34a]/20 bg-[#b7f34a]/10 px-2.5 py-1 text-[11px] font-medium text-[#b7f34a]">
              Подтверждён
            </span>
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/" className="primary-button flex-1 text-center">
            На главную
          </Link>
          <form action={logout} className="flex-1">
            <button type="submit" className="secondary-button w-full">
              Выйти
            </button>
          </form>
        </div>
      </section>
    </AuthShell>
  )
}
