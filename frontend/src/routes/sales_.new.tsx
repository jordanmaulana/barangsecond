import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";

import { useProducts } from "@/features/inventory/hooks";
import { useCreateSale } from "@/features/sales/hooks";
import type { SaleType } from "@/features/sales/types";
import { formatIDR } from "@/lib/format";

export const Route = createFileRoute("/sales_/new")({
  validateSearch: (s: Record<string, unknown>): { product?: string } => ({
    product: typeof s.product === "string" ? s.product : undefined,
  }),
  component: NewSalePage,
});

const field =
  "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none";

function NewSalePage() {
  const { product: preselected } = Route.useSearch();
  const navigate = useNavigate();
  const create = useCreateSale();
  const { data: products } = useProducts({ status: "available" });

  const [productId, setProductId] = useState(preselected ?? "");
  const [saleType, setSaleType] = useState<SaleType>("cash");
  const [salePrice, setSalePrice] = useState("");
  const [soldOn, setSoldOn] = useState(new Date().toISOString().slice(0, 10));
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [totalPrice, setTotalPrice] = useState("");
  const [downPayment, setDownPayment] = useState("");
  const [tenor, setTenor] = useState("12");

  const tenorN = Number(tenor) || 0;
  const financed = (Number(totalPrice) || 0) - (Number(downPayment) || 0);
  const suggestedMonthly =
    tenorN > 0 && financed > 0 ? Math.round(financed / tenorN) : 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!productId) return toast.error("Select a product");
    create.mutate(
      {
        product: productId,
        sale_type: saleType,
        sale_price: salePrice,
        sold_on: soldOn,
        buyer_name: buyerName,
        buyer_phone: buyerPhone,
        ...(saleType === "credit"
          ? {
              credit: {
                total_price: totalPrice,
                down_payment: downPayment || "0",
                tenor_months: tenorN,
              },
            }
          : {}),
      },
      {
        onSuccess: () => {
          toast.success("Sale recorded");
          navigate({ to: "/sales" });
        },
        onError: (err) => toast.error(err.message),
      },
    );
  }

  return (
    <div>
      <Link
        to="/sales"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" /> Sales
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">New sale</h1>

      <form onSubmit={submit} className="mt-6 max-w-xl space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700">Product</label>
          <select
            className={field}
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            required
          >
            <option value="">Select available product…</option>
            {products?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} — {formatIDR(p.sell_price)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          {(["cash", "credit"] as SaleType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setSaleType(t)}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium capitalize ${
                saleType === t
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200"
              }`}
            >
              {t === "credit" ? "Sharia credit" : "Cash"}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700">
              Sale price
            </label>
            <input
              type="number"
              className={field}
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Date</label>
            <input
              type="date"
              className={field}
              value={soldOn}
              onChange={(e) => setSoldOn(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700">
              Buyer name
            </label>
            <input
              className={field}
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">
              Buyer phone
            </label>
            <input
              className={field}
              value={buyerPhone}
              onChange={(e) => setBuyerPhone(e.target.value)}
            />
          </div>
        </div>

        {saleType === "credit" && (
          <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Total price
                </label>
                <input
                  type="number"
                  className={field}
                  value={totalPrice}
                  onChange={(e) => setTotalPrice(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Down payment
                </label>
                <input
                  type="number"
                  className={field}
                  value={downPayment}
                  onChange={(e) => setDownPayment(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Tenor (months)
                </label>
                <input
                  type="number"
                  min={1}
                  className={field}
                  value={tenor}
                  onChange={(e) => setTenor(e.target.value)}
                  required
                />
              </div>
            </div>
            <p className="text-sm text-slate-500">
              Suggested monthly:{" "}
              <span className="font-medium text-slate-700">
                {formatIDR(suggestedMonthly)}
              </span>{" "}
              × {tenorN || 0} months
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={create.isPending}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {create.isPending ? "Saving…" : "Record sale"}
        </button>
      </form>
    </div>
  );
}
