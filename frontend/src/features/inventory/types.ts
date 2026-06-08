export type ProductStatus =
  | "available"
  | "sold_cash"
  | "ongoing_installment"
  | "installment_paid";

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  available: "Available",
  sold_cash: "Sold (cash)",
  ongoing_installment: "Installment",
  installment_paid: "Paid off",
};

export interface Tag {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  buy_price: string;
  sell_price: string;
  profit: string;
  status: ProductStatus;
  tags: Tag[];
  is_sold: boolean;
  created_on: string;
}

export interface ProductInput {
  title: string;
  description?: string;
  buy_price: string;
  sell_price: string;
  tag_ids?: string[];
}
