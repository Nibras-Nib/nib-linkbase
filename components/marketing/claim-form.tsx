'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

import { normalizeHandle } from '@/lib/validation/handle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type ClaimFormProps = {
  cta: string
}

export function ClaimForm({ cta }: ClaimFormProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [error, setError] = useState<string | undefined>()

  function handleChange(value: string) {
    setName(value)
    setError(undefined)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const handle = normalizeHandle(name)
    if (!handle) {
      setError('Pick a name first')
      return
    }
    // The handle isn't used at sign-up; choosing one is part of onboarding (not built yet)
    router.push('/signup')
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex w-full max-w-[560px] flex-wrap items-start gap-2.5 text-left"
    >
      <div className="min-w-0 flex-[999_1_240px]">
        <Input
          ariaLabel="Choose your username"
          prefix="linkbase.me/"
          placeholder="yourname"
          tone="light"
          name="handle"
          autoComplete="username"
          value={name}
          onChange={handleChange}
          error={error}
        />
      </div>
      <div className="flex flex-[1_0_auto]">
        <Button type="submit" size="lg" block>
          {cta}
        </Button>
      </div>
    </form>
  )
}
