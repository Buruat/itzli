import type { ApiErrors } from '../types'

interface Props {
  errors: ApiErrors
}

export default function ErrorList({ errors }: Props) {
  const messages = Object.entries(errors).flatMap(([field, msgs]) =>
    msgs.map(msg => `${field} ${msg}`)
  )
  if (messages.length === 0) return null
  return (
    <ul className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700 space-y-1">
      {messages.map((msg, i) => (
        <li key={i}>{msg}</li>
      ))}
    </ul>
  )
}
