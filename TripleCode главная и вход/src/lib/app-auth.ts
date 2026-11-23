import 'server-only'

import { cookies } from 'next/headers'
import { JWTAuthentication } from 'payload'
import type { User } from '@/payload-types'
import { getPayloadClient } from '@/lib/payload'

export async function getCurrentUser(): Promise<User | null> {
  const token = (await cookies()).get('app-session')?.value
  if (!token) return null

  const payload = await getPayloadClient()
  const authHeaders = new Headers({ Authorization: `JWT ${token}` })
  const { user } = await JWTAuthentication({
    headers: authHeaders,
    payload,
    strategyName: 'app-users-jwt',
  })

  if (!user || user.collection !== 'users') return null
  return user as User
}
