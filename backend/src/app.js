import userRoutes from "./routes/user.routes.js";
import express from "express";
import dotenv from "dotenv";
import prisma from "./config/prisma.js";
import airlineRoutes from "./routes/airline.routes.js";
import airportRoutes from "./routes/airport.routes.js";
import flightRoutes from "./routes/flight.routes.js";
import reservationRoutes from "./routes/reservation.routes.js";
import adminRoutes from "./routes/admin.routes.js";

dotenv.config();

const app = express();

// CORS manual — cubre todas las respuestas incluyendo errores de middlewares
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  }
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/airlines", airlineRoutes);
app.use("/api/airports", airportRoutes);
app.use("/api/flights", flightRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Flight Booking API running" });
});

app.get("/test-db", async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error connecting to DB" });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});