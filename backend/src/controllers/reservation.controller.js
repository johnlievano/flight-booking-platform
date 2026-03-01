import prisma from "../config/prisma.js";
import { v4 as uuidv4 } from "uuid";
import { sendTicketEmail } from '../utils/mailer.js'; // Asegurate de que la ruta sea correcta

/*
  1. Crear Reserva con Seleccion de Asientos
  - Verifica que los asientos solicitados esten realmente libres.
  - Bloquea los asientos marcandolos como ocupados.
  - Genera la reserva, pasajeros y tickets en una transaccion segura.
*/
export const createReservation = async (req, res) => {
    try {
        const { flightIds, passengers } = req.body;

        if (!flightIds || flightIds.length === 0 || !passengers || passengers.length === 0) {
            return res.status(400).json({ error: "Vuelos y pasajeros son obligatorios" });
        }

        // Validacion para evitar documentos duplicados en la misma reserva
        const documents = passengers.map(p => p.document);
        const uniqueDocuments = new Set(documents);
        if (uniqueDocuments.size !== documents.length) {
            return res.status(400).json({ error: "Se detectaron documentos duplicados en la reserva" });
        }

        // Validacion para evitar que envien pasajeros sin asiento asignado
        const unassignedSeats = passengers.some(p => !p.seatId);
        if (unassignedSeats) {
            return res.status(400).json({ error: "Todos los pasajeros deben tener un asiento asignado" });
        }

        const result = await prisma.$transaction(async (tx) => {

            const flights = await tx.flight.findMany({
                where: { id: { in: flightIds } },
                include: {
                    airline: true,
                    origin: true,
                    destination: true
                }
            });

            if (flights.length !== flightIds.length) {
                throw new Error("Uno o mas vuelos no fueron encontrados");
            }

            for (const flight of flights) {
                if (flight.status !== "SCHEDULED") {
                    throw new Error(`El vuelo ${flight.id} no esta disponible`);
                }
            }

            // Calculo del precio total
            const totalPrice = flights.reduce((sum, f) => sum + (f.price * passengers.length), 0);

            // 1. Creacion de la reserva principal
            const reservation = await tx.reservation.create({
                data: {
                    userId: req.userId,
                    status: "CONFIRMED",
                    totalPrice
                }
            });

            const createdPassengers = [];

            // 2. Procesamiento de pasajeros y asientos
            for (const p of passengers) {
                
                // Verificamos el estado del asiento en tiempo real dentro de la transaccion
                const seat = await tx.seat.findUnique({ where: { id: p.seatId } });
                
                if (!seat || seat.isOccupied) {
                    throw new Error(`El asiento seleccionado para el documento ${p.document} ya no esta disponible.`);
                }

                // Bloqueamos el asiento (lo marcamos como ocupado)
                await tx.seat.update({
                    where: { id: p.seatId },
                    data: { isOccupied: true }
                });

                // Creamos el pasajero
                const passenger = await tx.passenger.create({
                    data: {
                        reservationId: reservation.id,
                        fullName: p.fullName,
                        document: p.document
                    }
                });

                createdPassengers.push(passenger);

                // Generamos los tickets de abordaje
                for (const flight of flights) {
                    await tx.ticket.create({
                        data: {
                            reservationId: reservation.id,
                            passengerId: passenger.id,
                            flightId: flight.id,
                            // Incluimos el numero de asiento en el ticket impreso
                            ticketNumber: `TKT-${seat.number}-${uuidv4().split('-')[0].toUpperCase()}`
                        }
                    });
                }
            }

            // 3. Asociacion de la reserva con los vuelos
            for (const flight of flights) {
                await tx.reservationFlight.create({
                    data: {
                        reservationId: reservation.id,
                        flightId: flight.id
                    }
                });
            }

            return { reservation, createdPassengers, flights };
        });

        // Envio de correo asincrono para no afectar el rendimiento
        if (req.user && req.user.email) {
            sendTicketEmail(
                req.user.email,
                req.user.name,
                result.flights[0],
                passengers,
                result.reservation.totalPrice
            ).catch(emailError => {
                console.error("Fallo interno al procesar el envio de correo:", emailError);
            });
        }

        res.status(201).json({
            message: "Reserva procesada exitosamente",
            reservation: result.reservation,
            passengers: result.createdPassengers
        });

    } catch (error) {
        console.error("Error en createReservation:", error);
        res.status(400).json({ error: error.message });
    }
};

/*
  2. Obtener Mis Reservas (Actualizado)
*/
export const getMyReservations = async (req, res) => {
    try {
        const reservations = await prisma.reservation.findMany({
            where: { userId: req.userId },
            include: {
                passengers: true,
                tickets: true,
                flights: {
                    include: {
                        flight: {
                            include: {
                                airline: true,
                                origin: true,
                                destination: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(reservations);
    } catch (error) {
        console.error("Error fetching reservations:", error);
        res.status(500).json({ error: "Error fetching reservations" });
    }
};

/*
  3. Cancelar Reserva (Actualizado para liberar asientos)
*/
export const cancelReservation = async (req, res) => {
    // La logica de cancelacion se expandira para liberar la tabla Seat mas adelante
    res.status(501).json({ message: "Funcion de cancelacion en mantenimiento" });
};