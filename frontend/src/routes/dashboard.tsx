import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, CreditCard, TrendingUp, Wallet } from "lucide-react";

import { useDashboardStats } from "@/features/dashboard/hooks";
import { RevenueChart, StatusChart } from "@/features/dashboard/components/charts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { cn } from "@/lib/utils";
import { formatIDR } from "@/lib/format";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { data, isLoading } = useDashboardStats();

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle="Inventory, sales & credit at a glance." />

      {isLoading || !data ? (
        <LoadingState />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="reveal reveal-1">
              <StatCard
                label="Revenue"
                value={formatIDR(data.sales.revenue)}
                icon={TrendingUp}
                tone="accent"
                hint={`${data.sales.count} sales`}
              />
            </div>
            <div className="reveal reveal-2">
              <StatCard
                label="Profit"
                value={formatIDR(data.sales.profit)}
                icon={Wallet}
                tone="positive"
              />
            </div>
            <div className="reveal reveal-3">
              <StatCard
                label="Outstanding credit"
                value={formatIDR(data.credit.outstanding)}
                icon={CreditCard}
                tone="warning"
              />
            </div>
            <div className="reveal reveal-4">
              <StatCard
                label="Overdue installments"
                value={String(data.credit.overdue_installments)}
                icon={AlertTriangle}
                tone={data.credit.overdue_installments > 0 ? "negative" : "default"}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <MiniStat label="Cash sales" value={String(data.sales.cash)} />
            <MiniStat label="Credit sales" value={String(data.sales.credit)} />
            <MiniStat label="Stock value" value={formatIDR(data.inventory.available_buy_value)} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="reveal lg:col-span-2">
              <CardHeader>
                <CardTitle>Revenue by month</CardTitle>
              </CardHeader>
              <CardContent>
                <RevenueChart data={data.revenue_by_month} />
              </CardContent>
            </Card>
            <Card className="reveal">
              <CardHeader>
                <CardTitle>Inventory status</CardTitle>
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
        </>
      )}
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
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className={cn("h-80", "lg:col-span-2")} />
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}
