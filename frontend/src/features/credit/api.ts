import { api } from "@/lib/api";
import type { Credit, Installment } from "@/features/credit/types";

export function listCredits(): Promise<Credit[]> {
  return api<Credit[]>("/credits/");
}

export function getCredit(id: string): Promise<Credit> {
  return api<Credit>(`/credits/${id}/`);
}

export function payInstallment(id: string): Promise<Installment> {
  return api<Installment>(`/installments/${id}/pay/`, { method: "POST" });
}
