import express from "express";
import { submitSupport } from "./support.controller.js";
import optionalAuthMiddleware from "../../middlewares/optionalAuthMiddleware.js";

const router = express.Router();

router.post("/", optionalAuthMiddleware, submitSupport);

export default router;
