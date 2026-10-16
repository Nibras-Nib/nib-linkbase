import { useId } from 'react'

type InputProps = {
  label?: string
  ariaLabel?: string
  prefix?: string
  placeholder?: string
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  hint?: string
  error?: string
  tone?: 'default' | 'light'
  type?: 'text' | 'email' | 'url' | 'search'
  name?: string
  autoComplete?: string
}

export function Input({
  label,
  ariaLabel,
  prefix,
  placeholder,
  value,
  defaultValue,
  onChange,
  hint,
  error,
  tone = 'default',
  type = 'text',
  name,
  autoComplete,
}: InputProps) {
  const hintId = useId()
  const message = error ?? hint

  const boxClasses = [
    'flex h-[52px] items-center gap-0.5 rounded-md border-[1.5px] px-4 transition-[background-color,border-color,box-shadow] duration-200',
    'focus-within:border-accent focus-within:bg-white focus-within:shadow-focus',
    error
      ? 'border-danger bg-white'
      : tone === 'light'
        ? 'border-transparent bg-white'
        : 'border-transparent bg-surface-sunken hover:bg-[#ECE0CB]',
  ].join(' ')

  return (
    <label className="flex flex-col gap-1.5 font-sans">
      {label && <span className="text-[14px] font-semibold text-fg-primary">{label}</span>}
      <span className={boxClasses}>
        {prefix && <span className="text-[16px] whitespace-nowrap text-fg-muted">{prefix}</span>}
        <input
          className="h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-[16px] font-medium text-fg-primary outline-none placeholder:text-ink-400"
          type={type}
          name={name}
          placeholder={placeholder}
          value={value}
          defaultValue={defaultValue}
          autoComplete={autoComplete}
          aria-label={label ? undefined : ariaLabel}
          aria-invalid={error ? true : undefined}
          aria-describedby={message ? hintId : undefined}
          onChange={(event) => onChange?.(event.target.value)}
        />
      </span>
      {message && (
        <span id={hintId} className={`text-[13px] ${error ? 'text-danger' : 'text-fg-muted'}`}>
          {message}
        </span>
      )}
    </label>
  )
}
