import type {
  ReactNode
} from "react"

type Props = {
  icon: ReactNode
  title: string
  value: string | number
  description: string
}

export function AppointmentSummaryCard({
  icon,
  title,
  value,
  description
}: Props) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        {icon}
      </div>

      <p className="text-sm font-medium text-zinc-500">
        {title}
      </p>

      <h3 className="mt-2 text-3xl font-bold text-blue-950">
        {value}
      </h3>

      <p className="mt-1 text-sm text-zinc-500">
        {description}
      </p>
    </div>
  )
}