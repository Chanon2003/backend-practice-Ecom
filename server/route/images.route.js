import { Router } from "express";
import { upload } from "../middleware/multer.js";
import { deleteImages, updateImages, uploadImages } from "../controller/uploadImages.controller.js";

const images = Router();

//route ทดลอง images + git desktop
//upload array image []

images.post('/upload-images',upload.array('images'),uploadImages);
images.post('/update-images',upload.array('images'),updateImages);
images.delete('/delete-images',upload.array('images'),deleteImages);

export default images