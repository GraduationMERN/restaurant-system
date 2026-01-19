import Booking from "./booking.model.js";

class BookingRepository {
  async create(data) {
    const b = new Booking(data);
    return await b.save();
  }

  async find(filter = {}) {
    return await Booking.find(filter).exec();
  }

  async findOne(filter = {}) {
    return await Booking.findOne(filter).exec();
  }

  async findById(id) {
    return await Booking.findById(id).exec();
  }

  async update(id, updates) {
    return await Booking.findByIdAndUpdate(id, updates, { new: true }).exec();
  }

  async delete(id) {
    return await Booking.findByIdAndDelete(id).exec();
  }
}

export default new BookingRepository();
