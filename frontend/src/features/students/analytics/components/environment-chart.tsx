import {
  BarChart,
  Bar,
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

export function EnvironmentChart({ records }: Props) {
  const environmentCount = records.reduce<Record<string, number>>(
    (acc, record) => {
      if (!record.environment) {
        return acc
      }

      acc[record.environment] =
        (acc[record.environment] || 0) + 1

      return acc
    },
    {}
  )

  const chartData = Object.entries(environmentCount).map(
    ([environment, count]) => ({
      environment,
      count
    })
  )

  if (chartData.length === 0) {
    return (
      <div className="rounded-2xl border border-blue-100 bg-white p-6 text-sm text-zinc-500 shadow-sm">
        Ainda não há dados de ambiente suficientes para gerar o gráfico.
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-blue-950">
          Registros por ambiente
        </h3>

        <p className="text-sm text-zinc-500">
          Locais onde as observações comportamentais mais ocorreram.
        </p>
      </div>

      <div className="h-72">
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis
              dataKey="environment"
              tick={{ fontSize: 12 }}
            />

            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 12 }}
            />

            <Tooltip />

            <Bar
              dataKey="count"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
