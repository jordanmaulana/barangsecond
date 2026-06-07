import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "react-toastify";

import { ProductForm } from "@/features/inventory/components/product-form";
import { useProduct, useUpdateProduct } from "@/features/inventory/hooks";

export const Route = createFileRoute("/products_/$id")({
  component: EditProductPage,
});

function EditProductPage() {
  const { id } = Route.useParams();
  const { data: product, isLoading } = useProduct(id);
  const update = useUpdateProduct(id);
  const navigate = useNavigate();

  return (
    <div>
      <Link
        to="/products"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" /> Inventory
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">Edit product</h1>
      <div className="mt-6">
        {isLoading || !product ? (
          <p className="text-slate-400">Loading…</p>
        ) : (
          <ProductForm
            initial={product}
            submitting={update.isPending}
            onSubmit={(data) =>
              update.mutate(data, {
                onSuccess: () => {
                  toast.success("Product updated");
                  navigate({ to: "/products" });
                },
                onError: (e) => toast.error(e.message),
              })
            }
          />
        )}
      </div>
    </div>
  );
}
