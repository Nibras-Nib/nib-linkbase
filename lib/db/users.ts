import 'server-only'
import { mongo } from 'mongoose'

import { connectToDatabase } from '@/lib/db/connect'
import { User } from '@/lib/db/models/user'

export class EmailTakenError extends Error {
  constructor() {
    super('Email is already registered')
    this.name = 'EmailTakenError'
  }
}

type NewUser = {
  email: string
  passwordHash: string
}

type UserForSignIn = {
  id: string
  email: string
  passwordHash: string
}

/** Creates a user. Throws `EmailTakenError` if the email already has an account. */
export async function createUser({ email, passwordHash }: NewUser): Promise<{ id: string }> {
  await connectToDatabase()
  try {
    const user = await User.create({ email, passwordHash })
    return { id: user._id.toString() }
  } catch (error) {
    if (error instanceof mongo.MongoServerError && error.code === 11000) {
      throw new EmailTakenError()
    }
    throw error
  }
}

/**
 * Looks a user up by email for the Credentials provider. This is the one unscoped user query
 * (there's no session yet) and the only one that reads `passwordHash`. Don't reuse it elsewhere.
 */
export async function findUserForSignIn(email: string): Promise<UserForSignIn | null> {
  await connectToDatabase()
  const user = await User.findOne({ email }).select('+passwordHash').lean()
  if (!user) return null
  return {
    id: user._id.toString(),
    email: user.email,
    passwordHash: user.passwordHash,
  }
}
