import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ExternalLink, Plus, ShoppingCart } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { NumCell, TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { SkeletonRows } from "@/components/ui/skeleton";
import { useSales } from "@/features/sales/hooks";
import { formatDate, formatIDR } from "@/lib/format";

export const Route = createFileRoute("/sales")({
  component: SalesPage,
});

function SalesPage() {
  const { data: sales, isLoading } = useSales();
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sales ?? [];
    return (sales ?? []).filter(
      (s) =>
        s.product.title.toLowerCase().includes(q) ||
        s.buyer_name?.toLowerCase().includes(q),
    );
  }, [sales, query]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Penjualan"
        subtitle="Setiap transaksi tunai & kredit."
        actions={
          <Button asChild>
            <Link to="/sales/new">
              <Plus className="h-4 w-4" /> Penjualan baru
            </Link>
          </Button>
        }
      />

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
            <TH>Tipe</TH>
            <TH align="right">Harga</TH>
            <TH>Tanggal</TH>
            <TH align="right">Aksi</TH>
          </tr>
        </THead>
        <TBody>
          {isLoading ? (
            <SkeletonRows rows={6} cols={6} />
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={6}>
                <EmptyState
                  icon={ShoppingCart}
                  title={query ? "Tidak ada penjualan cocok" : "Belum ada penjualan"}
                  hint={query ? "Coba pencarian lain." : "Catat penjualan dari produk yang tersedia."}
                  action={
                    !query ? (
                      <Button asChild size="sm">
                        <Link to="/sales/new">
                          <Plus className="h-4 w-4" /> Penjualan baru
                        </Link>
                      </Button>
                    ) : undefined
                  }
                />
              </td>
            </tr>
          ) : (
            rows.map((s) => (
              <TR key={s.id}>
                <TD className="font-medium">{s.product.title}</TD>
                <TD className="text-muted-foreground">{s.buyer_name || "—"}</TD>
                <TD>
                  <Badge value={s.sale_type} label={s.sale_type === "credit" ? "Kredit" : "Tunai"} />
                </TD>
                <NumCell className="text-muted-foreground">{formatIDR(s.sale_price)}</NumCell>
                <TD className="text-muted-foreground">{formatDate(s.sold_on)}</TD>
                <TD>
                  <div className="flex justify-end">
                    {s.credit && (
                      <Button asChild variant="ghost" size="sm">
                        <Link to="/credits/$id" params={{ id: s.credit.id }}>
                          Kredit <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    )}
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
