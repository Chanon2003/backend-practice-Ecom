export const verifyEmailTemplatesoi = ({name,otp}) =>{
  return `
  <p>${name}</p>
  <p>Verify Email. Please use following OTP code to  Verify Email .</p>   
  <div style="background:yellow;font-size:20px;padding:20px;text-align:center;font-weight:800;">${otp}</div>
  <p>This otp is valid for 1 hour only. Enter this otp in the Penguin87 website to proceed with Verify Email.</p>
  <br/>
  </br>
  <p>Thanks</p>
  <p>Penguin87</p>
  `
}