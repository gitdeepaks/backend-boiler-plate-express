import { ApiError } from "../utils/api-error.js";

export const validate = (Dtoclass) => {
  return (req, res, next) => {
    const { error, value } = Dtoclass.validate(req.body);

    if (error) {
      return next(ApiError.badRequest(error.join("; ")));
    }
    req.body = value;
    next();
  };
};
