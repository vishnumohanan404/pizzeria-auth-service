import { body } from "express-validator";

export default [
  body("email").notEmpty().withMessage("Email is required!").trim().isEmail(),
  body("password").notEmpty().withMessage("Password is required!").trim(),
];
