export type ProductStatus = "available" | "reserved" | "sold";

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
