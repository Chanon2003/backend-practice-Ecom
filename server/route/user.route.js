import { Router } from "express";
import { forgotPassword, resendEmailOtpController, resetPassword, userLoginController, userLogout, userRegisterController, verifyEmailController, verifyForgotPasswordOtp } from "../controller/user.controller.js";
import {formValidate, resetPasswordValidate} from '../validators/formValidate.js'
import auth from "../middleware/auth.js";
import limiter from "../middleware/rateLimit.js";
const userRouter = Router();

userRouter.post('/register',formValidate,userRegisterController)
userRouter.post('/verify-email-otp',limiter,verifyEmailController)
userRouter.post('/resend-email-verification',limiter,resendEmailOtpController)
userRouter.post('/login',limiter,userLoginController)
userRouter.post('/logout', auth, userLogout); 

userRouter.post('/forgot-password', forgotPassword);
userRouter.post('/verify-forgot-password-otp',verifyForgotPasswordOtp);
userRouter.put('/reset-password',resetPasswordValidate,resetPassword);


//ejs
userRouter.get('/verify-email', (req, res) => {
  const email = req.query.email;
  res.render('verify-email', { email });
});
userRouter.get('/register', (req, res) => {
  res.render('register');
});


export default userRouter