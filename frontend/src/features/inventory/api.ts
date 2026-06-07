import { api } from "@/lib/api";
import type { Product, ProductInput, Tag } from "@/features/inventory/types";

export function listProducts(params?: {
  status?: string;
  tag?: string;
}): Promise<Product[]> {
  const q = new URLSearchParams();
  if (params?.status) q.set("status", params.status);
  if (params?.tag) q.set("tag", params.tag);
  const qs = q.toString();
  return api<Product[]>(`/products/${qs ? `?${qs}` : ""}`);
}

export function getProduct(id: string): Promise<Product> {
  return api<Product>(`/products/${id}/`);
}

export function createProduct(data: ProductInput): Promise<Product> {
  return api<Product>("/products/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateProduct(
  id: string,
  data: Partial<ProductInput>,
): Promise<Product> {
  return api<Product>(`/products/${id}/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteProduct(id: string): Promise<void> {
  return api<void>(`/products/${id}/`, { method: "DELETE" });
}

export function listTags(): Promise<Tag[]> {
  return api<Tag[]>("/tags/");
}

export function createTag(name: string): Promise<Tag> {
  return api<Tag>("/tags/", { method: "POST", body: JSON.stringify({ name }) });
}
