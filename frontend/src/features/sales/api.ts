import { api, appendListParams } from "@/lib/api";
import type { ListParams, PaginatedResponse } from "@/lib/api";
import type { Sale, SaleInput } from "@/features/sales/types";

export function listSales(
  params?: ListParams,
): Promise<PaginatedResponse<Sale>> {
  const q = new URLSearchParams();
  appendListParams(q, params);
  const qs = q.toString();
  return api<PaginatedResponse<Sale>>(`/sales/${qs ? `?${qs}` : ""}`);
}

export function getSale(id: string): Promise<Sale> {
  return api<Sale>(`/sales/${id}/`);
}

export function createSale(data: SaleInput): Promise<Sale> {
  return api<Sale>("/sales/", { method: "POST", body: JSON.stringify(data) });
}
