import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts"

import type { BehaviorRecord } from "../../behavior/types/behavior-record"

type Props = {
  records: BehaviorRecord[]
}

export function IntensityChart({ records }: Props) {
  const chartData = records
    .filter((record) => record.intensity !== null && record.intensity !== undefined)
    .map((record) => ({
      date: new Date(record.created_at).toLocaleDateString("pt-BR"),
      intensity: record.intensity
    }))
    .reverse()

  if (chartData.length === 0) {
    return (
      <div className="rounded-2xl border border-blue-100 bg-white p-6 text-sm text-zinc-500 shadow-sm">
        Ainda não há dados de intensidade suficientes para gerar o gráfico.
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-blue-950">
          Evolução da intensidade
        </h3>

        <p className="text-sm text-zinc-500">
          Intensidade das observações comportamentais ao longo do tempo.
        </p>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
            />

            <YAxis
              domain={[0, 10]}
              tick={{ fontSize: 12 }}
            />

            <Tooltip />

            <Line
              type="monotone"
              dataKey="intensity"
              strokeWidth={3}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
