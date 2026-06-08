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

interface MultiTooltipProps {
  active?: boolean;
  payload?: { name?: string; value: number | string; color?: string }[];
  label?: string;
}

function MultiTooltip({ active, payload, label }: MultiTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-xs shadow-float">
      <div className="mb-1 font-medium text-foreground">{label}</div>
      <div className="flex flex-col gap-1">
        {payload.map((p) => (
          <div key={p.name} className="flex items-center gap-2 tabular">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: p.color }} />
            <span className="capitalize text-muted-foreground">{p.name}</span>
            <span className="ml-auto font-medium text-foreground">{formatIDR(Number(p.value))}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const jt = (v: number) => `${v / 1_000_000}jt`;

export function RevenueChart({
  data,
}: {
  data: { month: string; revenue: string; profit: string }[];
}) {
  const c = useChartColors();
  const rows = data.map((r) => ({
    month: r.month,
    revenue: Number(r.revenue),
    profit: Number(r.profit),
  }));
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
          tickFormatter={jt}
        />
        <Tooltip content={<MultiTooltip />} cursor={{ stroke: c.border }} />
        <Line
          type="monotone"
          dataKey="revenue"
          name="Pendapatan"
          stroke={c.accent}
          strokeWidth={2.5}
          dot={{ r: 3, fill: c.accent, strokeWidth: 0 }}
          activeDot={{ r: 5 }}
          fill="url(#rev)"
        />
        <Line
          type="monotone"
          dataKey="profit"
          name="Laba"
          stroke={c.positive}
          strokeWidth={2.5}
          dot={{ r: 3, fill: c.positive, strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function CollectionsChart({
  data,
  overdue,
}: {
  data: { month: string; amount: string }[];
  overdue: string;
}) {
  const c = useChartColors();
  const overdueNum = Number(overdue);
  const rows = [
    ...(overdueNum > 0 ? [{ label: "Terlambat", amount: overdueNum, overdue: true }] : []),
    ...data.map((r) => ({ label: r.month, amount: Number(r.amount), overdue: false })),
  ];

  if (!rows.length) {
    return <EmptyState icon={PieIcon} title="Tidak ada cicilan mendatang" className="py-16" />;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={rows} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={c.border} vertical={false} />
        <XAxis dataKey="label" fontSize={11} stroke={c["muted-foreground"]} tickLine={false} axisLine={false} />
        <YAxis
          fontSize={11}
          stroke={c["muted-foreground"]}
          tickLine={false}
          axisLine={false}
          tickFormatter={jt}
        />
        <Tooltip content={<TooltipBox money />} cursor={{ fill: c.border, fillOpacity: 0.3 }} />
        <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
          {rows.map((r) => (
            <Cell key={r.label} fill={r.overdue ? c.negative : c.accent} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ProfitByTagChart({
  data,
}: {
  data: { tag: string; profit: string; count: number }[];
}) {
  const c = useChartColors();
  const rows = data
    .map((r) => ({ tag: r.tag, profit: Number(r.profit) }))
    .filter((r) => r.profit > 0);

  if (!rows.length) {
    return <EmptyState icon={PieIcon} title="Belum ada penjualan" className="py-16" />;
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(180, rows.length * 44)}>
      <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={c.border} horizontal={false} />
        <XAxis
          type="number"
          fontSize={11}
          stroke={c["muted-foreground"]}
          tickLine={false}
          axisLine={false}
          tickFormatter={jt}
        />
        <YAxis
          type="category"
          dataKey="tag"
          width={90}
          fontSize={11}
          stroke={c["muted-foreground"]}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<TooltipBox money />} cursor={{ fill: c.border, fillOpacity: 0.3 }} />
        <Bar dataKey="profit" fill={c.positive} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Compact proportional bars for bucketed exposure (overdue aging, stock aging). */
export function AgingBars({
  items,
}: {
  items: { label: string; count: number; value: string; color: string }[];
}) {
  const max = Math.max(...items.map((i) => Number(i.value)), 1);
  const total = items.reduce((s, i) => s + i.count, 0);

  if (!total) {
    return <EmptyState icon={PieIcon} title="Tidak ada — semua aman" className="py-12" />;
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((i) => {
        const v = Number(i.value);
        return (
          <li key={i.label} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-muted-foreground">{i.label}</span>
              <span className="tabular font-medium text-foreground">
                {formatIDR(v)}
                <span className="ml-1 text-muted-foreground">({i.count})</span>
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-border/60">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${(v / max) * 100}%`, background: i.color }}
              />
            </div>
          </li>
        );
      })}
    </ul>
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
    { name: "Tersedia", value: available, fill: c.positive },
    { name: "Terjual (tunai)", value: soldCash, fill: c["muted-foreground"] },
    { name: "Cicilan", value: ongoingInstallment, fill: c.info },
    { name: "Lunas", value: installmentPaid, fill: c.accent },
  ].filter((d) => d.value > 0);

  if (!data.length) {
    return <EmptyState icon={PieIcon} title="Belum ada inventaris" className="py-16" />;
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
