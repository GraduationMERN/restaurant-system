import { body } from "express-validator";

export const egyptianPhoneValidator = body("phoneNumber")
  .trim()
  .matches(/^(\+2)?01(0|1|2|5)\d{8}$/)
  .withMessage("Invalid Egyptian phone number");