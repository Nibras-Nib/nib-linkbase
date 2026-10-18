'use client'

import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

import { Input } from '@/components/ui/input'

type PasswordInputProps = {
  label: string
  name: string
  autoComplete: 'current-password' | 'new-password'
  hint?: string
  error?: string
  required?: boolean
  minLength?: number
}

/** Input with a button that shows or hides the typed password. */
export function PasswordInput({ label, name, autoComplete, hint, error, required, minLength }: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false)
  const Icon = isVisible ? EyeOff : Eye

  const toggle = (
    <button
      type="button"
      aria-label={isVisible ? 'Hide password' : 'Show password'}
      aria-pressed={isVisible}
      onClick={() => setIsVisible((visible) => !visible)}
      className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-sm text-fg-muted transition-colors duration-200 hover:bg-overlay-hover hover:text-fg-primary focus-visible:shadow-focus focus-visible:outline-none"
    >
      <Icon size={20} aria-hidden="true" />
    </button>
  )

  return (
    <Input
      label={label}
      name={name}
      type={isVisible ? 'text' : 'password'}
      autoComplete={autoComplete}
      hint={hint}
      error={error}
      required={required}
      minLength={minLength}
      suffix={toggle}
    />
  )
}
