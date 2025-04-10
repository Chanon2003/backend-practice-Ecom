import { Router } from "express";
import { resendEmailOtpController, userLoginController, userRegisterController, verifyEmailController } from "../controller/user.controller.js";
import {formValidate} from '../validators/formValidate.js'
const userRouter = Router();

userRouter.post('/register',formValidate,userRegisterController)
userRouter.post('/verify-email-otp',verifyEmailController)
userRouter.post('/resend-email-verification',resendEmailOtpController)
userRouter.post('/login',userLoginController)



//ejs
userRouter.get('/verify-email', (req, res) => {
  const email = req.query.email;
  res.render('verify-email', { email });
});
userRouter.get('/register', (req, res) => {
  res.render('register');
});


export default userRouter