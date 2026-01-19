import express from "express";
import TableController from "./table.controller.js";

const router = express.Router();

// GET endpoints (queries)
// CASHIER: Check table availability
router.get("/availability", (req, res, next) => TableController.getAvailability(req, res, next));
// CASHIER: Get smart table suggestions
router.get("/suggest", (req, res, next) => TableController.suggestTables(req, res, next));
// ADMIN/CASHIER: Get floor plan visualization
router.get("/floor-plan", (req, res, next) => TableController.getFloorPlan(req, res, next));
// ADMIN: Get table by capacity
router.get("/by-capacity", (req, res, next) => TableController.getByCapacity(req, res, next));
// ADMIN: Get table occupancy stats
router.get("/stats", (req, res, next) => TableController.getStats(req, res, next));

// Status updates
// CASHIER: Mark table as being cleaned
router.patch("/:id/cleaning", (req, res, next) => TableController.markCleaning(req, res, next));
// CASHIER: Mark table as available
router.patch("/:id/available", (req, res, next) => TableController.markAvailable(req, res, next));
// CASHIER: Generic status update
router.patch("/:id/status", (req, res, next) => TableController.updateStatus(req, res, next));

// Standard CRUD
// ADMIN: Create table
router.post("/", (req, res, next) => TableController.create(req, res, next));
// ADMIN: List tables
router.get("/", (req, res, next) => TableController.list(req, res, next));
// ADMIN: Bulk update tables
router.patch("/", (req, res, next) => TableController.bulkUpdate(req, res, next));
// ADMIN: Update single table
router.put("/:id", (req, res, next) => TableController.update(req, res, next));
// ADMIN: Delete table
router.delete("/:id", (req, res, next) => TableController.remove(req, res, next));

export default router;
