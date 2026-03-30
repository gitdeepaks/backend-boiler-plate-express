import Joi from "joi";

export class BaseDto {
  static schema = Joi.object({});

  static validate(data) {
    const { error, value } = this.schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map((d) => d.message);
      return { error: messages, value: null };
    }
    return { error: null, value };
  }
}
