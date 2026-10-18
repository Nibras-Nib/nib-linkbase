type AuthFormSkeletonProps = {
  fields: number
}

/** Placeholder with the form's footprint while search params stream in. */
export function AuthFormSkeleton({ fields }: AuthFormSkeletonProps) {
  return (
    <div aria-hidden="true" className="flex flex-col gap-5">
      {Array.from({ length: fields }, (_, index) => (
        <div key={index} className="flex flex-col gap-1.5">
          <div className="h-[17px] w-20 rounded-xs bg-surface-sunken" />
          <div className="h-[52px] rounded-md bg-surface-sunken" />
        </div>
      ))}
      <div className="h-14 rounded-md bg-surface-sunken" />
    </div>
  )
}
