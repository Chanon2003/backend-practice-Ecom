import multer from 'multer';
import { storage } from '../utils/cloudinary.js'; // หรือ path ที่คุณวางไฟล์ config

export const upload = multer({ storage });
