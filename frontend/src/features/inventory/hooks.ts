import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createProduct,
  createTag,
  deleteProduct,
  getProduct,
  listProducts,
  listTags,
  updateProduct,
  type ProductListParams,
} from "@/features/inventory/api";
import type { ProductInput } from "@/features/inventory/types";

const PRODUCTS = ["inventory", "products"];
const TAGS = ["inventory", "tags"];

export function useProducts(params?: ProductListParams) {
  return useQuery({
    queryKey: [...PRODUCTS, params ?? {}],
    queryFn: () => listProducts(params),
    placeholderData: keepPreviousData,
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: [...PRODUCTS, id],
    queryFn: () => getProduct(id),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ProductInput) => createProduct(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCTS }),
  });
}

export function useUpdateProduct(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ProductInput>) => updateProduct(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCTS }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCTS }),
  });
}

export function useTags() {
  return useQuery({ queryKey: TAGS, queryFn: listTags });
}

export function useCreateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => createTag(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: TAGS }),
  });
}
