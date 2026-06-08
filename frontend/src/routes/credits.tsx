import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CreditCard, ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { NumCell, TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { SkeletonRows } from "@/components/ui/skeleton";
import { useCredits } from "@/features/credit/hooks";
import { useDebounced } from "@/lib/use-debounced";
import { formatIDR } from "@/lib/format";

export const Route = createFileRoute("/credits")({
  component: CreditsPage,
});

function CreditsPage() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const search = useDebounced(query.trim(), 300);
  // Reset to first page on filter change (render-phase state adjustment).
  const filterKey = `${search}|${pageSize}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const { data, isLoading } = useCredits({
    page,
    page_size: pageSize,
    search: search || undefined,
  });
  const rows = data?.results ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Cicil" subtitle="Penjualan cicil syariah & jadwalnya." />

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
                  title={query ? "Tidak ada cicil cocok" : "Belum ada penjualan cicil"}
                  hint={query ? "Coba pencarian lain." : "Penjualan cicil muncul di sini otomatis."}
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

      <Pagination
        page={page}
        totalPages={data?.total_pages ?? 1}
        count={data?.count ?? 0}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}
