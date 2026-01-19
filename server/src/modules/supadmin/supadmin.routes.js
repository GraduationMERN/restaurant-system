import express from "express";
import requireSuperAdmin from "../../middlewares/requireSuperAdmin.js";
import { getDashboard, listRestaurants, createRestaurant, getRestaurant, updateRestaurant, suspendRestaurant, activateRestaurant } from "./supadmin.controller.js";

const router = express.Router();

router.get("/dashboard", requireSuperAdmin, getDashboard);
router.get("/restaurants", requireSuperAdmin, listRestaurants);
router.post("/restaurants", requireSuperAdmin, createRestaurant);
router.get("/restaurants/:id", requireSuperAdmin, getRestaurant);
router.put("/restaurants/:id", requireSuperAdmin, updateRestaurant);
router.post("/restaurants/:id/suspend", requireSuperAdmin, suspendRestaurant);
router.post("/restaurants/:id/activate", requireSuperAdmin, activateRestaurant);

export default router;
