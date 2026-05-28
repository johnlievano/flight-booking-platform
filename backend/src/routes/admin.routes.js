/**
 * Rutas para administración del sistema
 * Requieren autenticación de admin
 */
import express from 'express';
import { requireAdmin } from '../middlewares/admin.middleware.js';
import {
  getAllFlights,
  createFlight,
  updateFlight,
  deleteFlight,
  updateFlightStatus,
  getAllUsers,
  getAllBookings
} from '../controllers/admin.controller.js';

const router = express.Router();

// Middleware para proteger todas las rutas
router.use(requireAdmin);

// Rutas de vuelos
router.get('/flights', getAllFlights);
router.post('/flights', createFlight);
router.put('/flights/:id', updateFlight);
router.delete('/flights/:id', deleteFlight);
router.put('/flights/:id/status', updateFlightStatus);

// Rutas de usuarios
router.get('/users', getAllUsers);

// Rutas de reservas
router.get('/bookings', getAllBookings);

export default router;
