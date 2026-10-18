import { z } from 'zod'

export type FieldErrors<TFields extends string = string> = Partial<Record<TFields, string[]>>

export type ActionResult<TData = undefined, TFields extends string = string> =
  | { ok: true; data: TData }
  | {
      ok: false
      fieldErrors: FieldErrors<TFields>
      formError?: string
      values?: Partial<Record<TFields, string>>
    }

export function validationFailure<TFields extends string>(
  error: z.ZodError,
  values?: Partial<Record<TFields, string>>,
): ActionResult<never, TFields> {
  return {
    ok: false,
    fieldErrors: z.flattenError(error).fieldErrors as FieldErrors<TFields>,
    values,
  }
}

export function formFailure<TFields extends string = string>(
  formError: string,
  values?: Partial<Record<TFields, string>>,
): ActionResult<never, TFields> {
  return { ok: false, fieldErrors: {}, formError, values }
}
