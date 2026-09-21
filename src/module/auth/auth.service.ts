/* eslint-disable @typescript-eslint/no-unused-vars */
import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { UpdateUser, UserData, UserLogin, VerifyEmailData } from "./auth.interface";
import bcrypt from "bcrypt";
import { tokenUtils } from "../../utils/token";
import { sendEmail } from "../../utils/email";
import { jwtUtils } from "../../utils/jwt";
import { envVars } from "../../config/env";
import { JwtPayload } from "jsonwebtoken";
import { deleteFileFromCloudinary } from "../../config/cloudinary";
import crypto from "crypto";
import axios from "axios";

const register = async (payload: UserData) => {
  const { name, email, password } = payload;
  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
  });
  if (existingUser) {
    throw new AppError(
      status.CONFLICT,
      "An account with this email already exists. please log in .",
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const result = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
    },
  });
  if (!result.email) {
    throw new AppError(status.BAD_REQUEST, "Failed to register user");
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  //otp expire - 2 minutes
  const expiresAt = new Date(Date.now() + 2 * 60 * 1000);

  //save otp
  await prisma.emailVerification.create({
    data: {
      email: normalizedEmail,
      otp,
      expiresAt,
    },
  });

  // send otp
  await sendEmail({
    to: normalizedEmail,
    subject: "Verify Your Email",
    templateName: "OTP",
    templateData: {
      user: result.name,
      otp,
    },
  });

  const { passwordHash: _, ...safeUser } = result;
  return safeUser;
};
const login = async (payload: UserLogin) => {
  const { email, password } = payload;
  const normalizedEmail = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
  });

  if (!user) {
    throw new AppError(
      status.NOT_FOUND,
      "We couldn't find an account with this email. Please sign up first",
    );
  }

  const isPasswordMatched = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordMatched) {
    throw new AppError(status.BAD_REQUEST, "Invalid email or password");
  }

  //check email verification
  if (!user.emailVerified) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    //otp expire
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000);

    //save otp
    await prisma.emailVerification.create({
      data: {
        email: normalizedEmail,
        otp,
        expiresAt,
      },
    });

    // send otp
    await sendEmail({
      to: normalizedEmail,
      subject: "Verify Your Email",
      templateName: "OTP",
      templateData: {
        user: user.name,
        otp,
      },
    });
  }

  const accessToken = tokenUtils.getAccessToken({
    userId: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
  });
  const refreshToken = tokenUtils.getRefreshToken({
    userId: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
  });

  const { passwordHash: _, ...safeUser } = user;
  return {
    ...safeUser,
    accessToken,
    refreshToken,
  };
};
const getMe = async (userId: string) => {
  const result = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });
  if (!result) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }
  const { passwordHash: _, ...safeUser } = result;
  return safeUser;
};

const verifyEmail = async (payload: VerifyEmailData) => {
  const { email, otp } = payload;
  const normalizedEmail = email.toLowerCase().trim();
  //find otp
  const verification = await prisma.emailVerification.findFirst({
    where: {
      email: normalizedEmail,
      otp,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!verification) {
    throw new AppError(status.NOT_FOUND, "Verification OTP not found");
  }

  //check otp
  if (verification.otp !== otp) {
    throw new AppError(status.BAD_REQUEST, "Invalid verification OTP .");
  }

  //check expire
  if (verification.expiresAt < new Date()) {
    throw new AppError(status.BAD_REQUEST, "Verification OTP has expired.");
  }

  //find user
  const user = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
  });

  //check user
  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found.");
  }

  //already verified
  if (user.emailVerified) {
    throw new AppError(status.BAD_REQUEST, "Email is already verified.");
  }

  //  Update user + delete OTP
  await prisma.$transaction([
    prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        emailVerified: true,
      },
    }),

    prisma.emailVerification.delete({
      where: {
        id: verification.id,
      },
    }),
  ]);
  const accessToken = tokenUtils.getAccessToken({
    userId: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
  });
  const refreshToken = tokenUtils.getRefreshToken({
    userId: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
  });
  return {
    accessToken,
    refreshToken,
    message: "Email verified successfully.",
  };
};
const getNewToken = async (refreshToken: string) => {
  if (!refreshToken) {
    throw new AppError(status.UNAUTHORIZED, "Refresh token is required");
  }

  //verify refresh token
  const verifiedToken = jwtUtils.verifyToken(
    refreshToken,
    envVars.JWT_REFRESH_SECRET,
  );

  //check verify refresh token
  if (!verifiedToken.success) {
    throw new AppError(status.UNAUTHORIZED, "Invalid or expired refresh token");
  }

  const data = verifiedToken.data as JwtPayload;

  if (!data) {
    throw new AppError(status.UNAUTHORIZED, "Invalid refresh token payload.");
  }

  const newAccessToken = tokenUtils.getAccessToken({
    userId: data.userId,
    role: data.role,
    name: data.name,
    email: data.email,
    emailVerified: data.emailVerified,
  });

  const newRefreshToken = tokenUtils.getRefreshToken({
    userId: data.userId,
    role: data.role,
    name: data.name,
    email: data.email,
    emailVerified: data.emailVerified,
  });

  return {
    newAccessToken,
    newRefreshToken,
  };
};

const logOut=async()=>{
  return{
    message:"Logged out successfully"
  }
}

const updateMe = async (userId: string, payload: UpdateUser) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  const updateData: {
    name?: string;
    image?: string;
  } = {};

  if (payload.name !== undefined) {
    updateData.name = payload.name;
  }
  if (payload.image) {
    updateData.image=payload.image
  }
  if (Object.keys(payload).length === 0) {
    throw new AppError(
      status.BAD_REQUEST,
      "Please provide at least one field to update",
    );
  }

  const isSame =
    (updateData.name === undefined || updateData.name === user.name) &&
    (updateData.image === undefined || updateData.image === user.image);

  if (isSame) {
    throw new AppError(
      status.CONFLICT,
      "Your provided data is already up to date",
    );
  }

  // Check whether new image is uploaded
  const isNewImageUploaded =
    updateData.image !== undefined &&
    updateData.image !== user.image;

  const result = await prisma.user.update({
    where: {
      id: userId,
    },
    data: updateData,
  });

    // Delete old image from Cloudinary
  if (isNewImageUploaded && user.image) {
    try {
      await deleteFileFromCloudinary(user.image);
    } catch (error) {
      console.error("Old image deletion failed:", error);
    }
  }
const { passwordHash: _, ...safeUser } = result;
  return safeUser;
};

const deleteMe=async(userId:string)=>{
  const user=await prisma.user.findUnique({
    where:{
      id:userId
    }
  })

  if (!user) {
    throw new AppError(status.NOT_FOUND,"User not found")
  }

  const result=await prisma.user.delete({
    where:{
      id:userId
    }
  })

 // Delete product image from Cloudinary
  if (user.image) {
    try {
      await deleteFileFromCloudinary(user.image);
    } catch (error) {
      console.error("Failed to delete your profile photo from Cloudinary:", error);
    }
  }

  return { message: " Deleted your profile successfully" };
}
const googleLogin = () => {
  const state = crypto.randomBytes(32).toString("hex")

  const params = new URLSearchParams({
    client_id: envVars.GOOGLE_CLIENT_ID,
    redirect_uri: envVars.GOOGLE_CALLBACK_URL,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account",
    state,
  });

  const googleAuthUrl =
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  return {
    googleAuthUrl,
    state,
  };
};
const googleCallback = async (code: string) => {
  //  Authorization Code → Google Access Token
  let googleAccessToken: string;

  try {
    const tokenResponse = await axios.post(
      "https://oauth2.googleapis.com/token",
      {
        code,
        client_id: envVars.GOOGLE_CLIENT_ID,
        client_secret: envVars.GOOGLE_CLIENT_SECRET,
        redirect_uri: envVars.GOOGLE_CALLBACK_URL,
        grant_type: "authorization_code",
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    googleAccessToken = tokenResponse.data.access_token;
  } catch (error) {
    console.error("Google Token Error:", error);

    throw new AppError(
      status.UNAUTHORIZED,
      "Failed to get Google access token",
    );
  }

  if (!googleAccessToken) {
    throw new AppError(
      status.UNAUTHORIZED,
      "Google access token not received",
    );
  }

  //  Google Access Token → Google User Info

  let googleUser;

  try {
    const userResponse = await axios.get(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${googleAccessToken}`,
        },
      },
    );

    googleUser = userResponse.data;
  } catch (error) {
    console.error("Google User Info Error:", error);

    throw new AppError(
      status.UNAUTHORIZED,
      "Failed to get Google user information",
    );
  }

  //  Validate Google User
  if (!googleUser.email) {
    throw new AppError(
      status.BAD_REQUEST,
      "Google account email not found",
    );
  }

  //  Find Existing User
  let user = await prisma.user.findUnique({
    where: {
      email: googleUser.email,
    },
  });

  // Create User if Doesn't Exist

  if (!user) {
    const randomPassword = crypto.randomBytes(32).toString("hex");

    const passwordHash = await bcrypt.hash(
      randomPassword,
      12,
    );

    user = await prisma.user.create({
      data: {
        name: googleUser.name,
        email: googleUser.email,
        image: googleUser.picture,
        emailVerified: googleUser.verified_email ?? false,
        passwordHash,
      },
    });
  }

  //  Generate YOUR Access Token
  const accessToken = tokenUtils.getAccessToken({
    userId: user.id,
    role: user.role,
    email: user.email,
  });

  // Generate YOUR Refresh Token
  const refreshToken = tokenUtils.getRefreshToken({
    userId: user.id,
    role: user.role,
    email: user.email,
  });

  // Return
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
      emailVerified: user.emailVerified,
    },
    accessToken,
    refreshToken,
  };
};
export const authService = {
  register,
  login,
  getMe,
  verifyEmail,
  getNewToken,
  logOut,
  updateMe,
  deleteMe,
  googleLogin,
  googleCallback
  
};
