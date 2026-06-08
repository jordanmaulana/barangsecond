import { useState } from "react";
import { Plus } from "lucide-react";

import { useCreateTag, useTags } from "@/features/inventory/hooks";
import type { Product, ProductInput } from "@/features/inventory/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatIDR } from "@/lib/format";

interface Props {
  initial?: Product;
  submitting?: boolean;
  onSubmit: (data: ProductInput) => void;
}

export function ProductForm({ initial, submitting, onSubmit }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [buyPrice, setBuyPrice] = useState(initial?.buy_price ?? "");
  const [sellPrice, setSellPrice] = useState(initial?.sell_price ?? "");
  const [selected, setSelected] = useState<string[]>(initial?.tags.map((t) => t.id) ?? []);
  const [newTag, setNewTag] = useState("");

  const { data: tags } = useTags();
  const createTag = useCreateTag();

  const profit = Number(sellPrice) - Number(buyPrice);
  const profitValid = Number.isFinite(profit) && (buyPrice !== "" || sellPrice !== "");

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  async function addTag() {
    const name = newTag.trim();
    if (!name) return;
    const tag = await createTag.mutateAsync(name);
    setSelected((s) => [...s, tag.id]);
    setNewTag("");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      title,
      description,
      buy_price: buyPrice,
      sell_price: sellPrice,
      tag_ids: selected,
    });
  }

  return (
    <Card className="max-w-2xl">
      <CardContent className="p-6">
        <form onSubmit={submit} className="space-y-5">
          <Field label="Judul" htmlFor="title" required>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="iPhone 13 Pro 256GB"
              required
            />
          </Field>

          <Field label="Deskripsi" htmlFor="desc">
            <Textarea
              id="desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kondisi, kelengkapan, catatan…"
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Harga beli" htmlFor="buy" required>
              <Input
                id="buy"
                type="number"
                min="0"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value)}
                required
              />
            </Field>
            <Field label="Harga jual" htmlFor="sell" required>
              <Input
                id="sell"
                type="number"
                min="0"
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
                required
              />
            </Field>
          </div>

          {profitValid && (
            <div className="flex items-center justify-between rounded-[var(--radius-md)] bg-surface-muted px-4 py-3 text-sm">
              <span className="text-muted-foreground">Perkiraan laba</span>
              <span
                className={cn(
                  "tabular font-semibold",
                  profit >= 0 ? "text-positive" : "text-negative",
                )}
              >
                {formatIDR(profit)}
              </span>
            </div>
          )}

          <Field label="Tag">
            <div className="flex flex-wrap gap-1.5">
              {tags?.map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => toggle(t.id)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    selected.includes(t.id)
                      ? "border-accent bg-accent-soft text-accent"
                      : "border-border bg-surface text-muted-foreground hover:border-border-strong",
                  )}
                >
                  {t.name}
                </button>
              ))}
              {!tags?.length && <span className="text-xs text-muted-foreground">Belum ada tag.</span>}
            </div>
          </Field>

          <div className="flex gap-2">
            <Input
              placeholder="Tag baru…"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={addTag}
              loading={createTag.isPending}
              className="shrink-0"
            >
              <Plus className="h-4 w-4" /> Tambah
            </Button>
          </div>

          <div className="flex justify-end border-t border-border pt-4">
            <Button type="submit" loading={submitting}>
              Simpan produk
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
