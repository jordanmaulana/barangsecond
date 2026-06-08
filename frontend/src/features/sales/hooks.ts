import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { createSale, getSale, listSales } from "@/features/sales/api";
import type { SaleInput } from "@/features/sales/types";
import type { ListParams } from "@/lib/api";

const SALES = ["sales"];

export function useSales(params?: ListParams) {
  return useQuery({
    queryKey: [...SALES, params ?? {}],
    queryFn: () => listSales(params),
    placeholderData: keepPreviousData,
  });
}

export function useSale(id: string) {
  return useQuery({
    queryKey: [...SALES, id],
    queryFn: () => getSale(id),
    enabled: !!id,
  });
}

export function useCreateSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SaleInput) => createSale(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SALES });
      qc.invalidateQueries({ queryKey: ["inventory", "products"] });
      qc.invalidateQueries({ queryKey: ["credit", "credits"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
