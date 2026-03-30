import { ApiError } from "../../common/utils/api-error.js";
import { verifyAccessToken } from "../../common/utils/jwt.utils.js";
import User from "./auth.model.js";

export const authenticate = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }
    if (!token) throw ApiError.unauthirized("Not authenticated");

    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id);
    if (!user) throw ApiError.unauthirized("User no longer exists");

    req.user = {
      id: user._id,
      role: user.role,
      name: user.name,
      email: user.email,
    };

    next();
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw ApiError.unauthirized("Invalid or expired token");
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw ApiError.forbidden(
        "You donot have permission to perform this action",
      );
    }
    next();
  };
};
