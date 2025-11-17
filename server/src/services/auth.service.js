import { addUser, findUserByEmail, saveRefreshToken } from "../repositories/user.repository.js";
import bcrypt from "bcryptjs";
import { createAccessToken } from "../utils/createAccessToken.js";
import User from "../models/User.js";
import { generateOTP } from "../utils/otpGen.js";
import { sendEmail } from "../utils/Mailer.js";
import { createRefreshToken } from "../utils/createRefreshToken.js";

export const registerUserService = async (user) => {
  const { name, email, password, phoneNumber } = user;
  if (!name || !email || !password || !phoneNumber) {
    const error = new Error("Name, email, password, phoneNumber are required");
    error.statusCode = 400;
    throw error;
  }
  const exists = await User.findOne({ email });
  if (exists) {
    const error = new Error("Email already exists");
    error.statusCode = 409;
    throw error;
  }
  const hashedPassword = await hashPassword(password);
  const code = generateOTP();
  const newUser = await addUser({
    ...user,
    password: hashedPassword,
    otp: code,
  });
  await sendEmail(
    email,
    "Your OTP Code",
    `Your verification code is ${code}, Valid for 10 minutes`
  );
  return { message: "OTP sent to email. Please verify your account." };
};

export const loginUserService = async (email, password) => {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new Error("Invalid email or password");
  }
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken(user);
  saveRefreshToken(user._id,refreshToken)
  return { user, accessToken, refreshToken };
};

const hashPassword = async (password) => {
  const saltRounds = 10;
  const hashed = await bcrypt.hash(password, saltRounds);
  return hashed;
};
