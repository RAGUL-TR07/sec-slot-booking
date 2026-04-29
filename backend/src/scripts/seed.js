'use strict';

/**
 * SEC Slot Booking System — Full Database Seeder
 *
 * Creates:
 * - 1 Admin user
 * - 5 Student users
 * - 4 Subjects
 * - 3 Rooms
 * - 6 Time Slots
 * - 2 Sample Bookings
 *
 * Usage: node src/scripts/seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Load models
const User = require('../models/User');
const Subject = require('../models/Subject');
const Room = require('../models/Room');
const TimeSlot = require('../models/TimeSlot');
const Booking = require('../models/Booking');
const { createQrPayload } = require('../utils/qr');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sec_slot_booking';

async function hashPwd(pwd) {
  return bcrypt.hash(pwd, 12);
}

// ─── Seed Data Definitions ────────────────────────────────────────────────────

const adminData = {
  name: 'System Administrator',
  refNumber: 'ADMIN01',
  email: 'admin@sec.edu.in',
  role: 'admin',
  department: 'Administration',
  year: 'N/A',
  isActive: true,
};

const studentsData = [
  {
    name: 'RAGUL T R',
    refNumber: '23013400',
    email: 'RAGULTR@sec.edu.in',
    role: 'student',
    department: 'ECE',
    year: '3rd Year',
  },
  {
    name: 'ARJUN K',
    refNumber: '23014193',
    email: 'arjunk@sec.edu.in',
    role: 'student',
    department: 'CSE',
    year: '3rd Year',
  },
];

const subjectsData = [
  {
    code: 'CS301',
    name: 'Data Structures and Algorithms',
    department: 'Computer Science',
    semester: 5,
    description: 'Core CS subject covering arrays, trees, graphs, and algorithm analysis',
    isActive: true,
  },
  {
    code: 'CS302',
    name: 'Database Management Systems',
    department: 'Computer Science',
    semester: 5,
    description: 'Relational databases, SQL, normalization, transactions',
    isActive: true,
  },
  {
    code: 'IT401',
    name: 'Web Technologies',
    department: 'Information Technology',
    semester: 7,
    description: 'HTML, CSS, JavaScript, Node.js, REST APIs',
    isActive: true,
  },
  {
    code: 'EC201',
    name: 'Digital Electronics',
    department: 'Electronics',
    semester: 3,
    description: 'Logic gates, flip-flops, combinational circuits',
    isActive: true,
  },
];

const roomsData = [
  {
    name: 'Lab-101',
    building: 'A Block',
    floor: 1,
    rows: 5,
    columns: 8,
    blockedSeats: ['E8'], // blocked for emergency exit
    isActive: true,
  },
  {
    name: 'Seminar Hall',
    building: 'B Block',
    floor: 0,
    rows: 8,
    columns: 10,
    blockedSeats: [],
    isActive: true,
  },
  {
    name: 'Exam Hall-3',
    building: 'C Block',
    floor: 2,
    rows: 6,
    columns: 9,
    blockedSeats: ['F9'],
    isActive: true,
  },
];

// ─── Main Seeder ──────────────────────────────────────────────────────────────

async function seed() {
  console.log('\n🌱 Starting SEC Slot Booking Database Seeder...\n');
  console.log(`📦 Connecting to: ${MONGODB_URI}`);

  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  // ── Clean existing data ────────────────────────────────────────────────────
  console.log('🗑️  Dropping existing data...');
  await Promise.all([
    User.deleteMany({}),
    Subject.deleteMany({}),
    Room.deleteMany({}),
    TimeSlot.deleteMany({}),
    Booking.deleteMany({}),
  ]);
  console.log('   Done.\n');

  // ── Create Admin ───────────────────────────────────────────────────────────
  console.log('👤 Creating admin user...');
  const adminPwd = await hashPwd('admin123');
  const admin = await User.create({ ...adminData, passwordHash: adminPwd });
  console.log(`   ✅ Admin: ${admin.refNumber} / password: admin123`);

  // ── Create Students ────────────────────────────────────────────────────────
  console.log('\n🎓 Creating student users...');
  const studentPasswordMap = {
    '23013400': '0707',       // Ragul
    '23014193': '1223',       // Custom password as requested
  };

  const students = [];
  for (const s of studentsData) {
    const pwd = await hashPwd(studentPasswordMap[s.refNumber] || 'student123');
    const student = await User.create({ ...s, passwordHash: pwd, isActive: true });
    students.push(student);
    console.log(`   ✅ Student: ${student.refNumber} | ${student.name} | pwd: ${studentPasswordMap[student.refNumber]}`);
  }

  // ── Create Subjects ────────────────────────────────────────────────────────
  console.log('\n📚 Creating subjects...');
  const subjects = await Subject.insertMany(subjectsData);
  subjects.forEach((s) => console.log(`   ✅ ${s.code}: ${s.name}`));

  // ── Create Rooms ───────────────────────────────────────────────────────────
  console.log('\n🏠 Creating rooms...');
  const rooms = [];
  for (const rd of roomsData) {
    const capacity = rd.rows * rd.columns;
    const room = await Room.create({ ...rd, capacity });
    rooms.push(room);
    console.log(`   ✅ ${room.name} | ${room.building} | ${room.rows}×${room.columns} = ${capacity} seats`);
  }

  // ── Create Time Slots ──────────────────────────────────────────────────────
  console.log('\n🕐 Creating time slots...');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  const slotsToCreate = [
    // CS301 in Lab-101
    {
      subjectId: subjects[0]._id,
      roomId: rooms[0]._id,
      date: addDays(today, 1),
      startTime: '09:00',
      endTime: '11:00',
      totalSeats: rooms[0].rows * rooms[0].columns - rooms[0].blockedSeats.length,
      availableSeats: rooms[0].rows * rooms[0].columns - rooms[0].blockedSeats.length,
      isActive: true,
    },
    {
      subjectId: subjects[0]._id,
      roomId: rooms[0]._id,
      date: addDays(today, 3),
      startTime: '14:00',
      endTime: '16:00',
      totalSeats: rooms[0].rows * rooms[0].columns - rooms[0].blockedSeats.length,
      availableSeats: rooms[0].rows * rooms[0].columns - rooms[0].blockedSeats.length,
      isActive: true,
    },
    // CS302 in Seminar Hall
    {
      subjectId: subjects[1]._id,
      roomId: rooms[1]._id,
      date: addDays(today, 2),
      startTime: '10:00',
      endTime: '12:00',
      totalSeats: rooms[1].rows * rooms[1].columns,
      availableSeats: rooms[1].rows * rooms[1].columns,
      isActive: true,
    },
    // IT401 in Exam Hall
    {
      subjectId: subjects[2]._id,
      roomId: rooms[2]._id,
      date: addDays(today, 1),
      startTime: '13:00',
      endTime: '15:00',
      totalSeats: rooms[2].rows * rooms[2].columns - rooms[2].blockedSeats.length,
      availableSeats: rooms[2].rows * rooms[2].columns - rooms[2].blockedSeats.length,
      isActive: true,
    },
    // EC201 in Seminar Hall
    {
      subjectId: subjects[3]._id,
      roomId: rooms[1]._id,
      date: addDays(today, 4),
      startTime: '09:00',
      endTime: '11:00',
      totalSeats: rooms[1].rows * rooms[1].columns,
      availableSeats: rooms[1].rows * rooms[1].columns,
      isActive: true,
    },
    // CS301 - past slot for history
    {
      subjectId: subjects[0]._id,
      roomId: rooms[0]._id,
      date: addDays(today, -2),
      startTime: '09:00',
      endTime: '11:00',
      totalSeats: rooms[0].rows * rooms[0].columns - rooms[0].blockedSeats.length,
      availableSeats: rooms[0].rows * rooms[0].columns - rooms[0].blockedSeats.length - 2,
      bookedSeats: 2,
      isActive: true,
    },
  ];

  const slots = await TimeSlot.insertMany(slotsToCreate);
  slots.forEach((sl, i) => {
    console.log(`   ✅ Slot ${i + 1}: ${sl.startTime}–${sl.endTime} | ${sl.date.toISOString().split('T')[0]} | ${sl.availableSeats} seats`);
  });

  // ── Create Sample Bookings ─────────────────────────────────────────────────
  console.log('\n📋 Creating sample bookings...');

  // Past completed booking for Arjun
  const pastSlot = slots[5];
  const pastBookingData = {
    studentId: students[0]._id,
    subjectId: subjects[0]._id,
    slotId: pastSlot._id,
    roomId: rooms[0]._id,
    seatRow: 'A',
    seatColumn: '1',
    seatLabel: 'A1',
    status: 'completed',
    qrPayload: 'placeholder',
  };
  const pastBooking = await Booking.create(pastBookingData);
  pastBooking.qrPayload = createQrPayload(pastBooking);
  pastBooking.qrVerifiedAt = new Date();
  pastBooking.verifiedBy = admin._id;
  await pastBooking.save();
  console.log(`   ✅ Completed booking: ${pastBooking.bookingRef} (Arjun | A1 | past slot)`);

  // Second past booking for same student, different seat
  const pastBooking2Data = {
    studentId: students[0]._id,
    subjectId: subjects[0]._id,
    slotId: pastSlot._id,
    roomId: rooms[0]._id,
    seatRow: 'A',
    seatColumn: '2',
    seatLabel: 'A2',
    status: 'completed',
    qrPayload: 'placeholder',
  };
  // Only create if booking doesn't already use seatLabel A2 for same slot
  try {
    const pastBooking2 = await Booking.create(pastBooking2Data);
    pastBooking2.qrPayload = createQrPayload(pastBooking2);
    pastBooking2.qrVerifiedAt = new Date();
    pastBooking2.verifiedBy = admin._id;
    await pastBooking2.save();
    console.log(`   ✅ Completed booking: ${pastBooking2.bookingRef} (${students[0].name} | A2 | past slot)`);
  } catch (e) {
    console.log(`   ⚠️  Skipped duplicate booking (A2 already taken)`);
  }

  // Summary ──────────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('✨ DATABASE SEEDED SUCCESSFULLY');
  console.log('═'.repeat(60));
  console.log('\n📌 LOGIN CREDENTIALS:\n');
  console.log('   ADMIN:');
  console.log('   ─────────────────────────────────────');
  console.log(`   Ref Number : ${adminData.refNumber}`);
  console.log(`   Password   : admin123\n`);
  console.log('   STUDENTS:');
  console.log('   ─────────────────────────────────────');
  studentsData.forEach((s) => {
    const pwd = studentPasswordMap[s.refNumber] || 'student123';
    console.log(`   ${s.refNumber} | ${s.name.padEnd(20)} | pwd: ${pwd}`);
  });
  console.log('\n' + '═'.repeat(60) + '\n');

  await mongoose.disconnect();
  console.log('📦 MongoDB disconnected. Seeding complete!');
}

seed().catch((err) => {
  console.error('\n❌ Seeding failed:', err.message);
  console.error(err.stack);
  mongoose.disconnect().finally(() => process.exit(1));
});
