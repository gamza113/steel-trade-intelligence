import { Router } from "express";
import multer from "multer";
import * as importsController from "./imports.controller.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const allowed = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];

    if (
      allowed.includes(file.mimetype) ||
      file.originalname.toLowerCase().endsWith(".xlsx") ||
      file.originalname.toLowerCase().endsWith(".xls")
    ) {
      callback(null, true);
      return;
    }

    callback(new Error("Only Excel .xlsx files are supported"));
  },
});

export const importsRouter = Router();

importsRouter.post(
  "/excel",
  upload.single("file"),
  importsController.importExcelMaster,
);
