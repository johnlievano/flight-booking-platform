# AeroManage Quick Reference Guide

## 🚀 Quick Start

### Local Development Setup

```bash
# 1. Backend setup
cd backend
npm install
npx prisma migrate dev  # Create/update database
npm run seed            # Populate data

# 2. Create admin user
node scripts/createAdmin.js
# Follow prompts:
# - Name: John Admin
# - Email: admin@aeromanage.com
# - Password: Your secure password
# - Phone: Optional

# 3. Start backend
npm run dev             # Runs on http://localhost:4000

# 4. Frontend setup (in new terminal)
cd frontend
npm install
npm run dev             # Runs on http://localhost:5173
```

---

## 👤 User Roles

### ADMIN
- Can create/update/delete flights
- View all users and their bookings
- Change flight status
- Access `/admin` dashboard
- Authentication: Uses requireAdmin middleware

### PASSENGER
- Search and book flights
- View own tickets
- Update profile
- Access `/home` dashboard

---

## 🔐 Authentication Flow

```
1. User enters credentials (email + password)
2. Backend validates and creates JWT:
   {
     userId: 1,
     role: "ADMIN" | "PASSENGER",
     iat: 1234567890,
     exp: 1234654290
   }
3. Frontend stores JWT in localStorage
4. App decodes JWT on load to determine which dashboard to show
5. Admin-specific endpoints require requireAdmin middleware
```

### Login Types:
- **Admin**: Redirects to `/admin` dashboard
- **Passenger**: Redirects to `/home` (Dashboard)

---

## 📊 Admin Dashboard Sections

### 1. Overview (📊)
- **Total Flights**: Count of all flights
- **Total Users**: Count of registered users
- **Total Bookings**: Count of reservations

### 2. Flights (✈️)
**Table Columns:**
- Airline name
- Route (e.g., BOG → MIA)
- Departure time
- Available seats
- Price
- Status (dropdown)

**Actions:**
- Change status inline (ON_TIME | DELAYED | CANCELLED)
- Add new flight via modal
- View seat availability

**Add Flight Modal Fields:**
- Airline ID
- Origin Airport ID
- Destination Airport ID
- Departure datetime
- Arrival datetime
- Price
- Total Seats (default: 150)

### 3. Users (👥)
**Table Columns:**
- Name
- Email
- Phone
- Role (badge: ADMIN/PASSENGER)
- Booking count

**Features:**
- Filter by role
- View user details
- Track booking history

### 4. Bookings (🎫)
**Table Columns:**
- Passenger name
- Email
- Flights (route list)
- Status (CONFIRMED/PENDING/CANCELLED)
- Total price

---

## 🔌 API Endpoints

### Admin Endpoints (Require Authorization Header + ADMIN role)

```
GET    /api/admin/flights
POST   /api/admin/flights
PUT    /api/admin/flights/:id
DELETE /api/admin/flights/:id
PUT    /api/admin/flights/:id/status
GET    /api/admin/users
GET    /api/admin/bookings
```

### Request Format:
```javascript
axios.get('/api/admin/flights', {
  headers: {
    Authorization: `Bearer ${token}`
  }
});
```

### Flight Creation Example:
```json
POST /api/admin/flights
{
  "airlineId": 1,
  "originAirportId": 1,
  "destinationAirportId": 2,
  "departureTime": "2025-06-15T06:00:00Z",
  "arrivalTime": "2025-06-15T09:00:00Z",
  "price": 150000,
  "totalSeats": 150,
  "status": "ON_TIME"
}
```

---

## 📱 Flight Seat Layout

Each flight has 150 seats:

**Economy Class** (120 seats):
```
Row 1-20, Columns A-F
Format: "1A", "1B", "1C", "1D", "1E", "1F"
         "2A", "2B", "2C", "2D", "2E", "2F"
         ...and so on
```

**Business Class** (30 seats):
```
Row 1-8, Columns A-D (marked with 'B')
Format: "1AB", "1BB", "1CB", "1DB"
        "2AB", "2BB", "2CB", "2DB"
        ...and so on
```

---

## 💾 Database Schema

### User Model
```prisma
model User {
  id           Int           @id @default(autoincrement())
  name         String
  email        String        @unique
  password     String        (bcrypt hashed)
  phone        String?
  savedCard    String?
  isActive     Boolean       @default(true)
  avatarIndex  Int           @default(0)
  role         String        @default("PASSENGER")  // ← NEW
  reservations Reservation[]
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
}
```

---

## 🛫 Flight Data Generation

### Routes (8 total):
- BOG ↔ MIA (Miami)
- BOG ↔ MAD (Madrid)
- BOG ↔ MEX (Mexico City)
- BOG ↔ NYC (New York)
- BOG ↔ LIM (Lima)
- Plus reverse routes

### Schedule:
- **Period**: Jan 1, 2025 - Dec 31, 2026
- **Daily**: 3 flights per route
- **Times**: 06:00, 12:00, 18:00
- **Total**: ~17,520 flights

### Pricing:
- Base: 120,000 - 270,000 COP
- Weekend: +30% multiplier
- Night flights: +10% multiplier

---

## 🧪 Testing Admin Features

### Via API (cURL):
```bash
# Get all flights
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:4000/api/admin/flights

# Create flight
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "airlineId": 1,
    "originAirportId": 1,
    "destinationAirportId": 2,
    "departureTime": "2025-06-15T06:00:00",
    "arrivalTime": "2025-06-15T09:00:00",
    "price": 150000,
    "totalSeats": 150
  }' \
  http://localhost:4000/api/admin/flights
```

### Via Frontend:
1. Login with admin credentials
2. Auto-redirects to `/admin`
3. Click "Vuelos" tab
4. Click "+ Agregar Vuelo"
5. Fill form and submit
6. Flight appears in table

---

## 🔄 Admin Actions Workflow

### Change Flight Status:
```
1. Go to Flights tab
2. Find flight in table
3. Click status dropdown
4. Select: ON_TIME | DELAYED | CANCELLED
5. Auto-updates API and table
```

### Add New Flight:
```
1. Click "+ Agregar Vuelo"
2. Fill all required fields:
   - Airline ID (e.g., 1)
   - Origin/Destination Airport IDs
   - Date & Time
   - Price
3. Click "Crear"
4. Flight added to database and table
5. System auto-generates 150 seats
```

### View Statistics:
```
1. Default view is "Resumen" (Overview)
2. Shows real-time stats:
   - Total Flights
   - Total Users
   - Total Bookings
3. Stats update when data changes
```

---

## 🐛 Debugging

### Enable Debug Logs:
```javascript
// In AdminDashboard.jsx
console.log('Fetched flights:', flightsRes.data);
console.log('User role:', userRole);
```

### Check JWT Token:
```javascript
// In browser console
const token = localStorage.getItem('token');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Role:', payload.role);
```

### Test Middleware:
```bash
# Without token (should fail)
curl http://localhost:4000/api/admin/flights

# With invalid role (should fail 403)
# With admin role (should succeed 200)
```

---

## 📋 Common Tasks

### Create Admin:
```bash
cd backend
node scripts/createAdmin.js
```

### Seed Database:
```bash
cd backend
npm run seed
```

### Reset Database:
```bash
cd backend
npx prisma migrate reset
npm run seed
```

### View Database:
```bash
# Using Prisma Studio
npx prisma studio
# Opens http://localhost:5555
```

### Export Data:
```bash
# PostgreSQL export
pg_dump $DATABASE_URL > backup.sql
```

---

## 🌐 Deployment Checklist

### Before Production:
- [ ] Create admin user
- [ ] Seed production database
- [ ] Test admin dashboard
- [ ] Verify JWT includes role
- [ ] Check middleware works
- [ ] Test flight creation
- [ ] Verify pricing logic
- [ ] Check seat generation

### Production URLs:
- Backend: https://aeromanage-api.onrender.com (Render)
- Frontend: https://aeromanage.vercel.app (Vercel)
- Database: Neon.tech PostgreSQL

### Post-Deployment:
- [ ] Monitor error logs
- [ ] Test admin login
- [ ] Verify flights appear
- [ ] Check seat availability
- [ ] Monitor performance

---

## 📞 Support

For issues:
1. Check error logs in browser console
2. Verify DATABASE_URL configuration
3. Ensure all migrations are applied
4. Check JWT token validity
5. Review API response in Network tab

---

## 🎯 Key Files

**Backend**:
- `src/middlewares/admin.middleware.js` - Admin auth
- `src/controllers/admin.controller.js` - Admin logic
- `src/routes/admin.routes.js` - Admin routes
- `scripts/createAdmin.js` - Create admin user
- `prisma/seed.js` - Database seeding

**Frontend**:
- `src/App.jsx` - Role-based routing
- `src/components/AdminDashboard.jsx` - Admin UI

**Config**:
- `prisma/schema.prisma` - Database schema
- `.env` - Environment variables

---

**Version**: AeroManage 1.0.0
**Last Updated**: May 2026
