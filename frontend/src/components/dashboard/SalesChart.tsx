"use client";

import { useState, useEffect, useId } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import type { SalesTrendPoint } from "@/types/api";
import { format, parseISO } from "date-fns";
import { BarChart3 } from "lucide-react";
import { dashboardChartEmptyClass, dashboardSkeletonClass, text } from "@/lib/theme";
import { useChartTheme } from "@/hooks/useChartTheme";
import { cn } from "@/lib/utils";

interface SalesChartProps {
  data?: SalesTrendPoint[];
  loading?: boolean;
}

function formatRevenueAxis(value: number) {
  if (value >= 1000) return `฿${value / 1000}k`;
  if (value > 0) return `฿${Math.round(value)}`;
  return "฿0";
}

export function SalesChart({ data = [], loading }: SalesChartProps) {
  const [isMounted, setIsMounted] = useState(false);
  const chartTheme = useChartTheme();
  const gradientId = useId().replace(/:/g, "");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const chartData = data.map((row) => ({
    date: format(parseISO(row.date), "EEE"),
    revenue: Number(row.total),
    orders: row.orders,
  }));

  if (!isMounted || loading) {
    return <div className={dashboardSkeletonClass("h-[350px] w-full")} />;
  }

  if (chartData.length === 0) {
    return (
      <div className={dashboardChartEmptyClass("h-[350px]")}>
        <BarChart3 className="w-10 h-10 text-[var(--text-subtle)]" aria-hidden />
        <p className={cn("text-sm font-semibold", text.primary)}>No revenue data yet</p>
        <p className={cn("text-sm", text.muted)}>Sales trends will appear once orders are recorded.</p>
      </div>
    );
  }

  return (
    <div className="h-[350px] w-full min-h-[350px] min-w-0">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={350}>
        <AreaChart
          data={chartData}
          margin={{
            top: 10,
            right: 10,
            left: 0,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartTheme.revenue} stopOpacity={0.3} />
              <stop offset="95%" stopColor={chartTheme.revenue} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.grid} />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: chartTheme.axis, fontSize: 12 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: chartTheme.axis, fontSize: 12 }}
            tickFormatter={formatRevenueAxis}
            dx={-10}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: chartTheme.tooltipBg,
              borderColor: chartTheme.tooltipBorder,
              borderRadius: "8px",
              boxShadow: chartTheme.tooltipShadow,
              color: chartTheme.tooltipFg,
            }}
            itemStyle={{ color: chartTheme.revenue, fontWeight: "bold" }}
            formatter={(value, name) => {
              const num = Number(value ?? 0);
              if (name === "revenue") return [`฿${num.toLocaleString()}`, "Revenue"];
              return [num, "Orders"];
            }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke={chartTheme.revenue}
            strokeWidth={3}
            fillOpacity={1}
            fill={`url(#${gradientId})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
