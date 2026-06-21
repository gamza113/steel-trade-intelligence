import type { Request, Response } from "express";
import type {
  CreateProductBody,
  ListProductsQuery,
  UpdateProductBody,
} from "@stip/validation";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as productsService from "./products.service.js";

export const listProducts = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ListProductsQuery;
  const { items, total } = await productsService.listProducts(query);

  res.json({
    data: items,
    pagination: {
      hasMore: query.offset + items.length < total,
      total,
    },
  });
});

export const getProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await productsService.getProductById(String(req.params.id));
  res.json({ data: product });
});

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as CreateProductBody;
  const product = await productsService.createProduct(body);
  res.status(201).json({ data: product });
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as UpdateProductBody;
  const product = await productsService.updateProduct(String(req.params.id), body);
  res.json({ data: product });
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  await productsService.deleteProduct(String(req.params.id));
  res.status(204).send();
});
