import { Router } from "express";
import {
  createProductSchema,
  listProductsQuerySchema,
  productIdParamSchema,
  updateProductSchema,
} from "@stip/validation";
import { validate } from "../../middleware/validate.js";
import * as productsController from "./products.controller.js";

export const productsRouter = Router();

productsRouter.get(
  "/",
  validate({ query: listProductsQuerySchema }),
  productsController.listProducts,
);

productsRouter.get(
  "/:id",
  validate({ params: productIdParamSchema }),
  productsController.getProduct,
);

productsRouter.post(
  "/",
  validate({ body: createProductSchema }),
  productsController.createProduct,
);

productsRouter.put(
  "/:id",
  validate({ params: productIdParamSchema, body: updateProductSchema }),
  productsController.updateProduct,
);

productsRouter.delete(
  "/:id",
  validate({ params: productIdParamSchema }),
  productsController.deleteProduct,
);
