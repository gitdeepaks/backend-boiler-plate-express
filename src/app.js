import express from "express";
import cookieParser from "cookie-parser";
import { router as authRouter } from "./modules/auth/auth.routes.js";

export const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use("/api/auth", authRouter);

app.use((err, req, res, next) => {
  const statusCode = err.statusCode ?? 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});
