import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient();
import bcrypt from 'bcrypt';

export async function userRegisterController(req, res) {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required!" });
    }

    const useroldemail = await prisma.user.findFirst({
      where: { email: email }
    })
    
    if (useroldemail) {
      return res.status(400).json({ message: "Email Already Exist" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email: email,
        password: hashedPassword,
        name: name || null
      },
    });

    return res.status(201).json({
      message: "User registered successfully",
      data: user,
    });

  } catch (error) {
    console.error('Error registering user:', error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}