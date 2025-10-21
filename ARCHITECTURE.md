# Mini Hotel Therapy Booking System - Backend Architecture

## 1. Overview

This document outlines the backend architecture for the Mini Hotel Therapy Booking System. The system is designed as a modern, scalable, and secure RESTful API using a Node.js and MongoDB stack. It will manage user roles, therapies, therapists, rooms, and the entire booking process. The architecture emphasizes a clean separation of concerns, following the structure provided. The primary user roles are `Customer` and `Admin`.

## 2. Technology Stack

The backend will be built using a modern, stable, and maintainable technology stack with TypeScript for type safety.

- **Runtime Environment:** Node.js
- **Language:** TypeScript
- **Framework:** Express.js
- **Database:** MongoDB (NoSQL Document Database)
- **ODM:** Mongoose (for elegant MongoDB object modeling)
- **Authentication:** JSON Web Tokens (JWT)
- **Password Hashing:** `bcrypt`
- **Validation:** `zod` (for schema-based validation)
- **Email Service:** Nodemailer (with a provider like SendGrid or Resend)
- **Logging:** Winston & Morgan
- **Scheduled Tasks:** `node-cron`
- **Caching:** Redis / Upstash (with a library like `ioredis`)

## 3. Directory Structure

The project follows a feature-based directory structure. **Auth and User management are already implemented.**

```
/src
|-- /config
|   |-- api.config.ts
|   |-- cache.config.ts
|   |-- logger.config.ts
|   |-- mongo.config.ts
|-- /constants
|   |-- cache.keys.ts
|   |-- user.roles.ts          ✅ EXISTS (needs role update)
|-- /controllers
|   |-- auth.controller.ts     ✅ EXISTS
|   |-- users.controller.ts    ✅ EXISTS
|   |-- therapies.controller.ts
|   |-- therapists.controller.ts
|   |-- rooms.controller.ts
|   |-- bookings.controller.ts
|-- /errors
|   |-- HttpError.ts
|-- /lib
|   |-- /cache
|   |   |-- cache.factory.ts
|   |   |-- redis.upstash.adapter.ts
|-- /middleware
|   |-- asyncHandler.ts
|   |-- auth.middleware.ts
|   |-- error.middleware.ts
|   |-- logger.middleware.ts
|-- /models
|   |-- User.model.ts          ✅ EXISTS (needs role update)
|   |-- Therapy.model.ts
|   |-- Therapist.model.ts
|   |-- Room.model.ts
|   |-- Booking.model.ts
|-- /routes
|   |-- auth.routes.ts         ✅ EXISTS
|   |-- users.routes.ts        ✅ EXISTS
|   |-- therapies.routes.ts
|   |-- therapists.routes.ts
|   |-- rooms.routes.ts
|   |-- bookings.routes.ts
|-- /services
|   |-- auth.service.ts        ✅ EXISTS
|   |-- users.service.ts       ✅ EXISTS
|   |-- therapies.service.ts
|   |-- therapists.service.ts
|   |-- rooms.service.ts
|   |-- bookings.service.ts
|   |-- email.service.ts
|   |-- scheduler.service.ts
|-- /utils
|   |-- apiResponse.util.ts
|   |-- cache.util.ts
|   |-- jwt.util.ts
|   |-- logger.util.ts
```

## 4. Database Schema (MongoDB Collections)

We will use Mongoose to define schemas for our MongoDB collections. Data relationships will be managed using `ObjectId` references.

### `users` collection ✅ EXISTS (needs updates)

**Current state:** Has email, name, picture, role (default: "user"), googleId, lastLoggedIn  
**Changes needed:**

```javascript
const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String },
    picture: { type: String },
    role: { type: String, enum: ["customer", "admin"], default: "customer" }, // UPDATE: Change from LMS roles (student/owner/instructor)
    googleId: { type: String, unique: true, sparse: true },
    contact: { type: String }, // ADD THIS FIELD
    lastLoggedIn: { type: Date },
  },
  { timestamps: true }
);
```

### `therapies` collection

```javascript
const therapySchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
    duration: { type: Number, required: true }, // in minutes
    price: { type: Number, required: true },
  },
  { timestamps: true }
);
```

### `therapists` collection

```javascript
const therapistSchema = new Schema(
  {
    name: { type: String, required: true },
    specialization: { type: String, required: true },
    email: { type: String }, // for notifications (optional)
    contact: { type: String },
  },
  { timestamps: true }
);
```

### `rooms` collection

```javascript
const roomSchema = new Schema(
  {
    roomNumber: { type: String, required: true, unique: true },
    capacity: { type: Number, default: 1 },
  },
  { timestamps: true }
);
```

### `bookings` collection

```javascript
const bookingSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    therapyId: { type: Schema.Types.ObjectId, ref: "Therapy", required: true },
    therapistId: {
      type: Schema.Types.ObjectId,
      ref: "Therapist",
      required: true,
    },
    roomId: { type: Schema.Types.ObjectId, ref: "Room", required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ["CONFIRMED", "CANCELLED"],
      default: "CONFIRMED",
    },
    reminderSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Index for efficient conflict checking
bookingSchema.index({ therapistId: 1, startTime: 1, endTime: 1 });
bookingSchema.index({ roomId: 1, startTime: 1, endTime: 1 });
bookingSchema.index({ userId: 1, startTime: -1 }); // for user's booking list
```

## 5. Core Application Flows

### Flow 1: User Authentication & Authorization ✅ ALREADY IMPLEMENTED

1.  **Register/Login:** Already handled by existing `auth.controller` and `auth.service`
2.  **Authorization:** Already handled by existing `auth.middleware`
3.  **Enhancement needed:** Update user roles from current to `CUSTOMER` and `ADMIN`

### Flow 2: Therapy Booking & Conflict Check

This is the system's core transactional flow.

1.  **Request:** Admin sends `POST /api/admin/bookings` with booking data
2.  **Validation:** Controller validates using Zod schema
3.  **Conflict Check:** `bookings.service` checks for conflicts:
    ```javascript
    // Check if therapist OR room is already booked for overlapping time
    const conflict = await Booking.findOne({
      $or: [{ therapistId: therapistId }, { roomId: roomId }],
      status: "CONFIRMED",
      // Time overlap: (existing.start < new.end) AND (existing.end > new.start)
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
    });
    ```
4.  **Create Booking:** If no conflict, create booking document
5.  **Send Notification:** Call `email.service` to send confirmation

### Flow 3: Automated Reminders (node-cron)

1.  **Schedule:** Run cron job every hour (e.g., `0 * * * *`)
2.  **Query:** Find bookings where:
    - `status = 'CONFIRMED'`
    - `reminderSent = false`
    - `startTime` is 24 hours from now
3.  **Send Email:** Use `email.service` to send reminder
4.  **Update:** Set `reminderSent = true`

## 6. API Endpoints

The API will expose the following endpoints, organized by routes.

### Authentication (`/api/auth`) ✅ ALREADY IMPLEMENTED

- `POST /register` - Register a new customer
- `POST /login` - Login for any user

* `POST /google` - Google OAuth login
* `POST /logout` - Logout user

### Customer Panel (`/api/users/me`) ✅ MOSTLY IMPLEMENTED

- `GET /me` - View own profile ✅ EXISTS
- `PUT /:id` - Update own profile ✅ EXISTS (with ownDataMiddleware)
- `GET /me/bookings` - Get personal bookings (TO IMPLEMENT)
  - Query params: `?filter=today|upcoming|past`

### Admin Panel - Protected (Admin Role)

#### User Management (`/api/users`) ✅ ALREADY IMPLEMENTED

- `GET /` - Get all customers ✅ EXISTS (with search & pagination)
  - Query params: `?page=1&limit=10&searchKeyword=term&searchBy=role|name`
- `GET /:id` - Get single user ✅ EXISTS
- `PUT /:id` - Update user ✅ EXISTS
- `DELETE /:id` - Delete a customer ✅ EXISTS
- `PUT /:id/role` - Change user role ✅ EXISTS

#### Therapy Management (`/api/therapies`)

- `POST /` - Create therapy
- `GET /` - Get all therapies (with search & pagination)
- `GET /:id` - Get single therapy
- `PUT /:id` - Update therapy
- `DELETE /:id` - Delete therapy

#### Therapist Management (`/api/therapists`)

- `POST /` - Create therapist
- `GET /` - Get all therapists (with search & pagination)
- `GET /:id` - Get single therapist
- `PUT /:id` - Update therapist
- `DELETE /:id` - Delete therapist

#### Room Management (`/api/rooms`)

- `POST /` - Create room
- `GET /` - Get all rooms (with status)
- `GET /:id` - Get single room
- `PUT /:id` - Update room
- `DELETE /:id` - Delete room

#### Booking Management (`/api/bookings`)

- `POST /` - Create/assign therapy session
- `GET /` - Get all bookings (with filters)
  - Query params: `?therapistId=xxx&roomId=xxx&date=YYYY-MM-DD&page=1&limit=10`
- `GET /:id` - Get single booking
- `PUT /:id` - Update/reschedule booking
- `DELETE /:id` - Cancel booking

#### Dashboard (`/api/dashboard`)

- `GET /stats` - Get system statistics
  - Returns: total customers, total therapies, today's active sessions

## 7. Error Handling & Security ✅ ALREADY IMPLEMENTED

- **Centralized Error Handling:** Already implemented via `asyncHandler` and `error.middleware`
- **Security:**
  - **Password Hashing:** Using `bcrypt` (already implemented)
  - **JWT Authentication:** Already implemented
  - **Input Validation:** Use `zod` for all new endpoints
  - **Environment Variables:** Already configured via `.env`

## 8. Implementation Checklist

### Phase 0: Update Existing Code (LMS → Therapy System) 🔴 CRITICAL FIRST

**These MUST be updated first to convert from LMS to Therapy Booking System:**

- [ ] Update `user.roles.ts` - Change from `student/admin/owner/instructor` to `customer/admin`
- [ ] Update `User.model.ts` - Add `contact` field, update role enum to `['customer', 'admin']`, change default from `'user'` to `'customer'`
- [ ] Update `google.auth.service.ts` - Change first user assignment from `UserRole.OWNER` to `UserRole.ADMIN`, new users from `UserRole.STUDENT` to `UserRole.CUSTOMER`
- [ ] Update `users.service.ts` - Update role validation to use `customer/admin` only
- [ ] Update `users.routes.ts` - Change role guards from `UserRole.OWNER, UserRole.ADMIN` to just `UserRole.ADMIN`
- [ ] Update `auth.middleware.ts` - Verify role checks work with new role names
- [ ] Test existing user endpoints after role changes (`GET /users/me`, `GET /users`, etc.)

### Phase 1: Core Models & Services

- [ ] Create `Therapy.model.ts` - name, description, duration, price
- [ ] Create `Therapist.model.ts` - name, specialization, email, contact
- [ ] Create `Room.model.ts` - roomNumber, capacity
- [ ] Create `Booking.model.ts` - with indexes for conflict checking (therapistId, roomId, startTime, endTime)
- [ ] Create `therapies.service.ts` - CRUD operations with pagination
- [ ] Create `therapists.service.ts` - CRUD operations with pagination
- [ ] Create `rooms.service.ts` - CRUD operations with availability status
- [ ] Create `bookings.service.ts` - with conflict check logic (overlapping time slots)

### Phase 2: Controllers & Routes

- [ ] Create `therapies.controller.ts` & `therapies.routes.ts` - Admin CRUD endpoints
- [ ] Create `therapists.controller.ts` & `therapists.routes.ts` - Admin CRUD endpoints
- [ ] Create `rooms.controller.ts` & `rooms.routes.ts` - Admin CRUD endpoints
- [ ] Create `bookings.controller.ts` & `bookings.routes.ts` - Admin booking management
- [ ] Add `GET /users/me/bookings` to `users.controller.ts` - Customer view their bookings
- [ ] Register all new routes in `index.ts`

### Phase 3: Notifications & Scheduler

- [ ] Create `email.service.ts` - Using Nodemailer with SendGrid/Resend
- [ ] Create `scheduler.service.ts` - Using node-cron for 24-hour reminders
- [ ] Create email templates (booking confirmation, cancellation, reminder)
- [ ] Integrate email sending in booking creation/cancellation
- [ ] Test reminder scheduler (find bookings 24h away, send email, mark reminderSent)

### Phase 4: Testing & Refinement

- [ ] Test conflict checking logic (therapist/room overlapping time slots)
- [ ] Test email notifications (confirmation, cancellation, reminders)
- [ ] Test automated reminders with cron job
- [ ] Verify all role-based access controls (customer can only see own bookings, admin can manage all)
- [ ] Test pagination and search on all endpoints
