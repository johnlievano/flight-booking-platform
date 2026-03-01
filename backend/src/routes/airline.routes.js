import express from "express";
import { createAirline, getAirlines } from "../controllers/airline.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Solo usuarios autenticados pueden crear
router.post("/", authenticate, createAirline);

// Cualquiera autenticado puede ver
router.get("/", authenticate, getAirlines);

export default router;