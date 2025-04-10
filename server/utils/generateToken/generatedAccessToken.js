import jwt from 'jsonwebtoken'

const generatedAccessToken = (userId)=>{
  const token = jwt.sign({id:userId},process.env.SECRET_KEY_ACCESS_TOKEN,{expiresIn:'1d'})
  return token
}

export default generatedAccessToken