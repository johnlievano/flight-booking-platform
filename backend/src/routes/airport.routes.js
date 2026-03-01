import express from "express";
import { createAirport, getAirports } from "../controllers/airport.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Crear un aeropuerto (requiere token de autenticación)
router.post("/", authenticate, createAirport);

// Listar todos los aeropuertos (requiere token de autenticación)
router.get("/", authenticate, getAirports);

export default router;