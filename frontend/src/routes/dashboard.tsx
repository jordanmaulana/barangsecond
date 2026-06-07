import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useDashboardStats } from "@/features/dashboard/hooks";
import { formatIDR } from "@/lib/format";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

const STATUS_COLORS = ["#10b981", "#f59e0b", "#94a3b8"];

function Card({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white p-4 ${className}`}
    >
      {title && (
        <div className="mb-3 text-sm font-semibold text-slate-700">{title}</div>
      )}
      {children}
    </div>
  );
}

function Metric({
  label,
  value,
  accent = "text-slate-800",
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <Card>
      <div className="text-xs uppercase text-slate-500">{label}</div>
      <div className={`mt-1 text-2xl font-semibold tabular-nums ${accent}`}>
        {value}
      </div>
    </Card>
  );
}

function DashboardPage() {
  const { data, isLoading } = useDashboardStats();

  if (isLoading || !data) {
    return <p className="text-slate-400">Loading…</p>;
  }

  const statusData = [
    { name: "Available", value: data.inventory.available },
    { name: "Reserved", value: data.inventory.reserved },
    { name: "Sold", value: data.inventory.sold },
  ].filter((d) => d.value > 0);

  const revenueData = data.revenue_by_month.map((r) => ({
    month: r.month,
    revenue: Number(r.revenue),
  }));

  return (
    <div>
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Revenue" value={formatIDR(data.sales.revenue)} />
        <Metric
          label="Profit"
          value={formatIDR(data.sales.profit)}
          accent="text-emerald-600"
        />
        <Metric
          label="Outstanding credit"
          value={formatIDR(data.credit.outstanding)}
          accent="text-amber-600"
        />
        <Metric
          label="Overdue installments"
          value={String(data.credit.overdue_installments)}
          accent={
            data.credit.overdue_installments > 0
              ? "text-rose-600"
              : "text-slate-800"
          }
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-slate-600 lg:grid-cols-4">
        <Card>
          {data.sales.count} sales · {data.sales.cash} cash / {data.sales.credit}{" "}
          credit
        </Card>
        <Card>
          Stock value (available):{" "}
          <span className="font-medium text-slate-800">
            {formatIDR(data.inventory.available_buy_value)}
          </span>
        </Card>
        <Card className="col-span-2">
          {data.inventory.available} available · {data.inventory.reserved}{" "}
          reserved · {data.inventory.sold} sold
        </Card>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card title="Revenue by month" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" fontSize={12} stroke="#94a3b8" />
              <YAxis
                fontSize={12}
                stroke="#94a3b8"
                tickFormatter={(v) => `${v / 1_000_000}jt`}
              />
              <Tooltip formatter={(v) => formatIDR(Number(v))} />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#0f172a"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Inventory status">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={statusData}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
              >
                {statusData.map((_, i) => (
                  <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="mt-3">
        <Card title="Sales by tag">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.sales_by_tag}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="tag" fontSize={12} stroke="#94a3b8" />
              <YAxis fontSize={12} stroke="#94a3b8" allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
