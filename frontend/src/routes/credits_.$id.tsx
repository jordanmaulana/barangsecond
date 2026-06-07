import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "react-toastify";

import { Badge } from "@/components/ui/badge";
import { useCredit, useMarkInstallmentPaid } from "@/features/credit/hooks";
import { formatDate, formatIDR } from "@/lib/format";

export const Route = createFileRoute("/credits_/$id")({
  component: CreditDetailPage,
});

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="text-xs uppercase text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-semibold tabular-nums text-slate-800">
        {value}
      </div>
    </div>
  );
}

function CreditDetailPage() {
  const { id } = Route.useParams();
  const { data: credit, isLoading } = useCredit(id);
  const pay = useMarkInstallmentPaid();

  if (isLoading || !credit) {
    return <p className="text-slate-400">Loading…</p>;
  }

  return (
    <div>
      <Link
        to="/credits"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" /> Credits
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">{credit.product_title}</h1>
      <p className="text-sm text-slate-500">
        {credit.buyer_name || "—"} · sold {formatDate(credit.sold_on)}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Total" value={formatIDR(credit.total_price)} />
        <Stat label="Down payment" value={formatIDR(credit.down_payment)} />
        <Stat label="Paid" value={formatIDR(credit.paid_amount)} />
        <Stat label="Outstanding" value={formatIDR(credit.outstanding)} />
      </div>

      <h2 className="mt-8 text-sm font-semibold uppercase text-slate-500">
        Installment schedule
      </h2>
      <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Due date</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Paid on</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {credit.installments.map((i) => (
              <tr key={i.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-500">{i.sequence}</td>
                <td className="px-4 py-3 text-slate-600">
                  {formatDate(i.due_date)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                  {formatIDR(i.amount)}
                </td>
                <td className="px-4 py-3">
                  <Badge value={i.status} />
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {formatDate(i.paid_on)}
                </td>
                <td className="px-4 py-3 text-right">
                  {i.status !== "paid" && (
                    <button
                      onClick={() =>
                        pay.mutate(i.id, {
                          onSuccess: () => toast.success("Marked paid"),
                          onError: (e) => toast.error(e.message),
                        })
                      }
                      disabled={pay.isPending}
                      className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                    >
                      Mark paid
                    </button>
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
