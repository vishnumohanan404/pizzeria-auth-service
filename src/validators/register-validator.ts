import { body } from "express-validator";

export default [
  body("email").notEmpty().withMessage("Email is required!").trim().isEmail(),
  body("firstName").notEmpty().withMessage("Firstname is required!").trim(),
  body("lastName").notEmpty().withMessage("Lastname is required!").trim(),
  body("password")
    .notEmpty()
    .withMessage("Password is required!")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
];
