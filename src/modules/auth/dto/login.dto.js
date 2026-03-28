import Joi from "joi";
import { BaseDto } from "../../../common/dto/base.dto.js";

export class LogInDTO extends BaseDto {
  static scheme = Joi.object({
    email: Joi.string().email().lowercase().required(),
    password: Joi.string().required(),
  });
}
