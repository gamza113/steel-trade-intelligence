import type { CreatePortInput, UpdatePortInput } from "@stip/shared-types";
import { notFoundError } from "../../errors/AppError.js";
import type { ListPortsFilters } from "./ports.types.js";
import * as portsRepository from "./ports.repository.js";

export async function listPorts(filters: ListPortsFilters) {
  return portsRepository.listPorts(filters);
}

export async function getPortById(id: string) {
  const port = await portsRepository.findPortById(id);
  if (!port) {
    throw notFoundError("Port");
  }
  return port;
}

export async function createPort(input: CreatePortInput) {
  return portsRepository.createPort(input);
}

export async function updatePort(id: string, input: UpdatePortInput) {
  const port = await portsRepository.updatePort(id, input);
  if (!port) {
    throw notFoundError("Port");
  }
  return port;
}

export async function deletePort(id: string) {
  const deleted = await portsRepository.deletePort(id);
  if (!deleted) {
    throw notFoundError("Port");
  }
}
