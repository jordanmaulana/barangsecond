import { createFileRoute, Link } from "@tanstack/react-router";

import { Badge } from "@/components/ui/badge";
import { useCredits } from "@/features/credit/hooks";
import { formatIDR } from "@/lib/format";

export const Route = createFileRoute("/credits")({
  component: CreditsPage,
});

function CreditsPage() {
  const { data: credits, isLoading } = useCredits();

  return (
    <div>
      <h1 className="text-2xl font-semibold">Credits</h1>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Buyer</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-right">Outstanding</th>
              <th className="px-4 py-3 text-center">Tenor</th>
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
            {credits?.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  No credit sales yet.
                </td>
              </tr>
            )}
            {credits?.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">
                  {c.product_title}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {c.buyer_name || "—"}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                  {formatIDR(c.total_price)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-medium text-slate-800">
                  {formatIDR(c.outstanding)}
                </td>
                <td className="px-4 py-3 text-center text-slate-600">
                  {c.tenor_months} mo
                </td>
                <td className="px-4 py-3">
                  <Badge
                    value={c.is_settled ? "paid" : "due"}
                    label={c.is_settled ? "Settled" : "Active"}
                  />
                </td>
                <td className="px-4 py-3 text-right text-xs">
                  <Link
                    to="/credits/$id"
                    params={{ id: c.id }}
                    className="text-blue-600 hover:underline"
                  >
                    Schedule
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
