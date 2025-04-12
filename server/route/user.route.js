import { Router } from "express";
import { deleteAvatar, forgotPassword, resendEmailOtpController, resetPassword, updatedAvatar, uploadAvatar, userLoginController, userLogout, userRegisterController, verifyEmailController, verifyForgotPasswordOtp } from "../controller/user.controller.js";
import {formValidate, resetPasswordValidate} from '../validators/formValidate.js'
import auth from "../middleware/auth.js";
import limiter from "../middleware/rateLimit.js";
import { upload } from "../middleware/multer.js";
const userRouter = Router();

userRouter.post('/register',formValidate,userRegisterController)
userRouter.post('/verify-email-otp',limiter,verifyEmailController)
userRouter.post('/resend-email-verification',limiter,resendEmailOtpController)
userRouter.post('/login',limiter,userLoginController)
userRouter.post('/logout', auth, userLogout); 

userRouter.post('/forgot-password', forgotPassword);
userRouter.post('/verify-forgot-password-otp',verifyForgotPasswordOtp);
userRouter.put('/reset-password',resetPasswordValidate,resetPassword);


userRouter.post('/upload-avatar',auth,upload.single('images'),uploadAvatar);
userRouter.post('/update-avatar',auth,upload.single('images'),updatedAvatar);
userRouter.post('/delete-avatar',auth,upload.single('images'),deleteAvatar);



//ejs feature product test
userRouter.get('/verify-email', (req, res) => {
  const email = req.query.email;
  res.render('verify-email', { email });
});
userRouter.get('/register', (req, res) => {
  res.render('register');
});


export default userRouter