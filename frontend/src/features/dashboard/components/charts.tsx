import {
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
import { PieChart as PieIcon } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { useChartColors } from "@/lib/chart-colors";
import { formatIDR } from "@/lib/format";

interface TooltipBoxProps {
  active?: boolean;
  payload?: { value: number | string }[];
  label?: string;
  money?: boolean;
}

function TooltipBox({ active, payload, label, money }: TooltipBoxProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-xs shadow-float">
      <div className="mb-0.5 font-medium text-foreground">{label}</div>
      <div className="tabular text-muted-foreground">
        {money ? formatIDR(Number(payload[0].value)) : payload[0].value}
      </div>
    </div>
  );
}

export function RevenueChart({ data }: { data: { month: string; revenue: string }[] }) {
  const c = useChartColors();
  const rows = data.map((r) => ({ month: r.month, revenue: Number(r.revenue) }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={rows} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c.accent} stopOpacity={0.25} />
            <stop offset="100%" stopColor={c.accent} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={c.border} vertical={false} />
        <XAxis dataKey="month" fontSize={11} stroke={c["muted-foreground"]} tickLine={false} axisLine={false} />
        <YAxis
          fontSize={11}
          stroke={c["muted-foreground"]}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v / 1_000_000}jt`}
        />
        <Tooltip content={<TooltipBox money />} cursor={{ stroke: c.border }} />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke={c.accent}
          strokeWidth={2.5}
          dot={{ r: 3, fill: c.accent, strokeWidth: 0 }}
          activeDot={{ r: 5 }}
          fill="url(#rev)"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function StatusChart({
  available,
  soldCash,
  ongoingInstallment,
  installmentPaid,
}: {
  available: number;
  soldCash: number;
  ongoingInstallment: number;
  installmentPaid: number;
}) {
  const c = useChartColors();
  const data = [
    { name: "Available", value: available, fill: c.positive },
    { name: "Sold (cash)", value: soldCash, fill: c["muted-foreground"] },
    { name: "Installment", value: ongoingInstallment, fill: c.info },
    { name: "Paid off", value: installmentPaid, fill: c.accent },
  ].filter((d) => d.value > 0);

  if (!data.length) {
    return <EmptyState icon={PieIcon} title="No inventory yet" className="py-16" />;
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={56}
            outerRadius={88}
            paddingAngle={3}
            stroke={c.surface}
            strokeWidth={3}
          >
            {data.map((d) => (
              <Cell key={d.name} fill={d.fill} />
            ))}
          </Pie>
          <Tooltip content={<TooltipBox />} />
        </PieChart>
      </ResponsiveContainer>
      <ul className="flex w-full flex-col gap-2">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-2 text-xs">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: d.fill }}
            />
            <span className="text-muted-foreground">{d.name}</span>
            <span className="tabular ml-auto font-medium text-foreground">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
