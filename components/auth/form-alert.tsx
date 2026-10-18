type FormAlertProps = {
  message: string
}

export function FormAlert({ message }: FormAlertProps) {
  return (
    <p role="alert" className="rounded-md bg-danger-soft px-4 py-3 text-[14px] font-medium text-danger">
      {message}
    </p>
  )
}
