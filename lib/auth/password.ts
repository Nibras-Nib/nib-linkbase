import 'server-only'
import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto'

// OWASP-recommended scrypt cost. Stored with each hash, so it can be raised without breaking old ones.
const SCRYPT_PARAMS = { N: 2 ** 15, r: 8, p: 1 }
const KEY_LENGTH = 64
const SALT_LENGTH = 16
const MAX_MEMORY = 64 * 1024 * 1024 // N=2^15, r=8 needs 32 MiB, above Node's default limit

function deriveKey(password: string, salt: Buffer, keyLength: number, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password.normalize('NFKC'), salt, keyLength, { ...options, maxmem: MAX_MEMORY }, (error, key) => {
      if (error) reject(error)
      else resolve(key)
    })
  })
}

/** Hashes a password as `scrypt$N$r$p$<salt>$<hash>` (base64 salt and hash). */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH)
  const { N, r, p } = SCRYPT_PARAMS
  const hash = await deriveKey(password, salt, KEY_LENGTH, { N, r, p })
  return ['scrypt', N, r, p, salt.toString('base64'), hash.toString('base64')].join('$')
}

/** Checks a password against a hash from `hashPassword`, in constant time. Malformed hashes never match. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algorithm, n, r, p, saltText, hashText] = stored.split('$')
  if (algorithm !== 'scrypt' || !saltText || !hashText) return false

  const options = { N: Number(n), r: Number(r), p: Number(p) }
  if (!Object.values(options).every(Number.isSafeInteger)) return false

  const expected = Buffer.from(hashText, 'base64')
  const actual = await deriveKey(password, Buffer.from(saltText, 'base64'), expected.length, options)
  return timingSafeEqual(actual, expected)
}

let dummyHash: Promise<string> | undefined

/**
 * Runs a full password check that always fails. Call it when the email has no account, so a
 * missing user takes as long as a wrong password and response times don't reveal which emails exist.
 */
export async function verifyPasswordAgainstDummy(password: string): Promise<false> {
  dummyHash ??= hashPassword(randomBytes(SALT_LENGTH).toString('base64'))
  await verifyPassword(password, await dummyHash)
  return false
}
