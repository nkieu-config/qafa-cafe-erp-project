"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type LedgerChartPoint = {
  month: string;
  revenue: number;
  expense: number;
};

export function LedgerTrendChart({ data }: { data: LedgerChartPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis dataKey="month" tick={{ fill: "#64748b", fontWeight: "bold" }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fill: "#64748b", fontWeight: "bold" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(val) => `฿${val.toLocaleString()}`}
        />
        <Tooltip
          contentStyle={{
            borderRadius: "12px",
            border: "none",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
            fontWeight: "bold",
          }}
          formatter={(value, name) => [`฿${Number(value ?? 0).toLocaleString()}`, String(name ?? "")]}
        />
        <Legend wrapperStyle={{ fontWeight: "bold", paddingTop: "20px" }} />
        <Line
          type="monotone"
          name="Revenue"
          dataKey="revenue"
          stroke="#10b981"
          strokeWidth={4}
          dot={{ r: 4, strokeWidth: 2 }}
          activeDot={{ r: 8, strokeWidth: 0 }}
        />
        <Line
          type="monotone"
          name="Expenses (COGS + Petty Cash)"
          dataKey="expense"
          stroke="#f43f5e"
          strokeWidth={4}
          dot={{ r: 4, strokeWidth: 2 }}
          activeDot={{ r: 8, strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
