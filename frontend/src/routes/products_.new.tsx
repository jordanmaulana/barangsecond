import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "react-toastify";

import { ProductForm } from "@/features/inventory/components/product-form";
import { useCreateProduct } from "@/features/inventory/hooks";
import { BackLink } from "@/components/ui/back-link";
import { PageHeader } from "@/components/ui/page-header";

export const Route = createFileRoute("/products_/new")({
  component: NewProductPage,
});

function NewProductPage() {
  const create = useCreateProduct();
  const navigate = useNavigate();

  return (
    <div className="space-y-5">
      <BackLink to="/products" label="Inventaris" />
      <PageHeader title="Produk baru" subtitle="Tambah barang ke inventaris Anda." />
      <ProductForm
        submitting={create.isPending}
        onSubmit={(data) =>
          create.mutate(data, {
            onSuccess: () => {
              toast.success("Produk dibuat");
              navigate({ to: "/products" });
            },
            onError: (e) => toast.error(e.message),
          })
        }
      />
    </div>
  );
}
