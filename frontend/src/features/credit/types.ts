export type InstallmentStatus = "due" | "paid" | "overdue";

export interface Installment {
  id: string;
  sequence: number;
  due_date: string;
  amount: string;
  status: InstallmentStatus;
  paid_on: string | null;
}

export interface Credit {
  id: string;
  sale_id: string;
  product_title: string;
  buyer_name: string;
  sold_on: string;
  total_price: string;
  down_payment: string;
  tenor_months: number;
  monthly_amount: string;
  paid_amount: string;
  outstanding: string;
  is_settled: boolean;
  installments: Installment[];
}
