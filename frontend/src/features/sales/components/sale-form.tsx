import { useState } from "react";

import { useProducts } from "@/features/inventory/hooks";
import type { SaleInput, SaleType } from "@/features/sales/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatIDR } from "@/lib/format";

interface Props {
  preselected?: string;
  submitting?: boolean;
  onSubmit: (data: SaleInput) => void;
}

type Errors = Partial<Record<"product" | "salePrice" | "total" | "down" | "tenor", string>>;

export function SaleForm({ preselected, submitting, onSubmit }: Props) {
  // Picker for available stock — pull the max page (endpoint is paginated).
  const { data: productPage } = useProducts({ status: "available", page_size: 50 });
  const products = productPage?.results;

  const [productId, setProductId] = useState(preselected ?? "");
  const [saleType, setSaleType] = useState<SaleType>("cash");
  const [salePrice, setSalePrice] = useState("");
  const [soldOn, setSoldOn] = useState(new Date().toISOString().slice(0, 10));
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [totalPrice, setTotalPrice] = useState("");
  const [downPayment, setDownPayment] = useState("");
  const [tenor, setTenor] = useState("12");
  const [errors, setErrors] = useState<Errors>({});

  const tenorN = Number(tenor) || 0;
  const financed = (Number(totalPrice) || 0) - (Number(downPayment) || 0);
  const suggestedMonthly = tenorN > 0 && financed > 0 ? Math.round(financed / tenorN) : 0;

  function validate(): Errors {
    const e: Errors = {};
    if (!productId) e.product = "Pilih produk.";
    if (!salePrice) e.salePrice = "Wajib diisi.";
    if (saleType === "credit") {
      const total = Number(totalPrice);
      const down = Number(downPayment) || 0;
      if (!totalPrice) e.total = "Wajib diisi.";
      else if (total < Number(salePrice)) e.total = "Harus ≥ harga jual.";
      if (down >= total && total > 0) e.down = "Harus lebih kecil dari total.";
      if (tenorN < 1 || tenorN > 60) e.tenor = "Antara 1 dan 60 bulan.";
    }
    return e;
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;
    onSubmit({
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
    });
  }

  return (
    <Card className="max-w-2xl">
      <CardContent className="p-6">
        <form onSubmit={submit} className="space-y-5">
          <Field label="Produk" error={errors.product} required>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih produk tersedia…" />
              </SelectTrigger>
              <SelectContent>
                {products?.length ? (
                  products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title} — {formatIDR(p.sell_price)}
                    </SelectItem>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    Tidak ada produk tersedia.
                  </div>
                )}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Metode pembayaran">
            <Segmented
              className="w-full"
              options={[
                { value: "cash", label: "Tunai" },
                { value: "credit", label: "Cicil syariah" },
              ]}
              value={saleType}
              onChange={(v) => setSaleType(v as SaleType)}
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Harga jual" htmlFor="salePrice" error={errors.salePrice} required>
              <Input
                id="salePrice"
                type="number"
                min="0"
                aria-invalid={!!errors.salePrice}
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
              />
            </Field>
            <Field label="Tanggal" htmlFor="soldOn" required>
              <Input
                id="soldOn"
                type="date"
                value={soldOn}
                onChange={(e) => setSoldOn(e.target.value)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nama pembeli" htmlFor="buyerName">
              <Input id="buyerName" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} />
            </Field>
            <Field label="Telepon pembeli" htmlFor="buyerPhone">
              <Input id="buyerPhone" value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} />
            </Field>
          </div>

          {saleType === "credit" && (
            <div className="space-y-4 rounded-[var(--radius-lg)] border border-accent/20 bg-accent-soft/40 p-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="Harga total" htmlFor="total" error={errors.total} required>
                  <Input
                    id="total"
                    type="number"
                    min="0"
                    aria-invalid={!!errors.total}
                    value={totalPrice}
                    onChange={(e) => setTotalPrice(e.target.value)}
                  />
                </Field>
                <Field label="Uang muka" htmlFor="down" error={errors.down}>
                  <Input
                    id="down"
                    type="number"
                    min="0"
                    aria-invalid={!!errors.down}
                    value={downPayment}
                    onChange={(e) => setDownPayment(e.target.value)}
                  />
                </Field>
                <Field label="Tenor (bulan)" htmlFor="tenor" error={errors.tenor} required>
                  <Input
                    id="tenor"
                    type="number"
                    min={1}
                    max={60}
                    aria-invalid={!!errors.tenor}
                    value={tenor}
                    onChange={(e) => setTenor(e.target.value)}
                  />
                </Field>
              </div>
              <div className="flex items-center justify-between rounded-[var(--radius-md)] bg-surface px-4 py-3 text-sm shadow-card">
                <span className="text-muted-foreground">Saran cicilan bulanan</span>
                <span className="tabular font-semibold text-foreground">
                  {formatIDR(suggestedMonthly)}
                  <span className="ml-1 font-normal text-muted-foreground">× {tenorN || 0} bln</span>
                </span>
              </div>
            </div>
          )}

          <div className={cn("flex justify-end border-t border-border pt-4")}>
            <Button type="submit" loading={submitting}>
              Catat penjualan
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
