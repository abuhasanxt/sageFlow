import z from "zod";


export const userRegisterZodSchema=z.object({
      name: z
        .string("Name is required and must be string")
        .min(2, "Name must be at least 2 characters")
        .max(30, "Name must be at most 30 characters"),
        email:z.email(),
        password:z.string("Password is required and must be string").min(8,"Password must be at least 8 characters")
})
export const userLoginZodSchema=z.object({
        email:z.email(),
        password:z.string("Password is required and must be string").min(8,"Password must be at least 8 characters")
})
export const emailVerifyZodSchema=z.object({
        email:z.email(),
        otp:z.string("OTP is required and must be string").min(6,"OTP must be at least 6 characters")
})


export const userUpdateZodSchema=z.object({
      name: z
        .string("Name is required and must be string")
        .min(2, "Name must be at least 2 characters")
        .max(20, "Name must be at most 20 characters"),
})