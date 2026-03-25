import { ApiRespose } from "../../common/utils/api-response.js";
import * as authService from "./auth.service.js";

export const register = async (req, res) => {
  const user = await authService.register(req.body);
  ApiRespose.created(res, "Registration success", user);

  return user;
};
