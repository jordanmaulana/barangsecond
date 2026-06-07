import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { useDeleteProduct, useProducts } from "@/features/inventory/hooks";
import type { ProductStatus } from "@/features/inventory/types";
import { formatIDR } from "@/lib/format";

export const Route = createFileRoute("/products")({
  component: ProductsPage,
});

const FILTERS: { value: ProductStatus | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "available", label: "Available" },
  { value: "reserved", label: "Reserved" },
  { value: "sold", label: "Sold" },
];

function ProductsPage() {
  const [status, setStatus] = useState<ProductStatus | "">("");
  const { data: products, isLoading } = useProducts(
    status ? { status } : undefined,
  );
  const del = useDeleteProduct();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Inventory</h1>
        <Link
          to="/products/new"
          className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          <Plus className="h-4 w-4" /> New product
        </Link>
      </div>

      <div className="mt-4 flex gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatus(f.value)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              status === f.value
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Tags</th>
              <th className="px-4 py-3 text-right">Buy</th>
              <th className="px-4 py-3 text-right">Sell</th>
              <th className="px-4 py-3 text-right">Profit</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            )}
            {products?.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  No products yet.
                </td>
              </tr>
            )}
            {products?.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">{p.title}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {p.tags.map((t) => (
                      <span
                        key={t.id}
                        className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600"
                      >
                        {t.name}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                  {formatIDR(p.buy_price)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                  {formatIDR(p.sell_price)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-medium text-emerald-600">
                  {formatIDR(p.profit)}
                </td>
                <td className="px-4 py-3">
                  <Badge value={p.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-3 text-xs">
                    {!p.is_sold && (
                      <Link
                        to="/sales/new"
                        search={{ product: p.id }}
                        className="text-blue-600 hover:underline"
                      >
                        Sell
                      </Link>
                    )}
                    <Link
                      to="/products/$id"
                      params={{ id: p.id }}
                      className="text-slate-600 hover:underline"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${p.title}"?`)) del.mutate(p.id);
                      }}
                      className="text-rose-600 hover:underline disabled:opacity-40"
                      disabled={p.is_sold}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
