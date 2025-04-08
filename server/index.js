import express from 'express';
import dotenv from 'dotenv'
import cors from 'cors'
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import helmet from 'helmet';
import userRouter from './route/user.route.js';

import path from 'path'
import { fileURLToPath } from "url";

const app = express();

dotenv.config()
app.use(express.json())
app.use(express.urlencoded({extended:true}))

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


app.use(cors({
  credentials:true,
  origin: process.env.FRONTEND_URL
}))

app.use(cookieParser())
app.use(morgan('dev'))
app.use(helmet())

app.use('/api/user',userRouter)

const PORT = process.env.PORT || 8080

app.listen(PORT,()=>{
  console.log(`Server run on Port: ${PORT}`)
})

