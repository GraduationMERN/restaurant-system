import tableService from "./table.service.js";

class TableController {
  // ADMIN: Create table
  async create(req, res, next) {
    try {
      const data = req.body;
      const created = await tableService.createTable(data);
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  }

  // ADMIN: List all tables for restaurant
  async list(req, res, next) {
    try {
      const { restaurantId } = req.query;
      const items = await tableService.listTables(restaurantId);
      res.json(items);
    } catch (err) {
      next(err);
    }
  }

  // ADMIN: Update table properties
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const updated = await tableService.updateTable(id, req.body);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }

  // ADMIN: Delete table
  async remove(req, res, next) {
    try {
      const { id } = req.params;
      const removed = await tableService.deleteTable(id);
      res.json({ success: true, removed });
    } catch (err) {
      next(err);
    }
  }

  // CASHIER: Update table status (available, occupied, reserved, cleaning)
  async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updated = await tableService.updateTableStatus(id, status);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }

  // ADMIN/CASHIER: Get floor plan with all tables and their positions
  async getFloorPlan(req, res, next) {
    try {
      const { restaurantId } = req.query;
      const plan = await tableService.getFloorPlan(restaurantId);
      res.json(plan);
    } catch (err) {
      next(err);
    }
  }

  // CASHIER: Check availability for specific date/time/guests
  // Query: ?restaurantId=xxx&date=YYYY-MM-DD&time=HH:mm&guests=2&durationMinutes=120
  async getAvailability(req, res, next) {
    try {
      const { restaurantId, date, time, guests, durationMinutes, bufferMinutes } = req.query;
      const available = await tableService.checkAvailability({
        restaurantId,
        date,
        time,
        guests: parseInt(guests),
        durationMinutes: durationMinutes ? parseInt(durationMinutes) : 120,
        bufferMinutes: bufferMinutes ? parseInt(bufferMinutes) : 15
      });
      res.json(available);
    } catch (err) {
      next(err);
    }
  }

  // ADMIN: Get tables by minimum capacity
  // Query: ?restaurantId=xxx&minCapacity=4
  async getByCapacity(req, res, next) {
    try {
      const { restaurantId, minCapacity } = req.query;
      const tables = await tableService.getByCapacity(restaurantId, minCapacity);
      res.json(tables);
    } catch (err) {
      next(err);
    }
  }

  // CASHIER: Get smart table suggestions for a booking
  // Query: ?restaurantId=xxx&date=YYYY-MM-DD&time=HH:mm&guests=4&durationMinutes=120&numTablesPreferred=1
  async suggestTables(req, res, next) {
    try {
      const { restaurantId, date, time, guests, durationMinutes, numTablesPreferred } = req.query;
      const suggestion = await tableService.suggestTables(restaurantId, {
        date,
        time,
        guests: parseInt(guests),
        durationMinutes: durationMinutes ? parseInt(durationMinutes) : 120,
        numTablesPreferred: numTablesPreferred ? parseInt(numTablesPreferred) : 1
      });
      res.json(suggestion);
    } catch (err) {
      next(err);
    }
  }

  // CASHIER: Mark table as being cleaned
  async markCleaning(req, res, next) {
    try {
      const { id } = req.params;
      const updated = await tableService.markCleaning(id);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }

  // CASHIER: Mark table as available after cleaning
  async markAvailable(req, res, next) {
    try {
      const { id } = req.params;
      const updated = await tableService.markAvailable(id);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }

  // ADMIN: Get table occupancy statistics for a date
  // Query: ?restaurantId=xxx&date=YYYY-MM-DD
  async getStats(req, res, next) {
    try {
      const { restaurantId, date } = req.query;
      const stats = await tableService.getTableStats(restaurantId, date);
      res.json(stats);
    } catch (err) {
      next(err);
    }
  }

  // ADMIN: Batch update multiple tables
  // Body: { tableIds: [id1, id2], updates: { isActive: false } }
  async bulkUpdate(req, res, next) {
    try {
      const { restaurantId } = req.query;
      const { tableIds, updates } = req.body;
      const results = await tableService.bulkUpdateTables(restaurantId, tableIds, updates);
      res.json(results);
    } catch (err) {
      next(err);
    }
  }
}

export default new TableController();
