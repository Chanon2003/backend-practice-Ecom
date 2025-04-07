import { Router } from "express";
import { userRegisterController } from "../controller/user.controller.js";
const userRouter = Router();

userRouter.post('/register',userRegisterController)

export default userRouter