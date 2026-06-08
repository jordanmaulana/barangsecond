import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { getCredit, listCredits, payInstallment } from "@/features/credit/api";
import type { ListParams } from "@/lib/api";

const CREDITS = ["credit", "credits"];

export function useCredits(params?: ListParams) {
  return useQuery({
    queryKey: [...CREDITS, params ?? {}],
    queryFn: () => listCredits(params),
    placeholderData: keepPreviousData,
  });
}

export function useCredit(id: string) {
  return useQuery({
    queryKey: [...CREDITS, id],
    queryFn: () => getCredit(id),
    enabled: !!id,
  });
}

export function useMarkInstallmentPaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => payInstallment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CREDITS });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
