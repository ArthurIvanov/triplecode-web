import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { AuthShell } from '../components/auth-shell'
import { CodeForm } from '../auth/auth-forms'

export const metadata: Metadata = { title: 'Подтверждение email — TripleCode' }

export default async function VerifyPage() {
  const email = (await cookies()).get('tc-auth-email')?.value
  if (!email) redirect('/login')

  return (
    <AuthShell>
      <section className="auth-card" aria-labelledby="verify-title">
        <div className="eyebrow">
          <span /> Шаг 2 из 2
        </div>
        <h1
          id="verify-title"
          className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl"
        >
          Проверьте почту
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#92959e]">
          Код действует 10 минут. При первом подтверждении мы создадим аккаунт.
        </p>
        <CodeForm email={email} />
      </section>
    </AuthShell>
  )
}
