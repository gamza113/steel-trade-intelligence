import type { Request, Response } from "express";
import type {
  CreatePortBody,
  ListPortsQuery,
  UpdatePortBody,
} from "@stip/validation";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as portsService from "./ports.service.js";

export const listPorts = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ListPortsQuery;
  const { items, total } = await portsService.listPorts(query);

  res.json({
    data: items,
    pagination: {
      hasMore: query.offset + items.length < total,
      total,
    },
  });
});

export const getPort = asyncHandler(async (req: Request, res: Response) => {
  const port = await portsService.getPortById(String(req.params.id));
  res.json({ data: port });
});

export const createPort = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as CreatePortBody;
  const port = await portsService.createPort(body);
  res.status(201).json({ data: port });
});

export const updatePort = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as UpdatePortBody;
  const port = await portsService.updatePort(String(req.params.id), body);
  res.json({ data: port });
});

export const deletePort = asyncHandler(async (req: Request, res: Response) => {
  await portsService.deletePort(String(req.params.id));
  res.status(204).send();
});
