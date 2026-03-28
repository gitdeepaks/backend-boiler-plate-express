import { Router } from "express";
import * as controller from "./auth.controller.js";
import { validate } from "../../common/middleware/validate.middleware.js";
import { RegisterDto } from "./dto/register.dto.js";
import { authenticate } from "./auth.middleware.js";
import { LogInDTO } from "./dto/login.dto.js";

export const router = Router();

router.post("/register", validate(RegisterDto), controller.register);

router.post("/login", validate(LogInDTO), controller.login);
router.post("/logout", authenticate, controller.logout);
router.get("/me", authenticate, controller.getMe);
