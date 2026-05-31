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
  updateUserStatus,
  deleteUser,
  createUser,
  getAllBookings,
  updateBookingStatus
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
router.post('/users', requireAdmin, createUser);
router.put('/users/:id/status', updateUserStatus);
router.delete('/users/:id', deleteUser);

// Rutas de reservas
router.get('/bookings', getAllBookings);
router.put('/bookings/:id/status', updateBookingStatus);
router.patch('/bookings/:id/status', updateBookingStatus);

export default router;
