import { api, appendListParams } from "@/lib/api";
import type { ListParams, PaginatedResponse } from "@/lib/api";
import type { Credit, Installment } from "@/features/credit/types";

export function listCredits(
  params?: ListParams,
): Promise<PaginatedResponse<Credit>> {
  const q = new URLSearchParams();
  appendListParams(q, params);
  const qs = q.toString();
  return api<PaginatedResponse<Credit>>(`/credits/${qs ? `?${qs}` : ""}`);
}

export function getCredit(id: string): Promise<Credit> {
  return api<Credit>(`/credits/${id}/`);
}

export function payInstallment(id: string): Promise<Installment> {
  return api<Installment>(`/installments/${id}/pay/`, { method: "POST" });
}
