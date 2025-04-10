import jwt from 'jsonwebtoken'

const auth = async(req,res,next)=>{
  try {
    const token = req.cookies?.accessToken || req.header?.authorization?.split(" ")[1]

    if(!token){
      return res.status(401).json({
        message:"You haven't Login"
      })
    }

    const decode = jwt.verify(token,process.env.SECRET_KEY_ACCESS_TOKEN)

    if (!decode || !decode.id) {
      return res.status(401).json({
        message: "Unauthorized: Invalid token",
        error: true,
        success: false,
      });
    }

    req.user = decode;

    next();

  } catch (error) {
    console.log(error)
  }
}


export default auth;