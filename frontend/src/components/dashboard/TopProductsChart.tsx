"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899"];

type TopProduct = { name: string; totalQuantity: number };

export function TopProductsChart({ data }: { data: TopProduct[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, left: 60, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
        <XAxis type="number" hide />
        <YAxis
          dataKey="name"
          type="category"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 13, fill: "#475569", fontWeight: 700 }}
          width={120}
        />
        <Tooltip
          cursor={{ fill: "#f1f5f9", opacity: 0.5 }}
          contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
          formatter={(value) => [`${Number(value ?? 0)} units`, "Sold"]}
          labelStyle={{ fontWeight: "bold", color: "#0f172a", marginBottom: "4px" }}
        />
        <Bar dataKey="totalQuantity" radius={[0, 6, 6, 0]} barSize={32}>
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
