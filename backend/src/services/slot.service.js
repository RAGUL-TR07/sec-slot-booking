'use strict';

const TimeSlot = require('../models/TimeSlot');
const Room = require('../models/Room');
const { createError } = require('../middleware/errorHandler');
const { paginationMeta, parseSortString } = require('../utils/helpers');
const { getIO } = require('../socket');

class SlotService {
  async getAll({ page = 1, limit = 20, subjectId, roomId, date, isActive, sort = 'date' }) {
    const filter = {};
    if (subjectId) filter.subjectId = subjectId;
    if (roomId) filter.roomId = roomId;
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true' || isActive === true;
    }
    if (date) {
      // Match entire day
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    }

    const skip = (page - 1) * limit;
    const sortObj = parseSortString(sort);

    const [slots, total] = await Promise.all([
      TimeSlot.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(Number(limit))
        .populate('subjectId', 'code name department')
        .populate('roomId', 'name building floor capacity rows columns blockedSeats'),
      TimeSlot.countDocuments(filter),
    ]);

    return {
      slots: slots.map((s) => s.toJSON()),
      meta: paginationMeta(total, page, limit),
    };
  }

  async getById(id) {
    const slot = await TimeSlot.findById(id)
      .populate('subjectId', 'code name department')
      .populate('roomId', 'name building floor capacity rows columns blockedSeats');
    if (!slot) throw createError('Time slot not found', 404);
    return slot.toJSON();
  }

  async create(data) {
    // Fetch room to get seat count
    const room = await Room.findById(data.roomId);
    if (!room || !room.isActive) {
      throw createError('Room not found or inactive', 404);
    }

    const totalSeats = room.rows * room.columns - room.blockedSeats.length;

    const slot = await TimeSlot.create({
      ...data,
      totalSeats,
      availableSeats: totalSeats,
    });

    const populated = await TimeSlot.findById(slot._id)
      .populate('subjectId', 'code name department')
      .populate('roomId', 'name building floor capacity rows columns blockedSeats');

    const result = populated.toJSON();
    try {
      getIO().emit('slot_updated', { action: 'slot_created', slot: result });
    } catch (err) {}
    return result;
  }

  async update(id, data) {
    const slot = await TimeSlot.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    })
      .populate('subjectId', 'code name department')
      .populate('roomId', 'name building floor capacity rows columns blockedSeats');

    if (!slot) throw createError('Time slot not found', 404);
    const result = slot.toJSON();
    try {
      getIO().emit('slot_updated', { slotId: id, action: 'slot_modified', slot: result });
    } catch (err) {}
    return result;
  }

  async delete(id) {
    const slot = await TimeSlot.findByIdAndDelete(id);
    if (!slot) throw createError('Time slot not found', 404);
    try {
      getIO().emit('slot_updated', { slotId: id, action: 'slot_deleted' });
    } catch (err) {}
    return { message: 'Slot deleted successfully' };
  }
}

module.exports = new SlotService();
