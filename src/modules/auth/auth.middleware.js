import { ApiError } from "../../common/utils/api-error.js";
import { veryfyAccessToken } from "../../common/utils/jwt.utils.js";
import User from "./auth.model.js";

export const authenticate = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) throw ApiError.unauthirized("Not Authenticated");

  const decoded = veryfyAccessToken(token);

  const user = await User.findById(decoded.id);
  if (!user) throw ApiError("User No longer exists");

  req.user = {
    id: user._id,
    role: user.role,
    name: user.name,
    email: user.email,
  };

  next();
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
