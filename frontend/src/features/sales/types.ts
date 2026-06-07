import type { Credit } from "@/features/credit/types";
import type { Product } from "@/features/inventory/types";

export type SaleType = "cash" | "credit";

export interface Sale {
  id: string;
  product: Product;
  sale_type: SaleType;
  sale_price: string;
  sold_on: string;
  buyer_name: string;
  buyer_phone: string;
  credit: Credit | null;
  created_on: string;
}

export interface CreditInput {
  total_price: string;
  down_payment?: string;
  tenor_months: number;
  monthly_amount?: string;
}

export interface SaleInput {
  product: string;
  sale_type: SaleType;
  sale_price: string;
  sold_on: string;
  buyer_name?: string;
  buyer_phone?: string;
  credit?: CreditInput;
}
