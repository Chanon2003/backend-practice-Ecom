import {PrismaClient} from '@prisma/client'
const prisma = new PrismaClient();
import jwt from 'jsonwebtoken'

const generatedRefreshToken = async(userId) => {
  const token = jwt.sign({ id: userId }, process.env.SECRET_KEY_REFRESH_TOKEN, { expiresIn: '7d' })

  const updateRefreshTokenUser = await prisma.user.update({where:{id:userId},
  data:{
    refresh_token:token
  }
  })

  return token
}

export default generatedRefreshToken