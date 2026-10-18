import 'server-only'
import { Schema, model, models, type InferSchemaType } from 'mongoose'

const rateLimitSchema = new Schema(
  {
    key: { type: String, required: true },
    windowStart: { type: Date, required: true },
    count: { type: Number, required: true, min: 0 },
    expiresAt: { type: Date, required: true },
  },
  { strict: true, timestamps: true },
)

rateLimitSchema.index({ key: 1, windowStart: 1 }, { unique: true })
// MongoDB's TTL monitor deletes each window once it has expired
rateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export type RateLimitDocument = InferSchemaType<typeof rateLimitSchema>

function compileRateLimitModel() {
  return model('RateLimit', rateLimitSchema)
}

// `models` is typed as Model<any>; the cast keeps the reused model typed after a hot reload
export const RateLimit =
  (models.RateLimit as ReturnType<typeof compileRateLimitModel> | undefined) ?? compileRateLimitModel()
