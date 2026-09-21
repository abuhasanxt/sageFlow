/* eslint-disable no-useless-escape */
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { cloudinaryUpload } from "./cloudinary";

const storage = new CloudinaryStorage({
  cloudinary: cloudinaryUpload,
  params: async (req, file) => {
    const originalName = file.originalname;
    const extension = originalName.split(".").pop()?.toLocaleLowerCase();

    const fileNameWithoutExtension = originalName
      .split(".")
      .slice(0, -1)
      .join(".")
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-]/g, "");

      const uniqueName=
      Math.random().toString(36).substring(2)+
      "_"+
      Date.now()+
      "_"+
      fileNameWithoutExtension

      const folder=extension==="pdf"? "pdfs":"images";

      return {
        folder: `sage-flow/${folder}`,
        public_id:uniqueName,
        resource_type:"auto"
      }
  },
});

export const multerUpload = multer({
  storage,
//   limits: {
//     fileSize: 5 * 1024 * 1024,
//   },
});
