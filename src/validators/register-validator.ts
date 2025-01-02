import { body } from "express-validator";

export default [
  body("email").notEmpty().withMessage("Email is required!"),
  body("password").notEmpty(),
];
