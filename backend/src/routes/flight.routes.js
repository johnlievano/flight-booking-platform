import { Router } from "express";
import { createFlight, getFlights, searchFlights, getFlightById, getFlightSeats } from "../controllers/flight.controller.js";
// Importamos con el nombre CORRECTO que tienes en tu middleware:
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

// Rutas públicas (cualquiera puede ver o buscar vuelos)
router.get("/", getFlights);
router.get("/search", searchFlights); 
router.get("/:id", getFlightById); 

// Rutas protegidas (solo usuarios logueados pueden crear vuelos)
router.post("/", authenticate, createFlight);
//Ruta de asientos
router.get('/:id/seats', getFlightSeats);

export default router;