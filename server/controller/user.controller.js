import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient();
import bcrypt from 'bcrypt';
import xss from 'xss';
import { validationResult } from "express-validator";
import sendEmail from '../config/sendEmail.js';
import  { verifyEmailTemplatesoi } from '../utils/verifyEmailTemplate.js';
import { generateOtp } from '../utils/generatedOtp.js';
import generatedAccessToken from '../utils/generateToken/generatedAccessToken.js';


export const userRegisterController = async (req, res) => {
  try {
    const { password, name, email } = req.body;

    const sanitizedName = xss(name);  // sanitize name
    const sanitizedEmail = xss(email);  // sanitize email
    
    if (!sanitizedEmail || !password) {
      return res.status(400).json({ message: "Email and password are required!" });
    }
  
    // ตรวจสอบว่า email ซ้ำในฐานข้อมูลหรือไม่
    const userOldEmail = await prisma.user.findFirst({
      where: { email: sanitizedEmail }
    });
  
    if (userOldEmail) {
      return res.status(400).json({ message: "Email already exists!" });
    }
  
    // ตรวจสอบ validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
  
    // **แฮช password** ก่อนเก็บในฐานข้อมูล
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // บันทึกผู้ใช้ใหม่ในฐานข้อมูล (พร้อมแฮชรหัสผ่าน)
    const user = await prisma.user.create({
      data: {
        email: sanitizedEmail,
        name: sanitizedName,
        password: hashedPassword,  // บันทึก hashed password
      }
    });

    console.log('before otp')
    const otp = generateOtp();
    const expiry = new Date(Date.now() + 1000 * 60 * 60); // 1 ชม.
    console.log('before otp1')
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verify_email_otp: otp,
        verify_email_expiry: expiry,
      },
    });
    console.log('before sendemail')
    await sendEmail({
      sendTo: user.email,
      subject: "New OTP - Verify your email",
      html: verifyEmailTemplatesoi({ name: user.name, otp }),
    });
    console.log('aftersentemail')
    res.status(201).json({ message: "User registered successfully!" });
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      message: "Internal server error",
      error: true,
      success: false,
    });
  }
 
};

export const verifyEmailController = async (req, res) => {
  try {
    const email = req.body.email?.toLowerCase().trim();
    const otp = req.body.otp?.trim();

    if (!email || !otp) {
      return res.status(400).render("email-verification-failed", {
        message: "Missing email or OTP",
      });
    }

    const user = await prisma.user.findFirst({ where: { email } });

    if (!user) {
      return res.status(400).render("email-verification-failed", {
        message: "User not found",
      });
    }

    const currentTime = new Date();
    if (!user.verify_email_otp || user.verify_email_expiry < currentTime) {
      return res.status(400).render("email-verification-failed", {
        message: "OTP expired",
      });
    }

    if (otp !== user.verify_email_otp) {
      return res.status(400).render("email-verification-failed", {
        message: "Invalid OTP",
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verify_email: true,
        verify_email_otp: null,
        verify_email_expiry: null,
      },
    });

    return res.render("email-verified", { name: user.name });

  } catch (error) {
    console.error("verifyOtp error:", error);
    return res.status(500).render("email-verification-failed", {
      message: "Something went wrong on the server.",
    });
  }
};

export const resendEmailOtpController = async (req, res) => {
  try {
    const email = xss(req.body.email?.toLowerCase().trim());

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.verify_email) {
      return res.status(400).json({ message: "Email not Exist!!" });
    }

    if (!user || user.verify_email) {
      return res.status(400).json({ message: "Invalid or already verified" });
    }

    const otp = generateOtp();
    const expiry = new Date(Date.now() + 1000 * 60 * 60); // 1 ชม.

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verify_email_otp: otp,
        verify_email_expiry: expiry,
      },
    });

    await sendEmail({
      sendTo: user.email,
      subject: "New OTP - Verify your email",
      html: verifyEmailTemplatesoi({ name: user.name, otp }),
    });

    return res.json({
      message: "OTP sent again. Please check your email.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};


export const userLoginController = async (req,res)=>{
  try {
    const {email,password} =req.body;
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }
    const sanitizedEmail = xss(email.toLowerCase());

    const user = await prisma.user.findFirst({ where: { email: sanitizedEmail } });

    if (!user) {
      return res.status(400).json({
        message: "User does not exist.",
      });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(400).json({
        message: "Account not active. Please contact admin.",
        error: true,
        success: false,
      });
    }

    const checkPassword = await bcrypt.compare(password, user.password);

    
    if (!checkPassword) {
      return res.status(400).json({
        message: "Incorrect password.",
        error: true,
        success: false,
      });
    }
    
    const accessToken = await generatedAccessToken(user.id);
    const refreshToken = await generatedRefreshToken(user.id);

    const updateUser = await prisma.user.update({
      where:{id:user.id},
      data:{
        last_login_date : new Date()
      }
    })

    const cookiesOption = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
    };

    //res.cookie(name, value, options)
    res.cookie('accessToken', accessToken, cookiesOption);
    res.cookie('refreshToken', refreshToken, cookiesOption);

    return res.json({
      message: "Login successfully",
      success: true,
      error: false,
      data: {
        accessToken,
        refreshToken,
        email: user.email,
        name: user.name,
      },
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}

