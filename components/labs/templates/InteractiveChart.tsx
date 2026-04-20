"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { InteractiveChartConfig } from "@/lib/labs/templates/registry";

interface Props {
  config: InteractiveChartConfig;
}

const COLORS = ["#6366f1", "#22d3ee", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6"];

function flattenForRecharts(config: InteractiveChartConfig) {
  if (config.datasets.length === 0) return [];
  // Merge all datasets into [{x, dataset0, dataset1, ...}]
  const xKeys = config.datasets[0].data.map((d) => d.x);
  return xKeys.map((x, i) => {
    const entry: Record<string, string | number> = { x: String(x) };
    config.datasets.forEach((ds) => {
      entry[ds.label] = ds.data[i]?.y ?? 0;
    });
    return entry;
  });
}

function flattenForPie(config: InteractiveChartConfig) {
  return config.datasets[0]?.data.map((d) => ({ name: String(d.x), value: d.y })) ?? [];
}

export default function InteractiveChart({ config }: Props) {
  const data = flattenForRecharts(config);
  const pieData = flattenForPie(config);
  const dataKeys = config.datasets.map((ds) => ds.label);

  return (
    <div className="lab-template-chart">
      <div className="lab-template-instructions md-body">
        <p>{config.instructions}</p>
      </div>

      <div className="lab-chart-wrapper">
        <ResponsiveContainer width="100%" height={320}>
          {config.chartType === "bar" ? (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="x" />
              <YAxis />
              <Tooltip />
              <Legend />
              {dataKeys.map((key, i) => (
                <Bar key={key} dataKey={key} fill={COLORS[i % COLORS.length]} />
              ))}
            </BarChart>
          ) : config.chartType === "line" ? (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="x" />
              <YAxis />
              <Tooltip />
              <Legend />
              {dataKeys.map((key, i) => (
                <Line key={key} type="monotone" dataKey={key} stroke={COLORS[i % COLORS.length]} />
              ))}
            </LineChart>
          ) : (
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={120}
                label
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
