import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient();
import bcrypt from 'bcrypt';
import xss from 'xss';
import { validationResult } from "express-validator";
import sendEmail from '../config/sendEmail.js';
import { verifyEmailTemplatesoi } from '../utils/verifyEmailTemplate.js';
import { generateOtp } from '../utils/generatedOtp.js';
import generatedAccessToken from '../utils/generateToken/generatedAccessToken.js';
import generatedRefreshToken from '../utils/generateToken/generatedRefreshToken.js';
import { forgotPasswordTemplate } from '../utils/forgotPasswordTemplate.js';
import { cloudinary } from '../utils/cloudinary.js';

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

export const userLoginController = async (req, res) => {
  try {
    const { email, password } = req.body;
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
      where: { id: user.id },
      data: {
        last_login_date: new Date()
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

export const userLogout = async (req, res) => {
  try {
    const userid = req.user.id

    const cookiesOption = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
    };

    res.clearCookie('accessToken', cookiesOption);
    res.clearCookie('refreshToken', cookiesOption);

    const removeRefreshToken = await prisma.user.update({
      where: { id: userid },
      data: { refresh_token: "" },
    });

    return res.json({
      message: "Logout succesfully",
      error: false,
      success: true,
    })

  } catch (error) {
    console.error("Error in userLogout:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: true,
      success: false,
    });
  }
}

export const refreshToken = async (req, res) => {
  try {
    // ✅ ดึง Refresh Token จาก Cookie
    const refreshToken = req.cookies.refreshToken || req?.headers?.authorization?.spilt(" ")[1];

    if (!refreshToken) {
      return res.status(401).json({
        message: "Invalid token",
        error: true,
        success: false,
      });
    }

    let verifyToken;

    try {
      verifyToken = jwt.verify(refreshToken, process.env.SECRET_KEY_REFRESH_TOKEN);
    } catch (err) {
      return res.status(401).json({
        message: "Token is expired or invalid",
        error: true,
        success: false,
      });
    }

    const userId = verifyToken.id;

    if (!userId) {
      return res.status(401).json({
        message: "Invalid token payload",
        error: true,
        success: false,
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        error: true,
        success: false,
      });
    }

    const newAccessToken = await generatedAccessToken(user.id);

    // ✅ ตั้งค่า Cookies อย่างปลอดภัย
    res.cookie("accesstoken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // ใช้ secure เฉพาะใน production
      sameSite: "None",
    });

    return res.json({
      message: "New Access Token generated",
      error: false,
      success: true,
      data: {
        accesstoken: newAccessToken,
      },
    });
  } catch (error) {
    console.error("refreshToken Error:", error);
    return res.status(500).json({
      message: error.message || "Internal server error",
      error: true,
      success: false,
    });
  }
}

export const forgotPassword = async (req, res) => {
  try {
    const email = xss(req.body.email?.toLowerCase().trim());

    if (!email) {
      return res.status(400).json({ message: "Email is required", error: true });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: "Email not registered", error: true });
    }

    const otp = generateOtp();
    const expiry = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        forgot_password_otp: otp,
        forgot_password_expiry: expiry,
      },
    });

    await sendEmail({
      sendTo: email,
      subject: "Reset your password",
      html: forgotPasswordTemplate({ name: user.name, otp }),
    });

    return res.json({ message: "OTP sent to your email", success: true });

  } catch (error) {
    console.error("forgotPassword:", error);
    return res.status(500).json({ message: "Server error", error: true });
  }
}

export const verifyForgotPasswordOtp = async (req, res) => {
  try {
    const email = xss(req.body.email?.toLowerCase().trim());
    const otp = xss(req.body.otp?.trim());

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP required", error: true });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "User not found", error: true });
    }

    const currentTime = new Date();

    // เช็คว่า OTP หมดอายุหรือไม่
    if (!user.forgot_password_otp || user.forgot_password_expiry < currentTime) {
      return res.status(400).json({ message: "OTP expired", error: true });
    }

    // เช็คว่าเวลาล็อกบล็อกผ่านไปหรือยัง
    if (user.lockout_time && user.lockout_time > currentTime) {
      return res.status(400).json({
        message: `Too many incorrect attempts. Please try again after ${Math.ceil((user.lockout_time - currentTime) / 1000)} seconds.`,
        error: true,
      });
    }

    // เช็คว่า OTP ถูกต้องหรือไม่
    if (otp !== user.forgot_password_otp) {
      let incorrectOtpAttempts = user.incorrect_otp_attempts || 0; // จำนวนครั้งกรอกผิด
      incorrectOtpAttempts += 1;

      // หากกรอกผิดเกิน 3 ครั้ง
      if (incorrectOtpAttempts >= 3) {
        const lockoutTime = new Date(Date.now() + 30 * 1000); // ตั้งเวลาบล็อกเป็น 30 วินาที
        await prisma.user.update({
          where: { id: user.id },
          data: {
            incorrect_otp_attempts: incorrectOtpAttempts,
            lockout_time: lockoutTime,
          },
        });

        return res.status(400).json({
          message: "Too many incorrect attempts, please try again after 30 seconds.",
        });
      }

      // หาก OTP ผิดน้อยกว่า 3 ครั้ง อัปเดตจำนวนการกรอกผิด
      await prisma.user.update({
        where: { id: user.id },
        data: {
          incorrect_otp_attempts: incorrectOtpAttempts,
        },
      });

      return res.status(400).json({
        message: "Invalid OTP",
        error: true,
        success: false,
      });
    }

    // รีเซ็ตจำนวนการกรอกผิดเมื่อ OTP ถูกต้อง
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        forgot_password_otp: null,
        forgot_password_expiry: null,
        incorrect_otp_attempts: 0, // รีเซ็ตจำนวนครั้งที่กรอกผิด
      },
    });

    return res.json({ message: "OTP verified", success: true });

  } catch (error) {
    console.error("verifyForgotPasswordOtp:", error);
    return res.status(500).json({ message: "Server error", error: true });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const email = xss(req.body.email?.toLowerCase().trim());
    const newPassword = xss(req.body.newPassword?.trim());
    const confirmPassword = xss(req.body.confirmPassword?.trim());

    if (!email || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required", error: true });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "User not found", error: true });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: "Please verify OTP first", error: true });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match", error: true });
    }

    const sameAsOld = await bcrypt.compare(newPassword, user.password);
    if (sameAsOld) {
      return res.status(400).json({ message: "New password must be different", error: true });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hash,
        isVerified: false,
      },
    });

    return res.json({ message: "Password reset successful", success: true });

  } catch (error) {
    console.error("resetPassword:", error);
    return res.status(500).json({ message: "Server error", error: true });
  }
}

export const uploadAvatar = async (req, res) => {
  try {
    const userId = req.user?.id; // ดึง userId จาก req.user (ต้องมี middleware ที่ยืนยันตัวตน)
    const reqfile = req.file;   // รับไฟล์จาก multer

    if (!userId || reqfile.length === 0) {
      return res.status(400).json({ error: 'User ID and avatar image are required' });
    }

    // สร้างอ็อบเจ็กต์ข้อมูลภาพ
    const uploadedImages = {
      imageUrl: reqfile.path,        // URL ของภาพที่อัปโหลด
      publicId: reqfile.filename,    // public_id สำหรับใช้ลบหรืออัปเดต
    };

    // อัปเดตข้อมูล avatar ในฐานข้อมูล
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        avatar: uploadedImages.imageUrl,       // URL ของภาพ
        avatarPublicId: uploadedImages.publicId,  // public_id ของภาพ
      },
    });

    // ส่งผลลัพธ์กลับไป
    return res.status(200).json({
      message: 'Avatar updated successfully',
      data: updatedUser,
    });

  } catch (error) {
    console.error('Error uploading avatar:', error);
    return res.status(500).json({
      message: 'Internal server error',
      error: true,
    });
  }
};

export const updatedAvatar = async (req, res) => {
  try {
    const userId = req.user?.id;  // ดึง userId จาก middleware
    const { oldImages } = req.body;  // รับ public_id ของภาพเก่า (ถ้ามี)
    const reqfile = req.file;  // รับไฟล์จาก multer

    if (!userId || !reqfile) {
      return res.status(400).json({ error: 'User ID and avatar image are required' });
    }

    // หากมี public_id ของภาพเก่า ให้ทำการลบภาพนั้นจาก Cloudinary
    if (oldImages && Array.isArray(JSON.parse(oldImages))) {
      for (const public_id of JSON.parse(oldImages)) {
        await cloudinary.uploader.destroy(public_id);
      }
    }

    // สร้างข้อมูลของภาพที่อัปโหลด
    const uploadedImages = {
      imageUrl: reqfile.path,        // URL ของภาพที่อัปโหลด
      publicId: reqfile.filename,    // public_id สำหรับใช้ลบหรืออัปเดต
    };

    // อัปเดตข้อมูล avatar ในฐานข้อมูล
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        avatar: uploadedImages.imageUrl,      // URL ของภาพ
        avatarPublicId: uploadedImages.publicId,  // public_id ของภาพ
      },
    });

    // ส่งผลลัพธ์กลับไป
    return res.status(200).json({
      message: 'Avatar updated successfully',
      data: updatedUser,
    });

  } catch (error) {
    console.error('Error uploading avatar:', error);
    return res.status(500).json({
      message: 'Internal server error',
      error: true,
    });
  }
};

export const deleteAvatar = async (req, res) => {
  try {
    const userId = req.user?.id;  // ดึง userId จาก middleware
    const { publicIds } = req.body

    if (!Array.isArray(publicIds)) {
      return res.status(400).json({ error: 'publicIds should be an array' });
    }

    await Promise.all(
      publicIds.map(publicId => cloudinary.uploader.destroy(publicId))
    );

    // อัปเดตข้อมูล avatar ในฐานข้อมูล
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        avatar: "",      // URL ของภาพ
        avatarPublicId: "",  // public_id ของภาพ
      },
    });

    // ส่งผลลัพธ์กลับไป
    return res.status(200).json({ message: 'Images deleted successfully' });

  } catch (error) {
    console.error('Error uploading avatar:', error);
    return res.status(500).json({
      message: 'Internal server error',
      error: true,
    });
  }
};