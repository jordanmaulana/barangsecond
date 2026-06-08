import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CreditCard, ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { NumCell, TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { SkeletonRows } from "@/components/ui/skeleton";
import { useCredits } from "@/features/credit/hooks";
import { formatIDR } from "@/lib/format";

export const Route = createFileRoute("/credits")({
  component: CreditsPage,
});

function CreditsPage() {
  const { data: credits, isLoading } = useCredits();
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return credits ?? [];
    return (credits ?? []).filter(
      (c) =>
        c.product_title.toLowerCase().includes(q) ||
        c.buyer_name?.toLowerCase().includes(q),
    );
  }, [credits, query]);

  return (
    <div className="space-y-6">
      <PageHeader title="Kredit" subtitle="Penjualan kredit syariah & jadwalnya." />

      <div className="flex justify-end">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Cari produk atau pembeli…"
          className="sm:w-72"
        />
      </div>

      <Table>
        <THead>
          <tr>
            <TH>Produk</TH>
            <TH>Pembeli</TH>
            <TH align="right">Total</TH>
            <TH align="right">Sisa tagihan</TH>
            <TH align="center">Tenor</TH>
            <TH>Status</TH>
            <TH align="right">Aksi</TH>
          </tr>
        </THead>
        <TBody>
          {isLoading ? (
            <SkeletonRows rows={6} cols={7} />
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={7}>
                <EmptyState
                  icon={CreditCard}
                  title={query ? "Tidak ada kredit cocok" : "Belum ada penjualan kredit"}
                  hint={query ? "Coba pencarian lain." : "Penjualan kredit muncul di sini otomatis."}
                />
              </td>
            </tr>
          ) : (
            rows.map((c) => (
              <TR key={c.id}>
                <TD className="font-medium">{c.product_title}</TD>
                <TD className="text-muted-foreground">{c.buyer_name || "—"}</TD>
                <NumCell className="text-muted-foreground">{formatIDR(c.total_price)}</NumCell>
                <NumCell className="font-medium">{formatIDR(c.outstanding)}</NumCell>
                <TD className="text-center text-muted-foreground">{c.tenor_months} bln</TD>
                <TD>
                  <Badge
                    value={c.is_settled ? "settled" : "active"}
                    label={c.is_settled ? "Lunas" : "Aktif"}
                  />
                </TD>
                <TD>
                  <div className="flex justify-end">
                    <Button asChild variant="ghost" size="sm">
                      <Link to="/credits/$id" params={{ id: c.id }}>
                        Jadwal <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </TD>
              </TR>
            ))
          )}
        </TBody>
      </Table>
    </div>
  );
}
