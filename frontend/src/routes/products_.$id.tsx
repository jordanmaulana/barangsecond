import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "react-toastify";

import { ProductForm } from "@/features/inventory/components/product-form";
import { useProduct, useUpdateProduct } from "@/features/inventory/hooks";
import { BackLink } from "@/components/ui/back-link";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/products_/$id")({
  component: EditProductPage,
});

function EditProductPage() {
  const { id } = Route.useParams();
  const { data: product, isLoading } = useProduct(id);
  const update = useUpdateProduct(id);
  const navigate = useNavigate();

  return (
    <div className="space-y-5">
      <BackLink to="/products" label="Inventory" />
      <PageHeader title="Edit product" subtitle={product?.title} />
      {isLoading || !product ? (
        <Skeleton className="h-96 max-w-2xl" />
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
  );
}
