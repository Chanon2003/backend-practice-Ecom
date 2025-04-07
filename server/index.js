import express from 'express';
import dotenv from 'dotenv'
import cors from 'cors'
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import helmet from 'helmet';
import userRouter from './route/user.route.js';

const app = express();

dotenv.config()

app.use(cors({
  credentials:true,
  origin: process.env.FRONTEND_URL
}))
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(cookieParser())
app.use(morgan('dev'))
app.use(helmet())

app.use('/api/user',userRouter)

const PORT = process.env.PORT || 8080

app.listen(PORT,()=>{
  console.log(`Server run on Port: ${PORT}`)
})

