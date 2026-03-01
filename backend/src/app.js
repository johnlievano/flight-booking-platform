/**
     Servidor principal de la API
    - Configura Express
    - Conecta middlewares
    - Define rutas básicas
 */

import userRoutes from "./routes/user.routes.js";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import prisma from "./config/prisma.js";
import airlineRoutes from "./routes/airline.routes.js";
import airportRoutes from "./routes/airport.routes.js";
import flightRoutes from "./routes/flight.routes.js";
import reservationRoutes from "./routes/reservation.routes.js";


// Carga variables del archivo .env
dotenv.config();

// Crea instancia de Express
const app = express();

// Permite solicitudes desde el frontend
app.use(cors());

// Permite recibir JSON en las peticiones
app.use(express.json());

// Rutas de usuario
app.use("/api/users", userRoutes);

// Rutas de aerolíneas
app.use("/api/airlines", airlineRoutes);

//Rutas de Aereopuertos
app.use("/api/airports", airportRoutes);

//Rutas de vuelos
app.use("/api/flights", flightRoutes);

//Rutas de reservación
app.use("/api/reservations", reservationRoutes);

/** 
  Ruta básica para probar que el servidor funciona
 */
app.get("/", (req, res) => {
  res.json({ message: "Flight Booking API running" });
});


/**
 * Ruta para probar conexión con la base de datos
 * Consulta todos los usuarios
 */
app.get("/test-db", async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error connecting to DB" });
  }
});

// Puerto definido en .env o 4000 por defecto
const PORT = process.env.PORT || 4000;

// Levanta servidor
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});