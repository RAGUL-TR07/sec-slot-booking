'use strict';

const Booking = require('../models/Booking');
const TimeSlot = require('../models/TimeSlot');
const User = require('../models/User');
const Subject = require('../models/Subject');
const { paginationMeta, parseSortString } = require('../utils/helpers');

class AdminService {
  /**
   * Dashboard statistics.
   */
  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalStudents,
      totalBookings,
      upcomingBookings,
      completedBookings,
      cancelledBookings,
      todayBookings,
      totalSubjects,
      totalSlots,
      activeSlots,
    ] = await Promise.all([
      User.countDocuments({ role: 'student', isActive: true }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'upcoming' }),
      Booking.countDocuments({ status: 'completed' }),
      Booking.countDocuments({ status: 'cancelled' }),
      Booking.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
      Subject.countDocuments({ isActive: true }),
      TimeSlot.countDocuments(),
      TimeSlot.countDocuments({ isActive: true, date: { $gte: today } }),
    ]);

    // Bookings per day for last 7 days
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const nextD = new Date(d);
      nextD.setDate(nextD.getDate() + 1);

      const count = await Booking.countDocuments({
        createdAt: { $gte: d, $lt: nextD },
        status: { $ne: 'cancelled' },
      });

      last7Days.push({
        date: d.toISOString().split('T')[0],
        count,
      });
    }

    return {
      totalStudents,
      totalBookings,
      upcomingBookings,
      completedBookings,
      cancelledBookings,
      todayBookings,
      totalSubjects,
      totalSlots,
      activeSlots,
      weeklyBookings: last7Days,
    };
  }

  /**
   * Get all bookings for admin with filters.
   */
  async getAllBookings({
    page = 1,
    limit = 20,
    status,
    subjectId,
    slotId,
    sort = '-createdAt',
    search,
  }) {
    const filter = {};
    if (status) filter.status = status;
    if (subjectId) filter.subjectId = subjectId;
    if (slotId) filter.slotId = slotId;

    const skip = (page - 1) * limit;
    const sortObj = parseSortString(sort);

    let query = Booking.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit))
      .populate('studentId', 'name refNumber email department')
      .populate('subjectId', 'code name')
      .populate('slotId', 'date startTime endTime')
      .populate('roomId', 'name building');

    const [bookings, total] = await Promise.all([
      query,
      Booking.countDocuments(filter),
    ]);

    return {
      bookings: bookings.map((b) => b.toJSON()),
      meta: paginationMeta(total, page, limit),
    };
  }

  /**
   * Reports: subject-wise booking summary.
   */
  async getReports() {
    const bookingsBySubject = await Booking.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: '$subjectId',
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          upcoming: { $sum: { $cond: [{ $eq: ['$status', 'upcoming'] }, 1, 0] } },
        },
      },
      {
        $lookup: {
          from: 'subjects',
          localField: '_id',
          foreignField: '_id',
          as: 'subject',
        },
      },
      { $unwind: '$subject' },
      {
        $project: {
          subjectCode: '$subject.code',
          subjectName: '$subject.name',
          department: '$subject.department',
          total: 1,
          completed: 1,
          upcoming: 1,
          attendanceRate: {
            $multiply: [
              { $divide: ['$completed', { $add: ['$completed', '$upcoming'] }] },
              100,
            ],
          },
        },
      },
      { $sort: { total: -1 } },
    ]);

    return { bookingsBySubject };
  }

  /**
   * Get all students (for admin user management).
   */
  async getStudents({ page = 1, limit = 20, search, department, sort = 'name' }) {
    const filter = { role: 'student' };
    if (department) filter.department = new RegExp(department, 'i');
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { refNumber: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
      ];
    }

    const skip = (page - 1) * limit;
    const sortObj = parseSortString(sort);

    const [students, total] = await Promise.all([
      User.find(filter).sort(sortObj).skip(skip).limit(Number(limit)),
      User.countDocuments(filter),
    ]);

    return {
      students: students.map((s) => s.toJSON()),
      meta: paginationMeta(total, page, limit),
    };
  }
}

module.exports = new AdminService();
