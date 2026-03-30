import Joi from "joi";
import { BaseDto } from "../../../common/dto/base.dto.js";

export class RegisterDto extends BaseDto {
  static schema = Joi.object({
    name: Joi.string().trim().min(2).max(20).required(),
    email: Joi.string().email().lowercase().required(),
    password: Joi.string()
      .min(8)
      .max(128)
      .message("Password must be between 8 and 128 characters")
      .required(),
    role: Joi.string().valid("customer", "seller").default("customer"),
  });
}
