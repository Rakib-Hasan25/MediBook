type ToastType = 'success' | 'error'

export default function ToastMessage({
  message,
  type,
}: {
  message: string
  type: ToastType
}) {
  if (!message) return null

  const className =
    type === 'success'
      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
      : 'bg-red-50 border-red-200 text-red-700'

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${className}`}>
      {message}
    </div>
  )
}
