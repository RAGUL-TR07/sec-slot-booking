# Slot Booking System - Technical Documentation

This README provides a comprehensive overview of the **Slot Booking** project, detailed enough to guide the development of a production-ready backend and database.

---

## 1. Project Overview
A web-based slot booking application for students and admins. Students can browse subjects, select time slots, and book seats in specific rooms. Admins manage the system, scan QR codes for attendance, and generate reports.

---

## 2. Frontend Architecture
The frontend is built with **React**, **Vite**, **Tailwind CSS**, and **shadcn/ui**.

### Key Routes
All routes are defined in `src/App.tsx`.
- **Public**:
  - `/login`: User authentication.
- **Student (Protected)**:
  - `/dashboard`: Overview of upcoming bookings and quick actions.
  - `/book`: Step-by-step booking flow (Subject -> Slot -> Seat).
  - `/bookings`: View and manage current active bookings.
  - `/history`: Previous booking records.
  - `/profile`: User details and settings.
- **Admin (Protected)**:
  - `/admin`: Dashboard with high-level statistics.
  - `/admin/subjects`: Management of academic subjects.
  - `/admin/slots`: Management of available time windows.
  - `/admin/rooms`: Configuration of halls and seat layouts.
  - `/admin/scanner`: QR code validation for student check-ins.
  - `/admin/reports`: Data visualization and export.

---

## 3. Data Models (Database Schema)
To build a backend, the following entities are required:

### Users (Students and Admins)
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `name` | String | Full name |
| `refNumber` | String | Unique student/admin ID (e.g., SEC2024001) |
| `email` | String | Unique email address |
| `password` | Hash | Hashed password |
| `role` | Enum | `student` or `admin` |
| `department` | String | Department name |
| `year` | String | (Optional) Academic year |

### Subjects
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `code` | String | Subject Code (e.g., CS101) |
| `name` | String | Subject Name |
| `department` | String | Department offering the subject |
| `semester` | Integer | Targeted semester |
| `isActive` | Boolean | Visibility toggle |

### Rooms / Halls
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `name` | String | Room name (e.g., Hall A) |
| `building` | String | Building name |
| `floor` | Integer | Floor level |
| `rows` | Integer | Number of seat rows |
| `columns` | Integer | Number of seat columns |
| `capacity` | Integer | Total seat count |
| `isActive` | Boolean | Availability toggle |

### TimeSlots
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `subjectId` | UUID | Foreign Key (Subjects) |
| `roomId` | UUID | Foreign Key (Rooms) |
| `startTime` | Time | Start time of the slot |
| `endTime` | Time | End time of the slot |
| `date` | Date | Date of the slot |
| `isActive` | Boolean | Availability toggle |

### Bookings
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `bookingRef` | String | Unique Reference (e.g., BK-20240325-001) |
| `studentId` | UUID | Foreign Key (Users) |
| `subjectId` | UUID | Foreign Key (Subjects) |
| `slotId` | UUID | Foreign Key (TimeSlots) |
| `roomId` | UUID | Foreign Key (Rooms) |
| `seatLabel` | String | Seat coordinates (e.g., A1, B4) |
| `status` | Enum | `upcoming`, `completed`, `cancelled` |
| `qrPayload` | Text | Encrypted string for QR generation |
| `createdAt` | Timestamp| Time of creation |

---

## 4. Required API Endpoints (Backend REST API)

### Authentication
- `POST /api/auth/login`: Validate credentials and return JWT.
- `GET /api/auth/me`: Get current user info from token.

### Student Booking Flow
- `GET /api/subjects`: List active subjects.
- `GET /api/slots?subjectId={id}`: List available slots for a subject.
- `GET /api/rooms/{id}/seat-map`: Get current booking status for all seats in a room/slot.
- `POST /api/bookings`: Create a new booking (Must validate seat availability).
- `GET /api/student/{id}/bookings`: List bookings for a specific student.
- `DELETE /api/bookings/{id}`: Cancel an upcoming booking.

### Admin Management
- `GET /api/admin/stats`: Get counts for dashboards (Total bookings today, etc.).
- `POST /api/admin/subjects`: Create/Update subjects.
- `POST /api/admin/slots`: Schedule new time slots.
- `POST /api/admin/bookings/validate`: Validate QR code payload and mark as `completed`.
- `GET /api/admin/reports`: Export/Fetch booking aggregates.

---

## 5. Implementation Recommendations
1. **Concurrency Control**: When processing `POST /api/bookings`, use database transactions/locks to prevent double-booking the same seat.
2. **Security & RBAC**: All routes except `/login` must be protected by JWT middleware. Role-based access control (RBAC) should ensure students cannot access `/api/admin/*` endpoints.
3. **QR Code Security**: The `qrPayload` should ideally be a unique hash that the backend can verify upon scanning to prevent forge attempts.
4. **Dev Stack Recommendation**:
   - **Runtime**: Node.js (Express) or Bun.
   - **Database**: PostgreSQL (Structured data) or MongoDB (Flexible schema).
   - **ORM**: Prisma or Mongoose.
