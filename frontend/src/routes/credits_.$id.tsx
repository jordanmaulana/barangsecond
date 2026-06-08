import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock, Coins, Wallet, Receipt } from "lucide-react";

import { useCredit } from "@/features/credit/hooks";
import { InstallmentTable } from "@/features/credit/components/installment-table";
import { Badge } from "@/components/ui/badge";
import { BackLink } from "@/components/ui/back-link";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { formatDate, formatIDR } from "@/lib/format";

export const Route = createFileRoute("/credits_/$id")({
  component: CreditDetailPage,
});

function CreditDetailPage() {
  const { id } = Route.useParams();
  const { data: credit, isLoading } = useCredit(id);

  if (isLoading || !credit) {
    return (
      <div className="space-y-5">
        <BackLink to="/credits" label="Cicil" />
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackLink to="/credits" label="Cicil" />
      <PageHeader
        title={credit.product_title}
        subtitle={`${credit.buyer_name || "—"} · terjual ${formatDate(credit.sold_on)} · ${credit.tenor_months} bulan`}
        actions={
          <Badge
            value={credit.is_settled ? "settled" : "active"}
            label={credit.is_settled ? "Lunas" : "Aktif"}
          />
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total" value={formatIDR(credit.total_price)} icon={Receipt} />
        <StatCard label="Uang muka" value={formatIDR(credit.down_payment)} icon={Coins} />
        <StatCard label="Terbayar" value={formatIDR(credit.paid_amount)} icon={Wallet} tone="positive" />
        <StatCard
          label="Sisa tagihan"
          value={formatIDR(credit.outstanding)}
          icon={CalendarClock}
          tone={credit.is_settled ? "positive" : "warning"}
        />
      </div>

      <div className="space-y-3">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Jadwal cicilan
        </h2>
        <InstallmentTable installments={credit.installments} />
      </div>
    </div>
  );
}
