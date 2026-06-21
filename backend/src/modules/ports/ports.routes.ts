import { Router } from "express";
import {
  createPortSchema,
  listPortsQuerySchema,
  portIdParamSchema,
  updatePortSchema,
} from "@stip/validation";
import { validate } from "../../middleware/validate.js";
import * as portsController from "./ports.controller.js";

export const portsRouter = Router();

portsRouter.get(
  "/",
  validate({ query: listPortsQuerySchema }),
  portsController.listPorts,
);

portsRouter.get(
  "/:id",
  validate({ params: portIdParamSchema }),
  portsController.getPort,
);

portsRouter.post(
  "/",
  validate({ body: createPortSchema }),
  portsController.createPort,
);

portsRouter.put(
  "/:id",
  validate({ params: portIdParamSchema, body: updatePortSchema }),
  portsController.updatePort,
);

portsRouter.delete(
  "/:id",
  validate({ params: portIdParamSchema }),
  portsController.deletePort,
);
