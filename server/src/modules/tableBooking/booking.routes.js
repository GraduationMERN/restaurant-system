import express from "express";
import BookingController from "./booking.controller.js";

const router = express.Router();

// Quick endpoints (get-only, no ID required)
router.get("/today", (req, res, next) => BookingController.getToday(req, res, next));
router.get("/upcoming", (req, res, next) => BookingController.getUpcoming(req, res, next));
router.get("/analytics", (req, res, next) => BookingController.getAnalytics(req, res, next));
router.get("/customer", (req, res, next) => BookingController.getCustomerBookings(req, res, next));
router.get("/by-date/:date", (req, res, next) => BookingController.getByDate(req, res, next));

// Workflow endpoints (status transitions)
// CASHIER: Confirm pending booking and assign table(s)
router.post("/:id/confirm", (req, res, next) => BookingController.confirm(req, res, next));
// CASHIER: Reject pending booking
router.post("/:id/reject", (req, res, next) => BookingController.reject(req, res, next));
// CASHIER: Mark as seated (guest arrived)
router.patch("/:id/seated", (req, res, next) => BookingController.markSeated(req, res, next));
// CASHIER: Complete booking (guest left)
router.patch("/:id/complete", (req, res, next) => BookingController.complete(req, res, next));
// CASHIER: Mark as no-show
router.patch("/:id/no-show", (req, res, next) => BookingController.markNoShow(req, res, next));

// Standard CRUD
router.post("/", (req, res, next) => BookingController.create(req, res, next));
router.get("/", (req, res, next) => BookingController.list(req, res, next));
router.get("/:id", (req, res, next) => BookingController.getById(req, res, next));
router.patch("/:id/status", (req, res, next) => BookingController.updateStatus(req, res, next));
router.put("/:id", (req, res, next) => BookingController.update(req, res, next));
router.delete("/:id", (req, res, next) => BookingController.remove(req, res, next));

export default router;
