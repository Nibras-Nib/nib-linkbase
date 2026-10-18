import 'server-only'
import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) throw new Error('MONGODB_URI is not set')

type MongooseCache = {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

// Cached on globalThis so hot reloads reuse the pool and concurrent first calls share one connect.
const globalForMongoose = globalThis as typeof globalThis & { mongoose?: MongooseCache }
const cache = (globalForMongoose.mongoose ??= { conn: null, promise: null })

export async function connectToDatabase() {
  if (cache.conn) return cache.conn

  // bufferCommands: false fails queries fast when disconnected instead of queuing them.
  cache.promise ??= mongoose.connect(MONGODB_URI!, { bufferCommands: false })

  try {
    cache.conn = await cache.promise
  } catch (error) {
    cache.promise = null // let the next call retry
    throw error
  }
  return cache.conn
}
