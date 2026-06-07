import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { useSales } from "@/features/sales/hooks";
import { formatDate, formatIDR } from "@/lib/format";

export const Route = createFileRoute("/sales")({
  component: SalesPage,
});

function SalesPage() {
  const { data: sales, isLoading } = useSales();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Sales</h1>
        <Link
          to="/products"
          className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          <Plus className="h-4 w-4" /> New sale
        </Link>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Buyer</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3 text-right">Price</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            )}
            {sales?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  No sales yet.
                </td>
              </tr>
            )}
            {sales?.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">
                  {s.product.title}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {s.buyer_name || "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge value={s.sale_type} />
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                  {formatIDR(s.sale_price)}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatDate(s.sold_on)}
                </td>
                <td className="px-4 py-3 text-right text-xs">
                  {s.credit && (
                    <Link
                      to="/credits/$id"
                      params={{ id: s.credit.id }}
                      className="text-blue-600 hover:underline"
                    >
                      View credit
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
