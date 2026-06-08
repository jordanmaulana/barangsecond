import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Package, Pencil, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "react-toastify";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { Segmented } from "@/components/ui/segmented";
import { NumCell, SortHeader, TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { SkeletonRows } from "@/components/ui/skeleton";
import { useDeleteProduct, useProducts } from "@/features/inventory/hooks";
import { PRODUCT_STATUS_LABELS } from "@/features/inventory/types";
import type { Product, ProductStatus } from "@/features/inventory/types";
import { formatIDR } from "@/lib/format";

export const Route = createFileRoute("/products")({
  component: ProductsPage,
});

type SortKey = "title" | "buy_price" | "sell_price" | "profit";

function ProductsPage() {
  const [status, setStatus] = useState<ProductStatus | "">("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "title",
    dir: "asc",
  });
  const [toDelete, setToDelete] = useState<Product | null>(null);

  const { data: products, isLoading } = useProducts(status ? { status } : undefined);
  const del = useDeleteProduct();

  const rows = useMemo(() => {
    let list = products ?? [];
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.tags.some((t) => t.name.toLowerCase().includes(q)),
      );
    }
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...list].sort((a, b) => {
      if (sort.key === "title") return a.title.localeCompare(b.title) * dir;
      return (Number(a[sort.key]) - Number(b[sort.key])) * dir;
    });
  }, [products, query, sort]);

  function toggleSort(key: SortKey) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  }

  function confirmDelete() {
    if (!toDelete) return;
    const name = toDelete.title;
    del.mutate(toDelete.id, {
      onSuccess: () => toast.success(`Deleted "${name}"`),
      onError: () => toast.error("Failed to delete"),
    });
    setToDelete(null);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        subtitle="Everything you've bought to resell."
        actions={
          <Button asChild>
            <Link to="/products/new">
              <Plus className="h-4 w-4" /> New product
            </Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented
          options={[
            { value: "", label: "All" },
            { value: "available", label: "Available" },
            { value: "sold_cash", label: "Sold (cash)" },
            { value: "ongoing_installment", label: "Installment" },
            { value: "installment_paid", label: "Paid off" },
          ]}
          value={status}
          onChange={(v) => setStatus(v as ProductStatus | "")}
        />
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search title or tag…"
          className="sm:w-72"
        />
      </div>

      <Table>
        <THead>
          <tr>
            <SortHeader label="Product" active={sort.key === "title"} dir={sort.dir} onClick={() => toggleSort("title")} />
            <TH>Tags</TH>
            <SortHeader label="Buy" align="right" active={sort.key === "buy_price"} dir={sort.dir} onClick={() => toggleSort("buy_price")} />
            <SortHeader label="Sell" align="right" active={sort.key === "sell_price"} dir={sort.dir} onClick={() => toggleSort("sell_price")} />
            <SortHeader label="Profit" align="right" active={sort.key === "profit"} dir={sort.dir} onClick={() => toggleSort("profit")} />
            <TH>Status</TH>
            <TH align="right">Actions</TH>
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
                  title={query || status ? "No matching products" : "No products yet"}
                  hint={query || status ? "Try a different filter or search." : "Add your first item to start tracking."}
                  action={
                    !query && !status ? (
                      <Button asChild size="sm">
                        <Link to="/products/new">
                          <Plus className="h-4 w-4" /> New product
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
                      <Button asChild variant="ghost" size="icon" title="Sell">
                        <Link to="/sales/new" search={{ product: p.id }}>
                          <ShoppingCart className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                    <Button asChild variant="ghost" size="icon" title="Edit">
                      <Link to="/products/$id" params={{ id: p.id }}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Delete"
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

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete product?"
        description={toDelete ? `"${toDelete.title}" will be permanently removed.` : ""}
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDelete}
      />
    </div>
  );
}
