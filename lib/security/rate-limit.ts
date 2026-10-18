import 'server-only'
import { createHash } from 'node:crypto'
import { mongo } from 'mongoose'
import { headers } from 'next/headers'

import { connectToDatabase } from '@/lib/db/connect'
import { RateLimit } from '@/lib/db/models/rate-limit'

type RateLimitOptions = {
  limit: number
  windowSeconds: number
}

type RateLimitResult = {
  ok: boolean
  retryAfterSeconds: number
}

export const rateLimits = {
  signIn: { limit: 10, windowSeconds: 15 * 60 },
  signUp: { limit: 5, windowSeconds: 60 * 60 },
} satisfies Record<string, RateLimitOptions>

/** Counts one hit against `key` in the current fixed window and reports whether it's over the limit. */
export async function rateLimit(
  key: string,
  { limit, windowSeconds }: RateLimitOptions,
): Promise<RateLimitResult> {
  await connectToDatabase()

  const windowMs = windowSeconds * 1000
  const now = Date.now()
  const windowStart = new Date(Math.floor(now / windowMs) * windowMs)
  const expiresAt = new Date(windowStart.getTime() + windowMs)

  const count = await incrementWindow(key, windowStart, expiresAt)
  return {
    ok: count <= limit,
    retryAfterSeconds: Math.ceil((expiresAt.getTime() - now) / 1000),
  }
}

async function incrementWindow(key: string, windowStart: Date, expiresAt: Date): Promise<number> {
  const update = () =>
    RateLimit.findOneAndUpdate(
      { key, windowStart },
      { $inc: { count: 1 }, $setOnInsert: { expiresAt } },
      { upsert: true, returnDocument: 'after', lean: true },
    )

  try {
    const entry = await update()
    return entry?.count ?? 1
  } catch (error) {
    // Two first hits in the same window can race on the unique index; the retry finds the winner's row
    if (error instanceof mongo.MongoServerError && error.code === 11000) {
      const entry = await update()
      return entry?.count ?? 1
    }
    throw error
  }
}

/**
 * A rate-limit key for the caller's IP, hashed so raw addresses aren't stored. Takes the first
 * `x-forwarded-for` entry, which only the hosting provider's proxy may set (docs/security.md).
 */
export async function getClientIpKey(): Promise<string> {
  const headerList = await headers()
  const ip =
    headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headerList.get('x-real-ip') ||
    'unknown'
  return createHash('sha256').update(`linkbase-rate-limit:${ip}`).digest('hex')
}
