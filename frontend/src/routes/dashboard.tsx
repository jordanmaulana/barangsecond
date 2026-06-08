import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, CreditCard, TrendingUp, Wallet } from "lucide-react";

import { useDashboardStats } from "@/features/dashboard/hooks";
import {
  AgingBars,
  CollectionsChart,
  ProfitByTagChart,
  RevenueChart,
  StatusChart,
} from "@/features/dashboard/components/charts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { useChartColors } from "@/lib/chart-colors";
import { cn } from "@/lib/utils";
import { formatIDR, formatPercent } from "@/lib/format";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { data, isLoading } = useDashboardStats();
  const c = useChartColors();

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dasbor" subtitle="Inventaris, penjualan & kredit sekilas." />
        <LoadingState />
      </div>
    );
  }

  const revenue = Number(data.sales.revenue);
  const margin = revenue > 0 ? Number(data.sales.profit) / revenue : 0;
  const onTime = data.credit.paid_total > 0 ? data.credit.paid_on_time / data.credit.paid_total : 0;
  const avgDays = data.inventory.avg_days_to_sell;

  const aging = data.credit.aging;
  const agingItems = [
    { label: "1–30 hari", count: aging.d1_30.count, value: aging.d1_30.amount, color: c.warning },
    { label: "31–60 hari", count: aging.d31_60.count, value: aging.d31_60.amount, color: c.negative },
    { label: "60+ hari", count: aging.d60_plus.count, value: aging.d60_plus.amount, color: c.negative },
  ];

  const stock = data.inventory.stock_aging;
  const stockItems = [
    { label: "0–30 hari", count: stock.d0_30.count, value: stock.d0_30.buy_value, color: c.positive },
    { label: "31–60 hari", count: stock.d31_60.count, value: stock.d31_60.buy_value, color: c.info },
    { label: "61–90 hari", count: stock.d61_90.count, value: stock.d61_90.buy_value, color: c.warning },
    { label: "90+ hari", count: stock.d90_plus.count, value: stock.d90_plus.buy_value, color: c.negative },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Dasbor" subtitle="Inventaris, penjualan & kredit sekilas." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="reveal reveal-1">
          <StatCard
            label="Pendapatan"
            value={formatIDR(data.sales.revenue)}
            icon={TrendingUp}
            tone="accent"
            hint={`${data.sales.count} penjualan`}
          />
        </div>
        <div className="reveal reveal-2">
          <StatCard
            label="Laba"
            value={formatIDR(data.sales.profit)}
            icon={Wallet}
            tone="positive"
            hint={`margin ${formatPercent(margin)}`}
          />
        </div>
        <div className="reveal reveal-3">
          <StatCard
            label="Sisa kredit"
            value={formatIDR(data.credit.outstanding)}
            icon={CreditCard}
            tone="warning"
          />
        </div>
        <div className="reveal reveal-4">
          <StatCard
            label="Cicilan terlambat"
            value={String(data.credit.overdue_installments)}
            icon={AlertTriangle}
            tone={data.credit.overdue_installments > 0 ? "negative" : "default"}
            hint={`${formatIDR(data.credit.overdue_amount)} berisiko`}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <MiniStat label="Penjualan tunai" value={String(data.sales.cash)} />
        <MiniStat label="Penjualan kredit" value={String(data.sales.credit)} />
        <MiniStat label="Nilai stok" value={formatIDR(data.inventory.available_buy_value)} />
        <MiniStat label="Rasio tepat waktu" value={formatPercent(onTime)} hint={`${data.credit.paid_total} lunas`} />
        <MiniStat label="Rata-rata hari terjual" value={avgDays == null ? "—" : `${avgDays} hr`} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="reveal lg:col-span-2">
          <CardHeader>
            <CardTitle>Pendapatan & laba per bulan</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={data.revenue_by_month} />
          </CardContent>
        </Card>
        <Card className="reveal">
          <CardHeader>
            <CardTitle>Status inventaris</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusChart
              available={data.inventory.available}
              soldCash={data.inventory.sold_cash}
              ongoingInstallment={data.inventory.ongoing_installment}
              installmentPaid={data.inventory.installment_paid}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="reveal lg:col-span-2">
          <CardHeader>
            <CardTitle>Prakiraan penagihan</CardTitle>
          </CardHeader>
          <CardContent>
            <CollectionsChart
              data={data.credit.collections_by_month}
              overdue={data.credit.overdue_amount}
            />
          </CardContent>
        </Card>
        <Card className="reveal">
          <CardHeader>
            <CardTitle>Umur tunggakan</CardTitle>
          </CardHeader>
          <CardContent>
            <AgingBars items={agingItems} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="reveal lg:col-span-2">
          <CardHeader>
            <CardTitle>Laba per kategori</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfitByTagChart data={data.sales.profit_by_tag} />
          </CardContent>
        </Card>
        <Card className="reveal">
          <CardHeader>
            <CardTitle>Umur stok</CardTitle>
          </CardHeader>
          <CardContent>
            <AgingBars items={stockItems} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MiniStat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4 shadow-card">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="tabular mt-1 text-lg font-semibold text-foreground">{value}</div>
      {hint && <div className="text-[0.7rem] text-muted-foreground">{hint}</div>}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
      {Array.from({ length: 3 }).map((_, row) => (
        <div key={row} className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Skeleton className={cn("h-80", "lg:col-span-2")} />
          <Skeleton className="h-80" />
        </div>
      ))}
    </div>
  );
}
