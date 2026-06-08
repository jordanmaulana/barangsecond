import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Package, Pencil, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "react-toastify";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { Segmented } from "@/components/ui/segmented";
import { NumCell, SortHeader, TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { SkeletonRows } from "@/components/ui/skeleton";
import { useDeleteProduct, useProducts } from "@/features/inventory/hooks";
import { PRODUCT_STATUS_LABELS } from "@/features/inventory/types";
import type { Product, ProductStatus } from "@/features/inventory/types";
import { useDebounced } from "@/lib/use-debounced";
import { formatIDR } from "@/lib/format";

export const Route = createFileRoute("/products")({
  component: ProductsPage,
});

// profit is a computed property, not a DB column, so it can't be sorted server-side.
type SortKey = "title" | "buy_price" | "sell_price";

function ProductsPage() {
  const [status, setStatus] = useState<ProductStatus | "">("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "title",
    dir: "asc",
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [toDelete, setToDelete] = useState<Product | null>(null);

  const search = useDebounced(query.trim(), 300);
  const ordering = `${sort.dir === "desc" ? "-" : ""}${sort.key}`;

  // Reset to the first page whenever the filter/sort/page-size changes
  // (render-phase state adjustment — preferred over a useEffect).
  const filterKey = `${status}|${search}|${ordering}|${pageSize}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const { data, isLoading } = useProducts({
    page,
    page_size: pageSize,
    search: search || undefined,
    ordering,
    status: status || undefined,
  });
  const del = useDeleteProduct();

  const rows = data?.results ?? [];

  function toggleSort(key: SortKey) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  }

  function confirmDelete() {
    if (!toDelete) return;
    const name = toDelete.title;
    del.mutate(toDelete.id, {
      onSuccess: () => toast.success(`"${name}" dihapus`),
      onError: () => toast.error("Gagal menghapus"),
    });
    setToDelete(null);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventaris"
        subtitle="Semua barang yang Anda beli untuk dijual lagi."
        actions={
          <Button asChild>
            <Link to="/products/new">
              <Plus className="h-4 w-4" /> Produk baru
            </Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented
          options={[
            { value: "", label: "Semua" },
            { value: "available", label: "Tersedia" },
            { value: "sold_cash", label: "Terjual (tunai)" },
            { value: "ongoing_installment", label: "Cicilan" },
            { value: "installment_paid", label: "Lunas" },
          ]}
          value={status}
          onChange={(v) => setStatus(v as ProductStatus | "")}
        />
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Cari judul atau tag…"
          className="sm:w-72"
        />
      </div>

      <Table>
        <THead>
          <tr>
            <SortHeader label="Produk" active={sort.key === "title"} dir={sort.dir} onClick={() => toggleSort("title")} />
            <TH>Tag</TH>
            <SortHeader label="Beli" align="right" active={sort.key === "buy_price"} dir={sort.dir} onClick={() => toggleSort("buy_price")} />
            <SortHeader label="Jual" align="right" active={sort.key === "sell_price"} dir={sort.dir} onClick={() => toggleSort("sell_price")} />
            <TH align="right">Laba</TH>
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
                  icon={Package}
                  title={query || status ? "Tidak ada produk cocok" : "Belum ada produk"}
                  hint={query || status ? "Coba filter atau pencarian lain." : "Tambah barang pertama untuk mulai melacak."}
                  action={
                    !query && !status ? (
                      <Button asChild size="sm">
                        <Link to="/products/new">
                          <Plus className="h-4 w-4" /> Produk baru
                        </Link>
                      </Button>
                    ) : undefined
                  }
                />
              </td>
            </tr>
          ) : (
            rows.map((p) => (
              <TR key={p.id}>
                <TD className="font-medium">{p.title}</TD>
                <TD>
                  <div className="flex flex-wrap gap-1">
                    {p.tags.map((t) => (
                      <span
                        key={t.id}
                        className="rounded-full bg-surface-muted px-2 py-0.5 text-xs text-muted-foreground"
                      >
                        {t.name}
                      </span>
                    ))}
                  </div>
                </TD>
                <NumCell className="text-muted-foreground">{formatIDR(p.buy_price)}</NumCell>
                <NumCell className="text-muted-foreground">{formatIDR(p.sell_price)}</NumCell>
                <NumCell className="font-medium text-positive">{formatIDR(p.profit)}</NumCell>
                <TD>
                  <Badge value={p.status} label={PRODUCT_STATUS_LABELS[p.status]} />
                </TD>
                <TD>
                  <div className="flex items-center justify-end gap-1">
                    {!p.is_sold && (
                      <Button asChild variant="ghost" size="icon" title="Jual">
                        <Link to="/sales/new" search={{ product: p.id }}>
                          <ShoppingCart className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                    <Button asChild variant="ghost" size="icon" title="Ubah">
                      <Link to="/products/$id" params={{ id: p.id }}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Hapus"
                      disabled={p.is_sold}
                      onClick={() => setToDelete(p)}
                      className="text-muted-foreground hover:text-negative"
                    >
                      <Trash2 className="h-4 w-4" />
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

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Hapus produk?"
        description={toDelete ? `"${toDelete.title}" akan dihapus permanen.` : ""}
        confirmLabel="Hapus"
        destructive
        onConfirm={confirmDelete}
      />
    </div>
  );
}
