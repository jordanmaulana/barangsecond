import { useState } from "react";

import { useCreateTag, useTags } from "@/features/inventory/hooks";
import type { Product, ProductInput } from "@/features/inventory/types";
import { cn } from "@/lib/utils";

interface Props {
  initial?: Product;
  submitting?: boolean;
  onSubmit: (data: ProductInput) => void;
}

const field =
  "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none";

export function ProductForm({ initial, submitting, onSubmit }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [buyPrice, setBuyPrice] = useState(initial?.buy_price ?? "");
  const [sellPrice, setSellPrice] = useState(initial?.sell_price ?? "");
  const [selected, setSelected] = useState<string[]>(
    initial?.tags.map((t) => t.id) ?? [],
  );
  const [newTag, setNewTag] = useState("");

  const { data: tags } = useTags();
  const createTag = useCreateTag();

  function toggle(id: string) {
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
    );
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
    <form onSubmit={submit} className="max-w-xl space-y-4">
      <div>
        <label className="text-sm font-medium text-slate-700">Title</label>
        <input
          className={field}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700">Description</label>
        <textarea
          className={field}
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-700">Buy price</label>
          <input
            type="number"
            className={field}
            value={buyPrice}
            onChange={(e) => setBuyPrice(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Sell price</label>
          <input
            type="number"
            className={field}
            value={sellPrice}
            onChange={(e) => setSellPrice(e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">Tags</label>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {tags?.map((t) => (
            <button
              type="button"
              key={t.id}
              onClick={() => toggle(t.id)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium",
                selected.includes(t.id)
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200",
              )}
            >
              {t.name}
            </button>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            className={field}
            placeholder="New tag…"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
          />
          <button
            type="button"
            onClick={addTag}
            className="shrink-0 rounded-md border border-slate-300 px-3 text-sm text-slate-600 hover:bg-slate-50"
          >
            Add
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {submitting ? "Saving…" : "Save product"}
      </button>
    </form>
  );
}
