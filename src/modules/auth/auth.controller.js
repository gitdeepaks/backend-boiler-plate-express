import { ApiRespose } from "../../common/utils/api-response.js";
import * as authService from "./auth.service.js";

export const register = async (req, res) => {
  const user = await authService.register(req.body);
  ApiRespose.created(res, "Registration success", user);

  return user;
};

export const login = async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.login(req.body);

  const isProd = process.env.NODE_ENV === "production";
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    maxAge: 15 * 60 * 1000,
  });

  ApiRespose.ok(res, "Login Successful", {
    user,
    accessToken,
  });
};

export const logout = async (req, res) => {
  await authService.logout(req.user.id);
  res.clearCookie("refreshToken", { path: "/" });
  res.clearCookie("accessToken", { path: "/" });
  ApiRespose.ok(res, "Logout Success");
};

export const getMe = async (req, res) => {
  const user = await authService.getMe(req.user.id);
  ApiRespose.ok(res, "User profile", user);
};

export const adminPing = async (req, res) => {
  ApiRespose.ok(res, "Admin access granted", { role: req.user.role });
};

export const refreshSession = async (req, res) => {
  const token =
    req.cookies?.refreshToken ||
    req.body?.refreshToken ||
    req.headers["x-refresh-token"];
  const { user, accessToken, refreshToken } = await authService.refresh(token);

  const isProd = process.env.NODE_ENV === "production";
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    maxAge: 15 * 60 * 1000,
  });

  ApiRespose.ok(res, "Session refreshed", { user, accessToken });
};

export const verifyEmail = async (req, res) => {
  const user = await authService.verifyEmail(req.params.token);
  ApiRespose.ok(res, "Email verified successfully", user);
  return user;
};
