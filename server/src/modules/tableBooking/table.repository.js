import Table from "./table.model.js";

class TableRepository {
  async create(data) {
    const t = new Table(data);
    return await t.save();
  }

  async findById(id) {
    return await Table.findById(id).exec();
  }

  async find(filter = {}) {
    return await Table.find(filter).exec();
  }

  async update(id, updates) {
    return await Table.findByIdAndUpdate(id, updates, { new: true }).exec();
  }

  async delete(id) {
    return await Table.findByIdAndDelete(id).exec();
  }
}

export default new TableRepository();
