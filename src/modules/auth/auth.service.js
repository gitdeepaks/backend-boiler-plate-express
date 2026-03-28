import { ApiError } from "../../common/utils/api-error.js";
import {
  generateAccessToken,
  generateRefreshToken,
  generateResetToken,
  veryfyRefreshToken,
} from "../../common/utils/jwt.utils.js";
import User from "./auth.model.js";

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const register = async ({ name, email, password, role }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw ApiError.conflict("Email already exits");
  }
  const { rawToken, hashedToken } = generateResetToken();

  const user = await User.create({
    name,
    email,
    password,
    role,
    verificationToken: hashedToken,
  });

  //TODO:send an email to user with user with rawToken

  const userObj = user.toObject();
  delete userObj.password;

  return userObj;
};

export const login = async ({ email, password }) => {
  // take email and find use in DB
  // check if password is correct
  // check if verified or not
  const user = await User.findOne({ email }).select("+password");
  if (!user) throw ApiError.unauthirized("Invalid email or password");

  // will check password
  const isMatch = await user.comparePassword(password);

  if (!isMatch) throw ApiError.unauthirized("Invalid email or password");
  if (user.isVerified) {
    throw ApiError.forbidden("Please verify your Email before login");
  }

  const accessToken = generateAccessToken({ id: user._id, role: user.role });

  const refreshToken = generateRefreshToken({ id: user._id });

  user.refreshToken = hashToken(refreshToken);
  await user.save({
    validateBeforeSave: false, //bcoz we know what we are doing or saving
  });

  const userObj = user.toObject();

  delete userObj.password;
  delete userObj.refreshToken;

  return {
    user: userObj,
    accessToken,
    refreshToken,
  };
};

export const refresh = async (token) => {
  if (!token) throw ApiError.unauthirized("Refresh token is missing");
  const decoded = veryfyRefreshToken(token);
  const user = await User.findById(decoded.id).select("+refreshToken");

  if (!user) throw ApiError.unauthirized("User not found");

  if (user.refreshToken !== hashToken(token)) {
    throw ApiError.unauthirized("Invalid refresh token");
  }

  const accessToken = generateAccessToken({ id: user._id, role: user.role });
  await user.save({
    validateBeforeSave: false, //bcoz we know what we are doing or saving
  });

  const userObj = user.toObject();

  delete userObj.password;
  delete userObj.refreshToken;

  return {
    user: userObj,
    accessToken,
    refreshToken,
  };
};

export const logout = async (userId) => {
  // const user = await User.findById(userId);
  // if (!user) throw ApiError.unauthirized("User not found");

  // user.refreshToken = null;
  // await user.save({
  //   validateBeforeSave: false,
  // });

  await User.findByIdAndUpdate(userId, {
    refreshToken: null,
  });
};

export const forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user) throw ApiError.notFound("no account with that email");

  const { rawToken, hashedToken } = generateResetToken();

  user.resetPasswordToken = hashToken;
  user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;

  await user.save();

  // TODO: yet to send the mail
};

export const verifyEmail = async (token) => {
  const hashedToken = hashToken(token);

  const user = await User.findOne({ verificationToken: hashedToken }).select(
    "+verificationToken",
  );

  if (!user) throw ApiError.notFound("Invalid or expired token");

  user.isVerified = true;
  user.verificationToken = undefined;
  await user.save();
  return user;
};

export const getMe = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound("User not found");
  return user;
};
