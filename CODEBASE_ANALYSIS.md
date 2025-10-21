# Codebase Analysis: LMS → Therapy Booking System

## Current State (LMS Template)

### ✅ What Already EXISTS and WORKS

#### 1. **Authentication System** (Google OAuth)

- **Files:**
  - `src/services/google.auth.service.ts` - OAuth2 flow with Google
  - `src/controllers/google.auth.controller.ts` - OAuth endpoints
  - `src/routes/auth.routes.ts` - `/api/v1/auth/google` and `/api/v1/auth/google/callback`
- **Features:**
  - Complete OAuth2 flow (initiate → callback → token exchange)
  - First user becomes OWNER (needs change to ADMIN)
  - Subsequent users become STUDENT (needs change to CUSTOMER)
  - JWT token generation and verification
  - State token validation for security

#### 2. **User Management System**

- **Files:**
  - `src/models/User.model.ts` - User schema with email, name, picture, role, googleId, lastLoggedIn
  - `src/services/users.service.ts` - Complete CRUD operations
  - `src/controllers/users.controller.ts` - 6 endpoints implemented
  - `src/routes/users.routes.ts` - All routes configured
- **Endpoints:**
  - ✅ `GET /api/v1/users/me` - Get own profile (updates lastLoggedIn)
  - ✅ `GET /api/v1/users` - Get all users with pagination
    - Supports: `?page=1&limit=10&searchKeyword=term&searchBy=role|name`
  - ✅ `GET /api/v1/users/:id` - Get single user (with ownDataMiddleware)
  - ✅ `PUT /api/v1/users/:id` - Update user (with ownDataMiddleware)
  - ✅ `DELETE /api/v1/users/:id` - Delete user (admin only)
  - ✅ `PUT /api/v1/users/:id/role` - Change user role (admin only)

#### 3. **Authorization & Middleware**

- **Files:**
  - `src/middleware/auth.middleware.ts` - Role-based access control
  - `src/middleware/error.middleware.ts` - Centralized error handling
  - `src/middleware/asyncHandler.ts` - Async error wrapper
  - `src/middleware/logger.middleware.ts` - Morgan HTTP logging
- **Features:**
  - JWT token verification
  - Role-based route protection (flexible: can be called with or without roles)
  - `ownDataMiddleware` - Ensures users can only access their own data
  - Cache integration for user profiles (60s TTL)
  - Proper error responses with status codes

#### 4. **Infrastructure**

- **Files:**
  - `src/config/mongo.config.ts` - MongoDB connection
  - `src/config/logger.config.ts` - Winston logger
  - `src/config/cache.config.ts` - Redis/Upstash config
  - `src/config/api.config.ts` - API base path
  - `src/lib/cache/cache.factory.ts` - Cache abstraction
  - `src/lib/cache/redis.upstash.adapter.ts` - Upstash implementation
  - `src/services/cache/cache.service.ts` - Cache operations
- **Features:**
  - MongoDB connection with retry logic
  - Winston logger with multiple transports
  - Redis caching with Upstash support
  - Environment variable configuration

#### 5. **Utilities**

- `src/utils/apiResponse.util.ts` - Standardized API responses (success, fail, paginated)
- `src/utils/jwt.util.ts` - JWT sign/verify
- `src/utils/logger.util.ts` - Service-specific logger creator
- `src/utils/cache.util.ts` - Cache key helpers, serialization

#### 6. **Constants & Error Handling**

- `src/constants/user.roles.ts` - **NEEDS UPDATE**: Currently has STUDENT, ADMIN, OWNER, INSTRUCTOR
- `src/constants/cache.keys.ts` - Cache key definitions
- `src/errors/HttpError.ts` - Custom error classes

---

## 🔴 CRITICAL Changes Needed (Phase 0)

### Issue: LMS-specific roles and logic

**Current LMS Roles:**

```typescript
export enum UserRole {
  STUDENT = "student",
  ADMIN = "admin",
  OWNER = "owner",
  INSTRUCTOR = "instructor",
}
```

**Therapy System Roles (Required):**

```typescript
export enum UserRole {
  CUSTOMER = "customer",
  ADMIN = "admin",
}
```

### Files That MUST Be Updated:

#### 1. `src/constants/user.roles.ts`

**Change:** Remove STUDENT, OWNER, INSTRUCTOR → Keep only CUSTOMER, ADMIN

```typescript
export enum UserRole {
  CUSTOMER = "customer",
  ADMIN = "admin",
}
```

#### 2. `src/models/User.model.ts`

**Current:**

- Default role: `"user"` (not in enum!)
- Missing `contact` field

**Changes needed:**

```typescript
role: { type: String, enum: ["customer", "admin"], default: "customer" },
contact: { type: String },
```

#### 3. `src/services/google.auth.service.ts` (Line ~143)

**Current logic:**

```typescript
const existingCount = await UserModel.countDocuments({}).exec();
const role = existingCount === 0 ? UserRole.OWNER : UserRole.STUDENT;
```

**Change to:**

```typescript
const existingCount = await UserModel.countDocuments({}).exec();
const role = existingCount === 0 ? UserRole.ADMIN : UserRole.CUSTOMER;
```

#### 4. `src/services/users.service.ts` (Line ~93)

**Current:** Validates against all 4 LMS roles
**Change:** Validate against only CUSTOMER and ADMIN

#### 5. `src/routes/users.routes.ts` (Multiple lines)

**Current:**

```typescript
authMiddleware(UserRole.OWNER, UserRole.ADMIN); // Line 15, 32, 38
```

**Change to:**

```typescript
authMiddleware(UserRole.ADMIN); // Only admin can manage users
```

#### 6. `src/middleware/auth.middleware.ts`

**Action:** Test that role checks work correctly after enum changes
**No code change needed** - just verify it still works

---

## 📝 What Needs to be IMPLEMENTED (New Features)

### Phase 1: Core Models & Services

**Nothing exists yet:**

- `Therapy.model.ts` - therapy types (name, description, duration, price)
- `Therapist.model.ts` - therapist info (name, specialization, email, contact)
- `Room.model.ts` - room details (roomNumber, capacity)
- `Booking.model.ts` - bookings with conflict indexes
- `therapies.service.ts` - CRUD with pagination
- `therapists.service.ts` - CRUD with pagination
- `rooms.service.ts` - CRUD with availability
- `bookings.service.ts` - with conflict check logic

### Phase 2: Controllers & Routes

**Nothing exists yet:**

- `therapies.controller.ts` & `therapies.routes.ts`
- `therapists.controller.ts` & `therapists.routes.ts`
- `rooms.controller.ts` & `rooms.routes.ts`
- `bookings.controller.ts` & `bookings.routes.ts`
- **Partial:** Add `GET /users/me/bookings` to existing `users.controller.ts`

### Phase 3: Notifications & Scheduler

**Nothing exists yet:**

- `email.service.ts` - Nodemailer integration
- `scheduler.service.ts` - node-cron for reminders
- Email templates (confirmation, cancellation, reminder)

---

## 🎯 Implementation Strategy

### Step 1: Phase 0 (Convert LMS → Therapy) - **MUST DO FIRST**

1. Update `user.roles.ts` enum
2. Update `User.model.ts` schema
3. Update `google.auth.service.ts` first-user logic
4. Update `users.service.ts` role validation
5. Update `users.routes.ts` route guards
6. Test all existing endpoints still work

### Step 2: Phase 1 (Models & Services)

- Create 4 new models (Therapy, Therapist, Room, Booking)
- Create 4 new services with CRUD operations
- **Reuse existing patterns:**
  - Copy pagination logic from `users.service.ts`
  - Use same error handling patterns
  - Follow same Mongoose schema structure

### Step 3: Phase 2 (Controllers & Routes)

- Create 4 new controller/route pairs
- **Reuse existing patterns:**
  - Copy structure from `users.controller.ts`
  - Use `authMiddleware(UserRole.ADMIN)` for admin routes
  - Use `apiResponse.success()` and `apiResponse.successPaginated()`
  - Follow same route registration pattern in `index.ts`

### Step 4: Phase 3 (Email & Scheduler)

- Integrate Nodemailer
- Set up node-cron scheduler
- Create email templates

---

## 🔍 Key Observations

### ✅ Good Patterns to Follow:

1. **Pagination:** Already implemented in `users.service.ts` - copy this pattern
2. **Search:** Supports keyword search with regex - reuse for therapies/therapists
3. **Role Guards:** Flexible `authMiddleware` - can pass roles or use without
4. **Own Data:** `ownDataMiddleware` ensures users access only their data
5. **Cache Strategy:** User profiles cached 60s - consider for frequently accessed data
6. **API Response:** Standardized with `apiResponse.util.ts` - use everywhere
7. **Error Handling:** `asyncHandler` wraps all async routes - consistent pattern
8. **Logging:** Service-specific loggers with structured data

### ⚠️ Things to Watch:

1. **Role Enum:** Currently mismatched (model has "user" default, enum doesn't have it)
2. **Cache Invalidation:** Some code commented out - decide if needed for therapy system
3. **Auth Service:** Completely commented out (only Google OAuth works)
4. **Rate Limiting:** Not implemented - may need for booking endpoints
5. **Input Validation:** No Zod schemas yet - should add for new endpoints

---

## 📊 Code Statistics

**Total Existing Files:** ~30 TypeScript files  
**Existing Routes:** 2 route files (auth, users)  
**Existing Controllers:** 3 controllers (auth, google.auth, users)  
**Existing Services:** 3 services (auth [commented], google.auth, users, cache)  
**Existing Models:** 1 model (User)  
**Middleware:** 4 middleware files (all working)

**To Be Created:**

- Models: 4 new (Therapy, Therapist, Room, Booking)
- Services: 6 new (4 CRUD + email + scheduler)
- Controllers: 4 new
- Routes: 4 new

---

## 🚀 Next Steps

1. **Confirm Phase 0 changes** with user
2. Start implementation with role updates
3. Test existing functionality after changes
4. Move to Phase 1 (new models/services)
5. Implement incrementally with testing at each phase
