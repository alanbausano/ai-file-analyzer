"use client";

import { BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ChartConfig } from "@/types/dashboard";

interface DashboardChartProps {
  config: ChartConfig;
}

export default function DashboardChart({ config }: DashboardChartProps) {
  const { type, data, xAxisKey, seriesKeys, title, description } = config;

  const renderChart = () => {
    switch (type) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
              <XAxis dataKey={xAxisKey} stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip cursor={{fill: '#27272a'}} contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '8px', color: '#f4f4f5' }} />
              {seriesKeys.map((key, i) => (
                <Bar key={key} dataKey={key} fill={i === 0 ? "#8b5cf6" : "#10b981"} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
      case "line":
        return (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
              <XAxis dataKey={xAxisKey} stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '8px', color: '#f4f4f5' }} />
              {seriesKeys.map((key, i) => (
                <Line key={key} type="monotone" dataKey={key} stroke={i === 0 ? "#8b5cf6" : "#10b981"} strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
      default:
        return <div className="text-zinc-500 h-[250px] flex items-center justify-center">Unsupported Chart Type</div>;
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-zinc-100 font-semibold">{title}</h3>
        {description && <p className="text-zinc-400 text-sm mt-1">{description}</p>}
      </div>
      {renderChart()}
    </div>
  );
}
