import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient();

const admin = async(req,res,next)=>{
  try {
    const userId = req.user.id 
    const user = await prisma.user.findUnique({
      where:{id:userId}
    })

    if(user.role !== 'ADMIN'){
      return res.status(400).json({
        message: 'permission denied',
        error:true,
        success:false,
      })
    }

    next()
  } catch (error) {
    return res.status(500).json({
      message:'Permission denied',
      error:true,
      success:false
    })
  }
}

export default admin