# SEED EXECUTION GUIDE - AeroManage

## Overview
This document provides instructions for running the AeroManage database seed both locally and in production (Render + Neon.tech).

## What the Seed Does
- Creates airline: AeroManage (code: AMG)
- Creates 8 international airports and routes:
  - Bogotá (BOG) ↔ Miami (MIA)
  - Bogotá (BOG) ↔ Madrid (MAD)
  - Bogotá (BOG) ↔ Mexico City (MEX)
  - Bogotá (BOG) ↔ New York (NYC)
  - Bogotá (BOG) ↔ Lima (LIM)
  - Plus return routes for bidirectional coverage
- Generates flights for entire year 2025-2026:
  - 3 flights per route per day (06:00, 12:00, 18:00 departures)
  - 730+ days of coverage
  - Realistic pricing with weekend and time-based multipliers
  - All flights set to 'ON_TIME' status by default
- Creates 150 seats per flight:
  - 120 economy seats (rows 1-20, columns A-F)
  - 30 business seats (rows 1-8, columns A-D with 'B' suffix)

## Total Statistics Generated
- **Flights**: ~17,520 flights (8 routes × 3 flights/day × 730 days)
- **Seats**: ~2,628,000 seats
- **Airports**: 8 international airports

## Local Execution

### Prerequisites
```bash
# Make sure you have:
- Node.js v18+
- PostgreSQL running locally or accessible
- .env file configured with DATABASE_URL
```

### Step 1: Configure .env
```env
DATABASE_URL="postgresql://user:password@localhost:5432/aeromanage_db"
JWT_SECRET="your_secret_key"
PORT=4000
EMAIL_USER="your_email@gmail.com"
EMAIL_PASS="your_app_password"
FRONTEND_URL="http://localhost:5173"
```

### Step 2: Run Seed Locally
```bash
# Option A: Using npm script (if configured in package.json)
npm run seed

# Option B: Using npx directly
npx prisma db seed

# Option C: Using node directly
node prisma/seed.js
```

### Estimated Runtime
- **First run**: 2-5 minutes (depending on database performance)
- **Subsequent runs**: Same (clears and recreates data)

---

## Production Execution (Render + Neon.tech)

### Prerequisites
- Backend deployed on Render
- Database hosted on Neon.tech
- Git repository synced

### Option 1: Using Render Deploy Hook (Recommended)

#### Step 1: Create Deploy Hook in Render
1. Go to your backend service in Render dashboard
2. Settings → Deploy Hooks
3. Create a new hook named "Seed Database"
4. Copy the webhook URL

#### Step 2: Execute Seed After Deployment
```bash
# After your backend is deployed, trigger the hook via:
curl -X POST https://api.render.com/deploy/srv-xxxxx?key=your-deploy-key
```

#### Step 3: Run Seed Command
```bash
# SSH into Render or use their one-off job:
render run npm run seed
```

### Option 2: Manual Production Seed (Direct)

#### Step 1: Get Neon Connection String
1. Go to Neon.tech Dashboard
2. Select your project → Connection strings
3. Copy the PostgreSQL connection string

#### Step 2: Run Seed Remotely
```bash
# Run from your local machine against production database
DATABASE_URL="postgresql://user:password@xxx.neon.tech:5432/aeromanage_db?sslmode=require" node backend/prisma/seed.js
```

#### Full Command Example
```bash
DATABASE_URL="postgresql://neon_user:neon_password@ep-xyz123.us-east-1.neon.tech:5432/aeromanage_db?sslmode=require" node backend/prisma/seed.js
```

### Option 3: Using Render One-Off Job

#### Step 1: SSH to Render (if enabled)
```bash
# From your browser in Render dashboard:
# Click "Shell" under your service to get terminal access
```

#### Step 2: Run Seed
```bash
cd backend
npm install  # Ensure dependencies are installed
node prisma/seed.js
```

---

## Safety Features

✅ **Idempotent Design**: The seed is safe to run multiple times
- It completely clears old data before seeding
- Uses `prisma.$transaction` for atomic operations
- Batch inserts (100 flights, 500 seats per batch) prevent memory overflow

✅ **Error Handling**: Comprehensive error catching and reporting
- Shows progress during execution
- Clear error messages if something fails
- Graceful disconnect from database

⚠️ **Warning**: This seed will DELETE ALL existing data
- Reservations, users, and tickets will be cleared
- Only run during development or with backup

---

## Troubleshooting

### Error: "Connection refused"
**Solution**: Check DATABASE_URL is correct and database is running
```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

### Error: "Relation does not exist"
**Solution**: Run migrations first
```bash
npx prisma migrate deploy
npx prisma db push
```

### Error: "Timeout during seed"
**Solution**: Increase timeout or run in smaller batches
- The seed now uses batch processing to prevent this
- For very large datasets, consider splitting into multiple seed files

### Seed takes too long
**Solution**: This is normal for 2M+ records
- First run: 2-5 minutes is expected
- Monitor progress in console output
- Neon.tech serverless DB may be slower than local PostgreSQL

---

## Verification

After running the seed, verify the data:

```bash
# Check flights count
psql $DATABASE_URL -c "SELECT COUNT(*) FROM flights;"

# Check airports
psql $DATABASE_URL -c "SELECT COUNT(*) FROM airports;"

# Check seats
psql $DATABASE_URL -c "SELECT COUNT(*) FROM seats;"

# Check specific route
psql $DATABASE_URL -c "
  SELECT f.id, 
         a1.code as origin,
         a2.code as destination,
         f.departure_time,
         f.status
  FROM flights f
  JOIN airports a1 ON f.origin_airport_id = a1.id
  JOIN airports a2 ON f.destination_airport_id = a2.id
  LIMIT 5;
"
```

---

## Creating Admin User

After seeding, create your first admin user:

```bash
# Run admin creation script
node backend/scripts/createAdmin.js

# Interactive prompts will appear:
# - Full name: John Admin
# - Email: admin@aeromanage.com
# - Password: SecurePassword123
# - Phone: (optional)
```

---

## Performance Optimization

The seed uses these optimizations:

1. **Batch Inserts**: 
   - Flights: 100 per batch
   - Seats: 500 per batch
   - Prevents memory overflow with large datasets

2. **Progress Tracking**: Console shows real-time progress

3. **Parallel Airport Creation**: Validates airports before creating

4. **Efficient Date Generation**: Single loop for year-long date range

---

## Next Steps After Seeding

1. ✅ Run seed
2. ✅ Create admin account
3. ✅ Test backend endpoints
4. ✅ Deploy frontend
5. ✅ Login as admin to verify admin dashboard
6. ✅ Test passenger booking flow

---

## Questions?

For issues or questions:
- Check database connection logs
- Verify .env file configuration
- Ensure Prisma migrations are up to date
- Review seed.js error messages
