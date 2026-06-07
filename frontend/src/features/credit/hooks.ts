import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getCredit, listCredits, payInstallment } from "@/features/credit/api";

const CREDITS = ["credit", "credits"];

export function useCredits() {
  return useQuery({ queryKey: CREDITS, queryFn: listCredits });
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
