import bookingRepository from "./booking.repository.js";
import tableRepository from "./table.repository.js";
import restaurantRepository from "../restaurant/restaurant.repository.js";
import { overlaps, toMinutes, addMinutes } from "./time.utils.js";

class BookingService {
  // WORKFLOW: Create booking request with status "pending"
  // Customer creates booking, cashier must confirm and assign tables
  async createBooking(data) {
    const { restaurantId, tableIds = [], date, startTime, endTime, guests, customerEmail, customerPhone, customerName, source = "online", notes = "" } = data;

    // Validate required fields (restaurantId is optional)
    if (!date) throw new Error("Booking date is required");
    if (!startTime) throw new Error("Booking time is required");
    if (!guests || guests < 1) throw new Error("Number of guests is required");
    if (!customerEmail) throw new Error("Customer email is required");
    if (!customerName) throw new Error("Customer name is required");

    // If a restaurantId is provided, validate restaurant and its booking settings.
    // Otherwise proceed with sensible defaults.
    let restaurant = null;
    if (restaurantId) {
      try {
        restaurant = await restaurantRepository.findByRestaurantId(restaurantId);
        if (!restaurant) {
          console.warn(`Restaurant not found for id ${restaurantId}. Proceeding without restaurant-specific rules.`);
          restaurant = null;
        } else {
          if (!restaurant.services?.tableBookings?.enabled) {
            throw new Error("Table booking is disabled for this restaurant");
          }
        }
      } catch (err) {
        // If repository throws 'Restaurant not found', proceed without restaurant-specific rules.
        if (err && err.message && err.message.toLowerCase().includes('restaurant not found')) {
          console.warn(`Restaurant lookup failed for id ${restaurantId}: ${err.message}. Proceeding without restaurant-specific rules.`);
          restaurant = null;
        } else {
          throw err;
        }
      }
    }

    // Get booking rules from restaurant settings if available, otherwise use defaults
    const bookingRules = restaurant?.systemSettings?.tableBookings || {};
    const maxGuestLimit = bookingRules.maxGuests || 100;
    const bookingDuration = bookingRules.defaultDurationMinutes || 120; // default 2 hours
    const bufferBetweenBookings = bookingRules.bufferMinutesBetweenBookings || 15; // cleanup buffer

    // Validate guest count
    if (guests > maxGuestLimit) {
      throw new Error(`Number of guests exceeds limit of ${maxGuestLimit}`);
    }
    if (guests < 1) throw new Error("At least 1 guest required");

    // Respect opening hours
    try {
      const day = new Date(date).toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
      const hours = restaurant?.systemSettings?.landing?.hours?.[day];
      if (hours && hours.enabled) {
        const open = hours.open;
        const close = hours.close;
        if (!(startTime >= open && startTime < close)) {
          throw new Error("Booking time is outside restaurant opening hours");
        }
      }
    } catch (err) {
      if (!err.message.includes("Booking time")) throw err;
    }

    // Generate booking ID if not provided
    if (!data.bookingId) {
      const now = new Date();
      const seq = Math.floor(Math.random() * 90000) + 10000;
      data.bookingId = `RES-${now.getFullYear()}-${seq}`;
    }

    // Customer creates booking in "pending" status - cashier will confirm and assign tables
    const bookingData = {
      restaurantId,
      bookingId: data.bookingId,
      date,
      startTime,
      endTime: endTime || addMinutes(startTime, bookingDuration),
      guests,
      customerEmail,
      customerPhone,
      customerName,
      source,
      notes,
      tableId: null, // No table assigned until cashier confirms
      status: "pending" // Initial status - awaits cashier confirmation
    };

    const created = await bookingRepository.create(bookingData);

    // Emit to staff for action
    try {
      if (global.io) {
        global.io.to("cashier").emit("booking:new", created);
        if (created.restaurantId) global.io.to(`restaurant:${created.restaurantId}`).emit("booking:new", created);
      }
    } catch (e) {
      console.warn("Booking emit failed", e.message);
    }

    // Send notifications
    try {
      if (global.notificationService) {
        await global.notificationService.sendToRole('cashier', { 
          title: 'New booking request', 
          body: `${created.customerName || 'Guest'} requested booking for ${created.date} ${created.startTime}`, 
          data: created 
        });
      }
      const mailer = await import('../../utils/Mailer.js');
      try {
        if (created.customerEmail) {
          await mailer.sendEmail(created.customerEmail, 'Booking request received', `Your booking request ${created.bookingId} has been received. We will confirm shortly.`);
        }
      } catch (e) {
        // non-fatal
      }
    } catch (e) {}

    return created;
  }

  // CASHIER FEATURE: Confirm booking and assign table(s)
  // Multiple tables can be assigned for large parties
  async confirmBooking(bookingId, tableIds = []) {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) throw new Error("Booking not found");
    if (booking.status !== "pending") throw new Error("Only pending bookings can be confirmed");

    const { restaurantId, date, startTime, endTime, guests } = booking;

    // Validate at least one table provided
    if (!tableIds || tableIds.length === 0) {
      throw new Error("At least one table must be assigned");
    }

    // Validate tables exist and belong to restaurant
    const tables = [];
    let totalCapacity = 0;
    for (const tableId of tableIds) {
      const table = await tableRepository.findById(tableId);
      if (!table) throw new Error(`Table ${tableId} not found`);
      if (String(table.restaurantId) !== String(restaurantId)) {
        throw new Error(`Table ${tableId} does not belong to this restaurant`);
      }
      if (!table.isActive) throw new Error(`Table ${tableId} is not active`);
      tables.push(table);
      totalCapacity += table.capacity;
    }

    // Check total capacity is sufficient for guests
    if (totalCapacity < guests) {
      throw new Error(`Total table capacity (${totalCapacity}) is less than number of guests (${guests})`);
    }

    // Check for overlaps with other confirmed bookings on each table
    for (const table of tables) {
      const existingBookings = await bookingRepository.find({
        restaurantId,
        tableId: table._id,
        date,
        status: { $in: ["confirmed", "seated", "reserved"] }
      });

      for (const existing of existingBookings) {
        // Get buffer setting from restaurant
        const bookingRules = (await restaurantRepository.findByRestaurantId(restaurantId))?.systemSettings?.tableBookings || {};
        const bufferMinutes = bookingRules.bufferMinutesBetweenBookings || 15;

        // Check with buffer
        const bookingStartWithBuffer = toMinutes(startTime) - bufferMinutes;
        const bookingEndWithBuffer = toMinutes(endTime) + bufferMinutes;
        const existingStart = toMinutes(existing.startTime);
        const existingEnd = toMinutes(existing.endTime);

        if (!(bookingEndWithBuffer <= existingStart || bookingStartWithBuffer >= existingEnd)) {
          throw new Error(`Table ${table.name} has a conflicting booking at this time`);
        }
      }
    }

    // All validations passed - confirm booking
    // Store first table in tableId field for backward compatibility, all tableIds in new field if needed
    const updated = await bookingRepository.update(bookingId, {
      status: "confirmed",
      tableId: tableIds[0], // Primary table
      // In a real system, you might store tableIds array separately
    });

    // Update table status to "reserved"
    for (const table of tables) {
      await tableRepository.update(table._id, { status: "reserved" });
    }

    // Emit confirmation event
    try {
      if (global.io) {
        global.io.to("cashier").emit("booking:confirmed", updated);
        if (updated.restaurantId) global.io.to(`restaurant:${updated.restaurantId}`).emit("booking:confirmed", updated);
      }
    } catch (e) {
      console.warn("Booking confirmed emit failed", e.message);
    }

    return updated;
  }

  // CASHIER FEATURE: Reject pending booking
  async rejectBooking(bookingId, reason = "") {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) throw new Error("Booking not found");
    if (booking.status !== "pending") throw new Error("Only pending bookings can be rejected");

    const updated = await bookingRepository.update(bookingId, {
      status: "cancelled",
      notes: (booking.notes || "") + `\nRejected: ${reason}`
    });

    // Send notification to customer
    try {
      const mailer = await import('../../utils/Mailer.js');
      if (booking.customerEmail) {
        await mailer.sendEmail(booking.customerEmail, 'Booking rejected', `Your booking request ${booking.bookingId} has been rejected. Reason: ${reason}`);
      }
    } catch (e) {}

    return updated;
  }

  // WORKFLOW: Mark booking as seated (guest arrived)
  // Changes table status from "reserved" to "occupied"
  async markSeated(bookingId) {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) throw new Error("Booking not found");
    if (booking.status !== "confirmed") throw new Error("Only confirmed bookings can be marked as seated");

    const updated = await bookingRepository.update(bookingId, { status: "seated" });

    // Update all assigned tables to "occupied"
    if (booking.tableId) {
      await tableRepository.update(booking.tableId, { status: "occupied" });
    }

    try {
      if (global.io) {
        global.io.to("cashier").emit("booking:seated", updated);
        if (updated.restaurantId) global.io.to(`restaurant:${updated.restaurantId}`).emit("booking:seated", updated);
      }
    } catch (e) {}

    return updated;
  }

  // WORKFLOW: Complete booking (guest left)
  // Changes table status from "occupied" to "available"
  async completeBooking(bookingId) {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) throw new Error("Booking not found");
    if (!["seated", "confirmed"].includes(booking.status)) {
      throw new Error("Only seated or confirmed bookings can be completed");
    }

    const updated = await bookingRepository.update(bookingId, { status: "completed" });

    // Free up the table
    if (booking.tableId) {
      await tableRepository.update(booking.tableId, { status: "available" });
    }

    try {
      if (global.io) {
        global.io.to("cashier").emit("booking:completed", updated);
        if (updated.restaurantId) global.io.to(`restaurant:${updated.restaurantId}`).emit("booking:completed", updated);
      }
    } catch (e) {}

    return updated;
  }

  // WORKFLOW: Mark as no-show
  // Guest didn't arrive for confirmed booking
  async markNoShow(bookingId) {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) throw new Error("Booking not found");
    if (booking.status !== "confirmed") throw new Error("Only confirmed bookings can be marked as no-show");

    const updated = await bookingRepository.update(bookingId, { status: "no-show" });

    // Free up the table
    if (booking.tableId) {
      await tableRepository.update(booking.tableId, { status: "available" });
    }

    return updated;
  }

  async listBookings(restaurantId, date) {
    const filter = { restaurantId };
    if (date) filter.date = date;
    return await bookingRepository.find(filter);
  }

  // CUSTOMER FEATURE: Get customer's own bookings
  async getCustomerBookings(restaurantId, customerEmail) {
    return await bookingRepository.find({
      restaurantId,
      customerEmail,
      status: { $ne: "cancelled" }
    });
  }

  async updateBookingStatus(id, updates) {
    const prev = await bookingRepository.findById(id);
    const updated = await bookingRepository.update(id, updates);
    // cascade: if booking is seated/completed/cancelled update table status
    try {
      if (updates.status && prev && prev.tableId) {
        const tableService = await import("./table.service.js");
        if (updates.status === "seated") {
          await tableService.default.updateTableStatus(prev.tableId, "occupied");
        } else if (updates.status === "completed" || updates.status === "cancelled" || updates.status === "no-show") {
          await tableService.default.updateTableStatus(prev.tableId, "available");
        } else if (updates.status === "reserved") {
          await tableService.default.updateTableStatus(prev.tableId, "reserved");
        }
      }
    } catch (e) {
      // non-fatal
    }
    try {
      if (global.io) {
        global.io.to("cashier").emit("booking:updated", updated);
        if (updated.restaurantId) global.io.to(`restaurant:${updated.restaurantId}`).emit("booking:updated", updated);
      }
    } catch (e) {
      console.warn("booking:updated emit failed", e.message);
    }
    return updated;
  }

  // CUSTOMER FEATURE: Customer can cancel their own booking
  async cancelBooking(id, customerEmail = null) {
    const booking = await bookingRepository.findById(id);
    if (!booking) throw new Error("Booking not found");

    // Only pending bookings may be cancelled by customers
    if (booking.status !== "pending") {
      throw new Error("Only pending bookings can be cancelled by customers");
    }

    // Verify ownership when customerEmail provided
    if (!customerEmail) {
      throw new Error("Customer email is required to cancel booking");
    }
    if (String(booking.customerEmail) !== String(customerEmail)) {
      throw new Error("You can only cancel your own bookings");
    }

    const updated = await bookingRepository.update(id, { status: "cancelled" });

    // Free up table if it was assigned
    if (booking.tableId && ["confirmed", "seated"].includes(booking.status)) {
      await tableRepository.update(booking.tableId, { status: "available" });
    }

    try {
      if (global.io) {
        global.io.to("cashier").emit("booking:cancelled", updated);
        if (updated.restaurantId) global.io.to(`restaurant:${updated.restaurantId}`).emit("booking:cancelled", updated);
      }
    } catch (e) {}
    return updated;
  }

  // CASHIER FEATURE: Get today's bookings (pending & confirmed only)
  async getTodayBookings(restaurantId) {
    const today = new Date().toISOString().slice(0, 10);
    return await bookingRepository.find({
      restaurantId,
      date: today,
      status: { $in: ["pending", "confirmed", "seated"] }
    });
  }

  // CASHIER FEATURE: Get upcoming bookings for specified days
  async getUpcomingBookings(restaurantId, days = 7) {
    const result = [];
    const now = new Date();
    for (let i = 0; i < days; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const dayStr = d.toISOString().slice(0, 10);
      const list = await bookingRepository.find({
        restaurantId,
        date: dayStr,
        status: { $in: ["pending", "confirmed", "seated"] }
      });
      result.push(...list);
    }
    return result;
  }

  async getBookingsByDate(restaurantId, date) {
    return await bookingRepository.find({
      restaurantId,
      date,
      status: { $ne: "cancelled" }
    });
  }

  async getBookingById(id) {
    return await bookingRepository.findById(id);
  }

  // ADMIN FEATURE: Get booking analytics for a date range
  async getBookingAnalytics(restaurantId, startDate, endDate) {
    const bookings = await bookingRepository.find({
      restaurantId,
      date: { $gte: startDate, $lte: endDate }
    });

    const analytics = {
      total: bookings.length,
      byStatus: {},
      bySource: {},
      totalGuests: 0,
      averageGuestSize: 0
    };

    for (const booking of bookings) {
      // Count by status
      analytics.byStatus[booking.status] = (analytics.byStatus[booking.status] || 0) + 1;
      // Count by source
      analytics.bySource[booking.source] = (analytics.bySource[booking.source] || 0) + 1;
      // Total guests
      analytics.totalGuests += booking.guests;
    }

    analytics.averageGuestSize = bookings.length > 0 ? Math.round(analytics.totalGuests / bookings.length) : 0;
    return analytics;
  }
}

export default new BookingService();
