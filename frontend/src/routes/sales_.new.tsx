import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "react-toastify";

import { SaleForm } from "@/features/sales/components/sale-form";
import { useCreateSale } from "@/features/sales/hooks";
import { BackLink } from "@/components/ui/back-link";
import { PageHeader } from "@/components/ui/page-header";

export const Route = createFileRoute("/sales_/new")({
  validateSearch: (s: Record<string, unknown>): { product?: string } => ({
    product: typeof s.product === "string" ? s.product : undefined,
  }),
  component: NewSalePage,
});

function NewSalePage() {
  const { product: preselected } = Route.useSearch();
  const navigate = useNavigate();
  const create = useCreateSale();

  return (
    <div className="space-y-5">
      <BackLink to="/sales" label="Sales" />
      <PageHeader title="New sale" subtitle="Record a cash or sharia-credit sale." />
      <SaleForm
        preselected={preselected}
        submitting={create.isPending}
        onSubmit={(data) =>
          create.mutate(data, {
            onSuccess: () => {
              toast.success("Sale recorded");
              navigate({ to: "/sales" });
            },
            onError: (err) => toast.error(err.message),
          })
        }
      />
    </div>
  );
}
