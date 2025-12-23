

const cookieOptions = {
  httpOnly: true,
  sameSite: "Lax", // Changed from None to Lax for better compatibility
  secure: true, // Keep secure for HTTPS
  maxAge: 30 * 60 * 60 * 1000,
  path: "/", // Reverted back to "/"
};

export const startAuthController = async (req,res) => {
  try{
    const { phoneNumber } = req.body;
    // Logic to send OTP to the provided phone number
    await startAuthServices(phoneNumber)
    // send otp

    res.status(200).json({message:"OTP Sent!"});
  }catch(err){
    res.status(400).json({message:err})
  }
}

export const verifyOTPController = async (req, res) => {
  const { otp, phoneNumber } = req.body;

  const result = await verifyOTPServices(otp, phoneNumber);

  if (result.refreshToken) {
    res.cookie("refreshToken", result.refreshToken, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }

  res.json(result);
};

export const completeProfileController = async (req, res) => {
  const { name, tempToken } = req.body;

  const result = await completeProfileServices(name, tempToken);

  res.cookie("refreshToken", result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/auth/refresh",
  });

  res.json(result);
};
export const getMeController= async(req,res)=>{
  try{
    // check the token in cookies and get user by token ??
  }catch(err){

  }
}

export const refreshTokenController = async(req,res)=>{
  // ????
}

export const logoutController = async (req,res)=>{
  // remove refresh token and access token from cookies
}