import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { documentService } from "./document.service";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";

const createDocument=catchAsync(async(req:Request,res:Response)=>{
    const userId=req.user.userId

    const document=await documentService.createDocument(userId,req.body)
    sendResponse(res,{
        success:true,
        httpStatusCode:status.CREATED,
        message:"Document create successfully",
        data:document
    })
})


export const documentController={
    createDocument
}