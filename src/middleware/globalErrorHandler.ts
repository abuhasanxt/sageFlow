/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from "express";
import { Prisma } from "../../generated/prisma/client";
import { envVars } from "../config/env";
import status from "http-status";
import z, { file } from "zod";
import { TErrorResponse, TErrorSources } from "../interface/error.interface";
import { handleZodError } from "../errorHelpers/handleZodError";
import AppError from "../errorHelpers/AppError";
import { deleteFileFromCloudinary } from "../config/cloudinary";


export const errorHandler = async (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (envVars.NODE=== "development") {
    console.log("Error from Global Error Handler: ", err);
  }

  if (req.file) {
    await deleteFileFromCloudinary(req.file?.path);
  }

  if (req.files && Array.isArray(req.files) && req.files.length > 0) {
    const imageUrls = req.files.map((file) => file.path);

    await Promise.all(imageUrls.map((url) => deleteFileFromCloudinary(url)));
  }
  let errorSources: TErrorSources[] = [];
  let statusCode: number = status.INTERNAL_SERVER_ERROR;
  let errorMessage: string = "internal server error";
  // const errorDetails: any = err;
  let stack: string | undefined = undefined;

  //zod validation error
  if (err instanceof z.ZodError) {
    const simplifiedError = handleZodError(err);
    statusCode = simplifiedError.statusCode as number;
    errorMessage = simplifiedError.errorMessage;
    errorSources = [...simplifiedError.errorSources];
    stack = err.stack;
  }
  //prismaClientValidationError
  else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = status.BAD_REQUEST;
    errorMessage = "you provide incorrect field type or missing fields";
  }
  //PrismaClientKnownRequestError
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025") {
      statusCode = status.NOT_FOUND;
      errorMessage =
        "An operation failed because it depends on one or more records that were required but not found";
    } else if (err.code === "P2002") {
      statusCode = status.CONFLICT;
      errorMessage = "Duplicate kye error";
    } else if (err.code === "P2003") {
      statusCode = status.BAD_REQUEST;
      errorMessage = "Foreign  kye constraint failed";
    }
  }
  //PrismaClientUnknownRequestError
  else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    statusCode = status.INTERNAL_SERVER_ERROR;
    errorMessage = "Error occurred during query execution";
  }
  //PrismaClientRustPanicError
  else if (err instanceof Prisma.PrismaClientRustPanicError) {
    statusCode = status.BAD_REQUEST;
    errorMessage =
      "The error message usually provides details about where in the internal Rust code the panic occurred, which often points to a bug in Prisma's engines rather than a user configuration error (unless the configuration is fundamentally invalid";
  }
  //PrismaClientInitializationError
  else if (err instanceof Prisma.PrismaClientInitializationError) {
    if (err.errorCode === "P1000") {
      statusCode = status.UNAUTHORIZED;
      errorMessage = "Authentication failed . please check your credentials !";
    } else if (err.errorCode === "P1001") {
      statusCode = status.SERVICE_UNAVAILABLE;
      errorMessage = "Can't reach database server !";
    }
  } else if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorMessage = err.message;
    stack = err.stack;
    errorSources = [
      {
        path: ``,
        message: err.message,
      },
    ];
  } else if (err instanceof Error) {
    statusCode = status.INTERNAL_SERVER_ERROR;
    errorMessage = err.message;
    stack = err.stack;
    errorSources = [
      {
        path: ``,
        message: err.message,
      },
    ];
  }

  const errorResponse: TErrorResponse = {
    success: false,
    errorMessage: errorMessage,
    errorSources,
    error: envVars.NODE !== "production" ? err : undefined,
    stack: envVars.NODE !== "production" ? err : undefined,
  };

  res.status(statusCode).json(errorResponse);
};
