import { ApiRespose } from "../../common/utils/api-response.js";
import * as authService from "./auth.service.js";

export const register = async (req, res) => {
  const user = await authService.register(req.body);
  ApiRespose.created(res, "Registration success", user);

  return user;
};

export const login = async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.login(req.body);

  res.cookie("refreshToken", refreshToken, {
    httpsOnly: true,
    secure: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  res.cookie("accessToken", accessToken, {
    httpsOnly: true,
    secure: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  ApiRespose.ok(res, "Login Successful", {
    user,
    accessToken,
  });
};

export const logout = async (req, res) => {
  await authService.logout(req.user.id);
  res.clearCookie("refreshToken");
  ApiRespose.ok(res, "Logout Success");
};

export const getMe = async (req, res) => {
  const user = await authService.getMe(req, user.id);

  ApiRespose.ok(res, `user profile ${user}`);
};

export const verifyEmail = async (req, res) => {
  const user = await authService.verifyEmail(req.params.token);
  ApiRespose.ok(res, "Email verified successfully", user);
  return user;
};
