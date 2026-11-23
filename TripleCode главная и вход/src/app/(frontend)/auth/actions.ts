'use server'

import { randomBytes } from 'node:crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayloadClient } from '@/lib/payload'

const TEST_CODE = '382914'
const CODE_TTL = 10 * 60 * 1000
const RESEND_DELAY = 30 * 1000

export type AuthState = {
  status: 'idle' | 'success' | 'error'
  message?: string
  field?: 'email' | 'code'
  retryAfter?: number
}

function normalizeEmail(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254
}

export async function requestCode(
  _previousState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = normalizeEmail(formData.get('email'))
  if (!isValidEmail(email)) {
    return {
      status: 'error',
      field: 'email',
      message: 'Введите email в формате name@example.com.',
    }
  }

  if (email.startsWith('unavailable@')) {
    return {
      status: 'error',
      message: 'Сервис временно недоступен. Попробуйте снова через несколько минут.',
    }
  }

  const cookieStore = await cookies()
  const sentAt = Number(cookieStore.get('tc-code-sent-at')?.value ?? 0)
  const remaining = Math.ceil((RESEND_DELAY - (Date.now() - sentAt)) / 1000)
  if (remaining > 0) {
    return {
      status: 'error',
      message: `Новый код можно запросить через ${remaining} сек.`,
      retryAfter: remaining,
    }
  }

  const secure = process.env.NODE_ENV === 'production'
  cookieStore.set('tc-auth-email', email, {
    httpOnly: true,
    maxAge: 60 * 15,
    path: '/',
    sameSite: 'lax',
    secure,
  })
  cookieStore.set('tc-code-sent-at', String(Date.now()), {
    httpOnly: true,
    maxAge: 60 * 15,
    path: '/',
    sameSite: 'lax',
    secure,
  })

  redirect('/verify')
}

export async function resendCode(
  _previousState: AuthState,
  _formData: FormData,
): Promise<AuthState> {
  const cookieStore = await cookies()
  const email = cookieStore.get('tc-auth-email')?.value
  if (!email) {
    return { status: 'error', message: 'Сначала укажите email.' }
  }

  const sentAt = Number(cookieStore.get('tc-code-sent-at')?.value ?? 0)
  const remaining = Math.ceil((RESEND_DELAY - (Date.now() - sentAt)) / 1000)
  if (remaining > 0) {
    return {
      status: 'error',
      message: `Новый код можно запросить через ${remaining} сек.`,
      retryAfter: remaining,
    }
  }

  cookieStore.set('tc-code-sent-at', String(Date.now()), {
    httpOnly: true,
    maxAge: 60 * 15,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })

  return {
    status: 'success',
    message: 'Новый код отправлен.',
    retryAfter: 30,
  }
}

export async function verifyCode(
  _previousState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const rawCode = formData.get('code')
  const code = typeof rawCode === 'string' ? rawCode.replace(/\D/g, '') : ''
  const cookieStore = await cookies()
  const email = cookieStore.get('tc-auth-email')?.value
  const sentAt = Number(cookieStore.get('tc-code-sent-at')?.value ?? 0)

  if (!email) {
    return { status: 'error', message: 'Сессия входа завершена. Укажите email ещё раз.' }
  }
  if (Date.now() - sentAt > CODE_TTL) {
    return { status: 'error', field: 'code', message: 'Код истёк. Запросите новый.' }
  }
  if (code.length !== 6) {
    return { status: 'error', field: 'code', message: 'Введите все 6 цифр кода.' }
  }
  if (code !== TEST_CODE) {
    return {
      status: 'error',
      field: 'code',
      message: 'Неверный код. Проверьте цифры и попробуйте снова.',
    }
  }

  try {
    const payload = await getPayloadClient()
    const password = `${randomBytes(32).toString('base64url')}aA1!`
    const existing = await payload.find({
      collection: 'users',
      overrideAccess: true,
      limit: 1,
      where: { email: { equals: email } },
    })

    if (existing.docs[0]) {
      await payload.update({
        collection: 'users',
        id: existing.docs[0].id,
        overrideAccess: true,
        data: { password },
      })
    } else {
      await payload.create({
        collection: 'users',
        overrideAccess: true,
        data: { email, password },
      })
    }

    const result = await payload.login({
      collection: 'users',
      overrideAccess: true,
      data: { email, password },
    })
    if (!result.token) throw new Error('Payload did not return an app token')

    cookieStore.set('app-session', result.token, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 14,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
    cookieStore.delete('tc-auth-email')
    cookieStore.delete('tc-code-sent-at')
  } catch {
    return {
      status: 'error',
      message: 'Не удалось войти. Сервис временно недоступен — попробуйте ещё раз.',
    }
  }

  redirect('/profile')
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('app-session')
  redirect('/')
}
