import { NextFunction, Request, Response } from "express";
import { HttpError } from "../errors/HttpError";
import apiResponse from "../utils/apiResponse.util";
import logger from "../utils/logger.util";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // If it's our typed HttpError, use its status
  if (err instanceof HttpError) {
    const httpErr = err as HttpError;
    const details = (httpErr as any).details;
    res
      .status(httpErr.statusCode)
      .json(apiResponse.fail(httpErr.message, details));
    return;
  }

  // Unexpected error
  logger.error("Unhandled error", {
    err: err?.message || err,
    stack: err?.stack,
  });
  res.status(500).json(apiResponse.fail("Internal server error"));
};

export default errorHandler;
