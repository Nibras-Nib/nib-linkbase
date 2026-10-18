import 'server-only'
import { Schema, model, models, type InferSchemaType } from 'mongoose'

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    // Never selected unless a query asks for it with `.select('+passwordHash')`
    passwordHash: { type: String, required: true, select: false },
  },
  { strict: true, timestamps: true },
)

export type UserDocument = InferSchemaType<typeof userSchema>

function compileUserModel() {
  return model('User', userSchema)
}

// `models` is typed as Model<any>; the cast keeps the reused model typed after a hot reload
export const User = (models.User as ReturnType<typeof compileUserModel> | undefined) ?? compileUserModel()
