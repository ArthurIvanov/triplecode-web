import type { Metadata } from 'next'
import { AuthShell } from '../components/auth-shell'
import { EmailForm } from '../auth/auth-forms'

export const metadata: Metadata = { title: 'Вход — TripleCode' }

export default function LoginPage() {
  return (
    <AuthShell>
      <section className="auth-card" aria-labelledby="login-title">
        <div className="eyebrow">
          <span /> Единый вход
        </div>
        <h1
          id="login-title"
          className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl"
        >
          Войти в TripleCode
        </h1>
        <p className="mt-3 max-w-sm text-sm leading-6 text-[#92959e]">
          Один email для первого входа и возвращения в существующий аккаунт.
        </p>
        <EmailForm />
        <p className="mt-6 border-t border-white/[0.07] pt-5 text-xs leading-5 text-[#666a73]">
          Продолжая, вы соглашаетесь с условиями использования и политикой конфиденциальности.
        </p>
      </section>
    </AuthShell>
  )
}
