import tableRepository from "./table.repository.js";
import restaurantRepository from "../restaurant/restaurant.repository.js";
import bookingRepository from "./booking.repository.js";
import { overlaps, toMinutes, getDurationMinutes } from "./time.utils.js";

class TableService {
  // ADMIN FEATURE: Create table with validation
  async createTable(data) {
    const { restaurantId, name, capacity } = data;

    // Validate required fields
    if (!name || !name.trim()) {
      throw new Error("Table name is required");
    }
    
    if (!capacity || capacity < 1) {
      throw new Error("Table capacity must be at least 1");
    }

    if (!restaurantId) {
      throw new Error("Restaurant ID is required to create a table");
    }

    return await tableRepository.create({
      ...data,
      status: "available" // New tables start as available
    });
  }

  // ADMIN FEATURE: List all tables for restaurant
  async listTables(restaurantId) {
    return await tableRepository.find({ restaurantId });
  }

  // ADMIN FEATURE: Update table (name, capacity, location, etc)
  async updateTable(id, updates) {
    // Don't allow status update through this endpoint - use dedicated method
    if (updates.status) {
      delete updates.status;
    }
    return await tableRepository.update(id, updates);
  }

  // ADMIN FEATURE: Delete table (only if no active bookings)
  async deleteTable(id) {
    // Check for active bookings
    const activeBookings = await bookingRepository.find({
      tableId: id,
      status: { $in: ["confirmed", "seated"] }
    });

    if (activeBookings.length > 0) {
      throw new Error(`Cannot delete table with ${activeBookings.length} active bookings`);
    }

    return await tableRepository.delete(id);
  }

  // Update table status and emit event (internal use)
  async updateTableStatus(id, status) {
    const validStatuses = ["available", "occupied", "reserved", "cleaning"];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(", ")}`);
    }

    const updated = await tableRepository.update(id, { status });
    try {
      if (global.io) {
        global.io.emit("table:updated", updated);
        if (updated.restaurantId) global.io.to(`restaurant:${updated.restaurantId}`).emit("table:updated", updated);
      }
    } catch (e) {
      console.warn("table:updated emit failed", e.message);
    }
    return updated;
  }

  // Mark table as being cleaned
  async markCleaning(tableId) {
    return await this.updateTableStatus(tableId, "cleaning");
  }

  // Mark table as available after cleaning
  async markAvailable(tableId) {
    return await this.updateTableStatus(tableId, "available");
  }

  // ADMIN FEATURE: Get floor plan with all table info
  async getFloorPlan(restaurantId) {
    // Return all tables with their current status and position for floor plan UI
    return await tableRepository.find({ restaurantId });
  }

  // ADMIN/CASHIER FEATURE: Get tables by minimum capacity
  async getByCapacity(restaurantId, minCapacity) {
    const filter = { restaurantId };
    if (minCapacity) filter.capacity = { $gte: Number(minCapacity) };
    return await tableRepository.find(filter);
  }

  // CASHIER FEATURE: Check table availability for a specific date/time
  // Returns list of tables that are available (no overlapping bookings)
  async checkAvailability({ restaurantId, date, time, guests, durationMinutes = 120, bufferMinutes = 15 }) {
    console.log('🔍 checkAvailability called with:', { restaurantId, date, time, guests, durationMinutes, bufferMinutes });
    
    // Get all active tables for this restaurant
    const candidates = await tableRepository.find({
      restaurantId,
      capacity: { $gte: Number(guests) },
      isActive: true
    });
    console.log(`📊 Found ${candidates.length} candidate tables (capacity >= ${guests}, isActive=true)`);

    // Get all confirmed bookings for this date (excluding cancelled)
    const bookings = await bookingRepository.find({
      restaurantId,
      date,
      status: { $in: ["confirmed", "seated", "reserved"] }
    });
    console.log(`📅 Found ${bookings.length} bookings on ${date}`);

    // Filter tables that don't have overlaps
    const available = candidates.filter((table) => {
      const tableBookings = bookings.filter((b) => String(b.tableId) === String(table._id));

      for (const booking of tableBookings) {
        // Check with buffer
        const requestStart = toMinutes(time);
        const requestEnd = requestStart + durationMinutes;
        const bookingStart = toMinutes(booking.startTime) - bufferMinutes;
        const bookingEnd = toMinutes(booking.endTime) + bufferMinutes;

        // If there's overlap, skip this table
        if (!(requestEnd <= bookingStart || requestStart >= bookingEnd)) {
          return false;
        }
      }
      return true;
    });

    return available;
  }

  // CASHIER FEATURE: Smart table assignment for a booking
  // Suggests the best available table(s) for a given number of guests
  async suggestTables(restaurantId, { date, time, guests, durationMinutes = 120, numTablesPreferred = 1 }) {
    console.log('💡 suggestTables called with:', { restaurantId, date, time, guests, durationMinutes, numTablesPreferred });
    
    // Get available tables
    const available = await this.checkAvailability({
      restaurantId,
      date,
      time,
      guests,
      durationMinutes
    });
    console.log(`✅ checkAvailability returned ${available.length} available tables`);

    if (available.length === 0) {
      return { tables: [], totalCapacity: 0, message: "No tables available for this time" };
    }

    // Sort by capacity (smallest suitable tables first - better for restaurant optimization)
    available.sort((a, b) => a.capacity - b.capacity);

    // Try to fit into minimum number of tables
    let selected = [];
    let totalCapacity = 0;

    for (const table of available) {
      if (totalCapacity >= guests) break;
      selected.push(table);
      totalCapacity += table.capacity;
    }

    return {
      tables: selected,
      totalCapacity,
      message: `Suggested ${selected.length} table(s) for ${guests} guests`
    };
  }

  // ADMIN FEATURE: Get table occupancy stats for analytics
  async getTableStats(restaurantId, date) {
    const tables = await tableRepository.find({ restaurantId });
    const bookings = await bookingRepository.find({
      restaurantId,
      date,
      status: { $in: ["confirmed", "seated"] }
    });

    const stats = {
      totalTables: tables.length,
      totalCapacity: tables.reduce((sum, t) => sum + t.capacity, 0),
      availableTables: 0,
      occupiedTables: 0,
      reservedTables: 0,
      tablesByCapacity: {}
    };

    for (const table of tables) {
      // Count by capacity
      if (!stats.tablesByCapacity[table.capacity]) {
        stats.tablesByCapacity[table.capacity] = { count: 0, name: `${table.capacity}-seater` };
      }
      stats.tablesByCapacity[table.capacity].count++;

      // Count by status
      const tableBooking = bookings.find((b) => String(b.tableId) === String(table._id));
      if (table.status === "available" && !tableBooking) {
        stats.availableTables++;
      } else if (table.status === "occupied" || (table.status === "reserved" && tableBooking)) {
        stats.occupiedTables++;
      } else if (table.status === "reserved") {
        stats.reservedTables++;
      }
    }

    return stats;
  }

  // ADMIN FEATURE: Batch update table settings (enable/disable, bulk capacity change, etc)
  async bulkUpdateTables(restaurantId, tableIds, updates) {
    const results = [];
    for (const tableId of tableIds) {
      const table = await tableRepository.findById(tableId);
      if (table && String(table.restaurantId) === String(restaurantId)) {
        const updated = await tableRepository.update(tableId, updates);
        results.push(updated);
      }
    }
    return results;
  }
}

export default new TableService();
