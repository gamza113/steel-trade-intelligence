import { Router } from "express";
import { companiesRouter } from "./companies/index.js";
import { competitorsRouter } from "./competitors/index.js";
import { freightRouter } from "./freight/index.js";
import { importsRouter } from "./imports/index.js";
import { matchingRouter } from "./matching/index.js";
import { portsRouter } from "./ports/index.js";
import { productsRouter } from "./products/index.js";

export const apiRouter = Router();

apiRouter.use("/companies", companiesRouter);
apiRouter.use("/ports", portsRouter);
apiRouter.use("/products", productsRouter);
apiRouter.use("/imports", importsRouter);
apiRouter.use("/matching", matchingRouter);
apiRouter.use("/competitors", competitorsRouter);
apiRouter.use("/freight", freightRouter);
