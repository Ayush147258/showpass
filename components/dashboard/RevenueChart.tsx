"use client";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type { RevenueDataPoint } from "@/types";
import { formatCurrency } from "@/lib/utils";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-navy-700 border border-white/12 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-xs text-white/50 mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-sm font-semibold">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-white/70">{p.name}:</span>
          <span style={{ color: p.color }}>
            {p.dataKey === "revenue" ? formatCurrency(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export function RevenueChart({ data }: { data: RevenueDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#FF6B35" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#00D4AA" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#00D4AA" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "rgba(255,255,255,0.35)", fontFamily: "Sora" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          yAxisId="left"
          tick={{ fontSize: 11, fill: "rgba(255,255,255,0.35)", fontFamily: "Sora" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fontSize: 11, fill: "rgba(255,255,255,0.35)", fontFamily: "Sora" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,107,53,0.2)", strokeWidth: 1 }} />
        <Area
          yAxisId="left"
          type="monotone"
          dataKey="revenue"
          name="Revenue"
          stroke="#FF6B35"
          strokeWidth={2.5}
          fill="url(#colorRevenue)"
          dot={false}
          activeDot={{ r: 5, fill: "#FF6B35", stroke: "#fff", strokeWidth: 2 }}
        />
        <Area
          yAxisId="right"
          type="monotone"
          dataKey="tickets"
          name="Tickets"
          stroke="#00D4AA"
          strokeWidth={2}
          fill="url(#colorTickets)"
          dot={false}
          activeDot={{ r: 4, fill: "#00D4AA", stroke: "#fff", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
