'use strict';

const Room = require('../models/Room');
const { createError } = require('../middleware/errorHandler');
const { paginationMeta, parseSortString } = require('../utils/helpers');

class RoomService {
  async getAll({ page = 1, limit = 20, isActive, building, sort = 'name' }) {
    const filter = {};
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true' || isActive === true;
    }
    if (building) filter.building = new RegExp(building, 'i');

    const skip = (page - 1) * limit;
    const sortObj = parseSortString(sort);

    const [rooms, total] = await Promise.all([
      Room.find(filter).sort(sortObj).skip(skip).limit(Number(limit)),
      Room.countDocuments(filter),
    ]);

    return {
      rooms: rooms.map((r) => r.toJSON()),
      meta: paginationMeta(total, page, limit),
    };
  }

  async getById(id) {
    const room = await Room.findById(id);
    if (!room) throw createError('Room not found', 404);
    return room.toJSON();
  }

  async create(data) {
    // Calculate capacity from rows × columns
    const capacity = data.rows * data.columns;
    const room = await Room.create({ ...data, capacity });
    return room.toJSON();
  }

  async update(id, data) {
    // If rows or columns are being updated, recalculate capacity
    const room = await Room.findById(id);
    if (!room) throw createError('Room not found', 404);

    const newRows = data.rows !== undefined ? data.rows : room.rows;
    const newCols = data.columns !== undefined ? data.columns : room.columns;
    data.capacity = newRows * newCols;

    const updated = await Room.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    return updated.toJSON();
  }

  async delete(id) {
    const room = await Room.findByIdAndDelete(id);
    if (!room) throw createError('Room not found', 404);
    return { message: 'Room deleted successfully' };
  }
}

module.exports = new RoomService();
