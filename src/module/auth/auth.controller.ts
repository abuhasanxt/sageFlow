import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { authService } from "./auth.service";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";
import { tokenUtils } from "../../utils/token";
import AppError from "../../errorHelpers/AppError";
import { envVars } from "../../config/env";

const register =catchAsync(async(req:Request,res:Response)=>{
    const result=await authService.register(req.body);
    sendResponse(res,{
        success:true,
        httpStatusCode:status.CREATED,
        message:"Registration successful. Please check your email for the OTP and verify your email.",
        data:result
    })
})

const login=catchAsync(async(req:Request,res:Response)=>{
    const result=await authService.login(req.body)
    const {accessToken,refreshToken,...rest}=result;
    tokenUtils.setAccessTokenCookie(res,accessToken)
    tokenUtils.setRefreshTokenCookie(res,refreshToken)
    sendResponse(res,{
        success:true,
        httpStatusCode:status.OK,
        message:"Login successfully",
        data:{
            accessToken,
            refreshToken,
            ...rest
        }
    })
})

const getMe=catchAsync(async(req:Request,res:Response)=>{
  const userId=req.user.userId
  if (!userId) {
    throw new AppError(status.UNAUTHORIZED,"You are unauthorized")
  }
  const result=await authService.getMe(userId)
  sendResponse(res,{
    success:true,
    httpStatusCode:status.OK,
    message:"Get my profile",
    data:result
  })
})

const verifyEmail=catchAsync(async(req:Request,res:Response)=>{
  const result=await authService.verifyEmail(req.body)
  const {accessToken,refreshToken,...rest}=result
  tokenUtils.setAccessTokenCookie(res,accessToken);
  tokenUtils.setRefreshTokenCookie(res,refreshToken)

  sendResponse(res,{
    success:true,
    httpStatusCode:status.OK,
    message:result.message,
    data:{
      accessToken,
      refreshToken,
      ...rest
    }
  })
})

const getNewToken=catchAsync(async(req:Request,res:Response)=>{
  const refreshToken=req.cookies.refreshToken
  const result=await authService.getNewToken(refreshToken)
  const {newAccessToken,newRefreshToken}=result;
  tokenUtils.setAccessTokenCookie(res,newAccessToken)
  tokenUtils.setRefreshTokenCookie(res,newRefreshToken);
  sendResponse(res,{
    success:true,
    httpStatusCode:status.CREATED,
    message:"New tokens generate successfully",
    data:{
      newAccessToken,
      newRefreshToken
    }
  })
})

const logout=catchAsync(async(req:Request,res:Response)=>{
  tokenUtils.clearAccessTokenCookie(res)
  tokenUtils.clearRefreshTokenCookie(res)
  
  const result=await authService.logOut()
   sendResponse(res,{
    success:true,
    httpStatusCode:status.OK,
    message:result.message,
  })

})
const updateMe=catchAsync(async(req:Request,res:Response)=>{
  const userId=req.user.userId
  if (!userId) {
    throw new AppError(status.UNAUTHORIZED,"You are unauthorized")
  }
const payload={
  ...req.body,
  image:req.file?.path
}
  const result=await authService.updateMe(userId,payload)

  sendResponse(res,{
    success:true,
    httpStatusCode:status.OK,
    message:"Profile update successfully",
    data:result
  })
})
const deleteMe=catchAsync(async(req:Request,res:Response)=>{
  const userId=req.user.userId

  if (!userId) {
    throw new AppError(status.UNAUTHORIZED,"You are unauthorized")
  }

  const result=await authService.deleteMe(userId)

  sendResponse(res,{
    success:true,
    httpStatusCode:status.OK,
    message:"Profile delete successfully",
    data:result
  })
})

const googleLogin = catchAsync(
  async (req: Request, res: Response) => {
    const { googleAuthUrl, state } = authService.googleLogin();

    // Save OAuth state
    res.cookie("google_oauth_state", state, {
      httpOnly: true,
      secure: envVars.NODE === "production",
      sameSite:
        envVars.NODE === "production"
          ? "none"
          : "lax",
      maxAge: 10 * 60 * 1000,
    });

    // Redirect user to Google
    return res.redirect(googleAuthUrl);
  },
);

const googleCallback = catchAsync(
  async (req: Request, res: Response) => {
    const { code, state, error } = req.query;
    //  Google Login Error
    if (error) {
      res.clearCookie("google_oauth_state");

      return res.redirect(
        `${envVars.FRONTEND_URL}/login?error=google_login_failed`,
      );
    }
    //  Authorization Code Check
    if (!code || typeof code !== "string") {
      throw new AppError(
        status.BAD_REQUEST,
        "Google authorization code is missing",
      );
    }
    //  State Check
    if (!state || typeof state !== "string") {
      throw new AppError(
        status.BAD_REQUEST,
        "Google OAuth state is missing",
      );
    }
    //  Compare State
    const savedState = req.cookies.google_oauth_state;

    if (!savedState || savedState !== state) {
      throw new AppError(
        status.UNAUTHORIZED,
        "Invalid Google OAuth state",
      );
    }
    //  Google Callback
    const result = await authService.googleCallback(code);

    //  Remove OAuth State Cookie
    res.clearCookie("google_oauth_state");
    //  Set Access Token Cookie
    res.cookie("accessToken", result.accessToken, {
      httpOnly: true,
      secure: envVars.NODE === "production",
      sameSite:
        envVars.NODE === "production"
          ? "none"
          : "lax",
      maxAge: 15 * 60 * 1000,
    });
    // Set Refresh Token Cookie
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: envVars.NODE === "production",
      sameSite:
        envVars.NODE === "production"
          ? "none"
          : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    // Redirect to Frontend
    return res.redirect(
      `${envVars.FRONTEND_URL}/dashboard`,
    );
  },
);
export const authController={
    register,
    login,
    getMe,
    verifyEmail,
    updateMe,
    getNewToken,
    logout,
    deleteMe,
    googleLogin,
    googleCallback
}