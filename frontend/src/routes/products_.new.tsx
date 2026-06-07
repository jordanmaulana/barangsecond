import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "react-toastify";

import { ProductForm } from "@/features/inventory/components/product-form";
import { useCreateProduct } from "@/features/inventory/hooks";

export const Route = createFileRoute("/products_/new")({
  component: NewProductPage,
});

function NewProductPage() {
  const create = useCreateProduct();
  const navigate = useNavigate();

  return (
    <div>
      <Link
        to="/products"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" /> Inventory
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">New product</h1>
      <div className="mt-6">
        <ProductForm
          submitting={create.isPending}
          onSubmit={(data) =>
            create.mutate(data, {
              onSuccess: () => {
                toast.success("Product created");
                navigate({ to: "/products" });
              },
              onError: (e) => toast.error(e.message),
            })
          }
        />
      </div>
    </div>
  );
}
