'use client'

import Link from 'next/link'
import { useActionState, useEffect, useState } from 'react'
import { type AuthState, requestCode, resendCode, verifyCode } from './actions'

const initialAuthState: AuthState = { status: 'idle' }

function StatusMessage({ state }: { state: AuthState }) {
  if (!state.message) return null
  return (
    <p
      className={
        state.status === 'error'
          ? 'form-status form-status-error'
          : 'form-status form-status-success'
      }
      role={state.status === 'error' ? 'alert' : 'status'}
      aria-live="polite"
    >
      {state.message}
    </p>
  )
}

export function EmailForm() {
  const [state, action, pending] = useActionState(requestCode, initialAuthState)

  return (
    <form action={action} className="mt-8 space-y-5" noValidate>
      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-medium text-[#dfe1e6]">
          Рабочий email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoFocus
          placeholder="name@company.ru"
          aria-describedby="email-hint email-status"
          aria-invalid={state.field === 'email'}
          className="form-input"
        />
        <p id="email-hint" className="mt-2 text-xs leading-5 text-[#777b85]">
          Отправим одноразовый код. Пароль не нужен.
        </p>
      </div>
      <div id="email-status">
        <StatusMessage state={state} />
      </div>
      <button type="submit" disabled={pending} className="primary-button w-full">
        {pending ? 'Отправляем…' : 'Получить код'}
      </button>
    </form>
  )
}

export function CodeForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState(verifyCode, initialAuthState)
  const [resendState, resendAction, resendPending] = useActionState(resendCode, initialAuthState)
  const [seconds, setSeconds] = useState(30)

  useEffect(() => {
    if (resendState.retryAfter) setSeconds(resendState.retryAfter)
  }, [resendState])

  useEffect(() => {
    if (seconds <= 0) return
    const timer = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [seconds])

  return (
    <>
      <div className="mt-4 rounded-xl border border-white/[0.08] bg-white/[0.035] px-4 py-3">
        <p className="text-xs text-[#777b85]">Код отправлен на</p>
        <p className="mt-1 break-all text-sm font-medium text-white">{email}</p>
      </div>
      <form action={action} className="mt-6 space-y-5" noValidate>
        <div>
          <label htmlFor="code" className="mb-2 block text-sm font-medium text-[#dfe1e6]">
            Код подтверждения
          </label>
          <input
            id="code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            maxLength={6}
            pattern="[0-9]{6}"
            placeholder="000000"
            aria-describedby="code-hint code-status"
            aria-invalid={state.field === 'code'}
            className="form-input code-input"
          />
          <p id="code-hint" className="mt-2 text-xs leading-5 text-[#777b85]">
            Вставьте код целиком. В тестовом Auth используйте{' '}
            <span className="font-mono text-[#b7f34a]">382914</span>.
          </p>
        </div>
        <div id="code-status">
          <StatusMessage state={state} />
        </div>
        <button type="submit" disabled={pending} className="primary-button w-full">
          {pending ? 'Проверяем…' : 'Подтвердить и войти'}
        </button>
      </form>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
        <form action={resendAction}>
          <button
            type="submit"
            disabled={seconds > 0 || resendPending}
            className="text-[#b7f34a] underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-[#666a73]"
          >
            {seconds > 0
              ? `Новый код через ${seconds} сек.`
              : resendPending
                ? 'Отправляем…'
                : 'Отправить новый код'}
          </button>
        </form>
        <Link
          href="/login"
          className="text-[#a2a5ad] underline-offset-4 hover:text-white hover:underline"
        >
          Сменить email
        </Link>
      </div>
      <StatusMessage state={resendState} />
    </>
  )
}
