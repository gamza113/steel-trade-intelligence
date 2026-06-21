import type {
  CreateProductInput,
  UpdateProductInput,
} from "@stip/shared-types";
import { AppError, notFoundError } from "../../errors/AppError.js";
import type { ListProductsFilters } from "./products.types.js";
import * as productsRepository from "./products.repository.js";

function mapRepositoryError(err: unknown): void {
  if (err instanceof Error && err.message === "COMPANY_NOT_FOUND") {
    throw new AppError(400, "VALIDATION_ERROR", "company_id does not exist", [
      { field: "company_id", issue: "Referenced company does not exist" },
    ]);
  }
  throw err;
}

export async function listProducts(filters: ListProductsFilters) {
  return productsRepository.listProducts(filters);
}

export async function getProductById(id: string) {
  const product = await productsRepository.findProductById(id);
  if (!product) {
    throw notFoundError("Product");
  }
  return product;
}

export async function createProduct(input: CreateProductInput) {
  try {
    return await productsRepository.createProduct(input);
  } catch (err) {
    mapRepositoryError(err);
  }
}

export async function updateProduct(id: string, input: UpdateProductInput) {
  try {
    const product = await productsRepository.updateProduct(id, input);
    if (!product) {
      throw notFoundError("Product");
    }
    return product;
  } catch (err) {
    mapRepositoryError(err);
  }
}

export async function deleteProduct(id: string) {
  const deleted = await productsRepository.deleteProduct(id);
  if (!deleted) {
    throw notFoundError("Product");
  }
}
