import bookingService from "./booking.service.js";

class BookingController {
  // CUSTOMER: Create booking request (starts in "pending" status)
  async create(req, res, next) {
    try {
      const created = await bookingService.createBooking(req.body);
      res.status(201).json(created);
    } catch (err) {
      // Log full stack for easier debugging of server 500s
      try {
        console.error("Booking create error - Message:", err.message);
        console.error("Booking create error - Stack:", err.stack);
        console.error("Booking create request body:", req.body);
      } catch (logErr) {
        console.error("Error logging booking error:", logErr);
      }
      next(err);
    }
  }

  // List bookings (for admin/cashier dashboards)
  async list(req, res, next) {
    try {
      const { restaurantId, date } = req.query;
      const items = await bookingService.listBookings(restaurantId, date);
      res.json(items);
    } catch (err) {
      next(err);
    }
  }

  // Legacy update endpoint - keeps existing functionality
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const updated = await bookingService.updateBookingStatus(id, req.body);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }

  // CUSTOMER: Cancel own booking
  async remove(req, res, next) {
    try {
      const { id } = req.params;
      // Optional: verify customer ownership via req.user.email
      const customerEmail = req.query.customerEmail;
      if (!customerEmail) {
        return res.status(400).json({ success: false, message: 'customerEmail query parameter is required to cancel booking' });
      }
      const cancelled = await bookingService.cancelBooking(id, customerEmail);
      res.json(cancelled);
    } catch (err) {
      next(err);
    }
  }

  // CASHIER: Get today's bookings (pending, confirmed, seated)
  async getToday(req, res, next) {
    try {
      const { restaurantId } = req.query;
      const items = await bookingService.getTodayBookings(restaurantId);
      res.json(items);
    } catch (err) {
      next(err);
    }
  }

  // CASHIER: Get upcoming bookings for next N days
  async getUpcoming(req, res, next) {
    try {
      const { restaurantId } = req.query;
      const items = await bookingService.getUpcomingBookings(restaurantId);
      res.json(items);
    } catch (err) {
      next(err);
    }
  }

  // Get bookings for specific date
  async getByDate(req, res, next) {
    try {
      const { date } = req.params;
      const { restaurantId } = req.query;
      const items = await bookingService.getBookingsByDate(restaurantId, date);
      res.json(items);
    } catch (err) {
      next(err);
    }
  }

  // Get single booking by ID
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const item = await bookingService.getBookingById(id);
      res.json(item);
    } catch (err) {
      next(err);
    }
  }

  // Legacy status update - for backward compatibility
  async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updated = await bookingService.updateBookingStatus(id, { status });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }

  // CASHIER: Confirm booking and assign table(s)
  // Request body: { tableIds: [tableId1, tableId2, ...] }
  async confirm(req, res, next) {
    try {
      const { id } = req.params;
      const { tableIds } = req.body;
      const confirmed = await bookingService.confirmBooking(id, tableIds);
      res.json(confirmed);
    } catch (err) {
      next(err);
    }
  }

  // CASHIER: Reject pending booking
  // Request body: { reason: "reason text" }
  async reject(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const rejected = await bookingService.rejectBooking(id, reason);
      res.json(rejected);
    } catch (err) {
      next(err);
    }
  }

  // CASHIER: Mark booking as seated (guest arrived)
  async markSeated(req, res, next) {
    try {
      const { id } = req.params;
      const seated = await bookingService.markSeated(id);
      res.json(seated);
    } catch (err) {
      next(err);
    }
  }

  // CASHIER: Complete booking (guest left, table freed)
  async complete(req, res, next) {
    try {
      const { id } = req.params;
      const completed = await bookingService.completeBooking(id);
      res.json(completed);
    } catch (err) {
      next(err);
    }
  }

  // CASHIER: Mark booking as no-show
  async markNoShow(req, res, next) {
    try {
      const { id } = req.params;
      const noShow = await bookingService.markNoShow(id);
      res.json(noShow);
    } catch (err) {
      next(err);
    }
  }

  // CUSTOMER: Get own bookings
  // Query: ?restaurantId=xxx&customerEmail=user@email.com
  async getCustomerBookings(req, res, next) {
    try {
      const { restaurantId, customerEmail } = req.query;
      const bookings = await bookingService.getCustomerBookings(restaurantId, customerEmail);
      res.json(bookings);
    } catch (err) {
      next(err);
    }
  }

  // ADMIN: Get analytics for bookings in date range
  // Query: ?restaurantId=xxx&startDate=2025-01-01&endDate=2025-12-31
  async getAnalytics(req, res, next) {
    try {
      const { restaurantId, startDate, endDate } = req.query;
      const analytics = await bookingService.getBookingAnalytics(restaurantId, startDate, endDate);
      res.json(analytics);
    } catch (err) {
      next(err);
    }
  }
}

export default new BookingController();
