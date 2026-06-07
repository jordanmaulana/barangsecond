import { api } from "@/lib/api";
import type { Sale, SaleInput } from "@/features/sales/types";

export function listSales(): Promise<Sale[]> {
  return api<Sale[]>("/sales/");
}

export function getSale(id: string): Promise<Sale> {
  return api<Sale>(`/sales/${id}/`);
}

export function createSale(data: SaleInput): Promise<Sale> {
  return api<Sale>("/sales/", { method: "POST", body: JSON.stringify(data) });
}
