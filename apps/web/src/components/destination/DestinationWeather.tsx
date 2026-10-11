import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { DestinationDetail } from "../../types/destination";

type DestinationWeatherProps = {
  monthlyMetrics: DestinationDetail["monthlyMetrics"];
};

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export const DestinationWeather = ({
  monthlyMetrics,
}: DestinationWeatherProps) => {
  const metricsByMonth = new Map(
    monthlyMetrics.map((metric) => [metric.month, metric]),
  );

  const chartData = MONTHS.map((month, index) => {
    const metrics = metricsByMonth.get(index + 1);
    return {
      month,
      high: metrics?.averageHigh ?? null,
      low: metrics?.averageLow ?? null,
    };
  });

  const hasTemperatureData = chartData.some(
    (month) => month.high !== null || month.low !== null,
  );

  return (
    <section>
      <h2 className="mb-6 text-2xl font-semibold">Weather & Climate</h2>
      <div className="rounded-xl border border-white/10 bg-slate-900 p-6">
        <h3 className="text-lg font-medium">Average Monthly Temperatures</h3>
        <p className="mt-1 mb-6 text-sm text-slate-400">
          Historical monthly averages in ºF
        </p>
        {!hasTemperatureData ? (
          <p className="text-sm text-slate-400">
            Temperature data is not yet available for this destination.
          </p>
        ) : (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 15, bottom: 5, left: 0 }}
              >
                <CartesianGrid
                  stroke="#334155"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  stroke="#94a3b8"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}º`}
                  width={45}
                  domain={["auto", "auto"]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="high"
                  name="Average High"
                  stroke="#38bdf8"
                  strokeWidth={3}
                  dot={false}
                  connectNulls={false}
                  unit="ºF"
                />
                <Line
                  type="monotone"
                  dataKey="low"
                  name="Average Low"
                  stroke="#a78bfa"
                  strokeWidth={3}
                  dot={false}
                  connectNulls={false}
                  unit="ºF"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        {hasTemperatureData && (
          <div className="mt-4 flex justify-center gap-6 text-sm">
            <span className="text-sky-400">• Average High</span>
            <span className="text-violet-400">• Average Low</span>
          </div>
        )}
      </div>
    </section>
  );
};
