import express from "express";
import { 
  createReservation,
  getMyReservations,
  cancelReservation 
} from "../controllers/reservation.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Crear una reserva nueva
router.post("/", authenticate, createReservation);

// Ver mis reservas
router.get("/", authenticate, getMyReservations);

// Cancelar una reserva específica por su ID
// Usamos PATCH porque solo vamos a modificar el estado de la reserva
router.patch("/:id/cancel", authenticate, cancelReservation);

export default router;