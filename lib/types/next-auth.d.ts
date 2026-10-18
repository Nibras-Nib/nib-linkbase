import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    // `id` is the MongoDB User _id (from token.sub), set in the session callback
    user: { id: string } & DefaultSession['user']
  }
}
