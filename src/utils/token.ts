import { JwtPayload, SignOptions } from "jsonwebtoken";
import { jwtUtils } from "./jwt";
import { envVars } from "../config/env";
import { Response } from "express";
import { cookiesUtils } from "./cookie";

const getAccessToken = (payload: JwtPayload) => {
  const accessToken = jwtUtils.createToken(payload, envVars.JWT_ACCESS_SECRET, {
    expiresIn: envVars.JWT_ACCESS_EXPIRES_IN,
  } as SignOptions);
  return accessToken;
};

const getRefreshToken = (payload: JwtPayload) => {
  const refreshToken = jwtUtils.createToken(
    payload,
    envVars.JWT_REFRESH_SECRET,
    { expiresIn: envVars.JWT_REFRESH_EXPIRES_IN } as SignOptions,
  );
  return refreshToken;
};

const setAccessTokenCookie = (res: Response, token: string) => {
  cookiesUtils.setCookie(res, "accessToken", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    maxAge: 1000 * 60 * 60 * 24, //1day
  });
};

const setRefreshTokenCookie = (res: Response, token: string) => {
  cookiesUtils.setCookie(res, "refreshToken", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    maxAge: 1000 * 60 * 60 * 24 * 7, //7day
  });
};

const clearAccessTokenCookie = (res: Response) => {
  cookiesUtils.clearCookie(res, "accessToken", {
    httpOnly: true,
    secure: envVars.NODE === "production",
    sameSite: envVars.NODE === "production" ? "none" : "lax",
    path: "/",
  });
};

const clearRefreshTokenCookie = (res: Response) => {
  cookiesUtils.clearCookie(res, "refreshToken", {
    httpOnly: true,
    secure: envVars.NODE === "production",
    sameSite: envVars.NODE === "production" ? "none" : "lax",
    path: "/",
  });
};

export const tokenUtils = {
  getAccessToken,
  getRefreshToken,
  setAccessTokenCookie,
  setRefreshTokenCookie,
  clearAccessTokenCookie,
  clearRefreshTokenCookie,
};
