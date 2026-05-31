/**
 * Controlador de rutas administrativas
 * Gestiona vuelos, usuarios y reservas
 */
import prisma from "../config/prisma.js";
import bcrypt from "bcrypt";

// GET /api/admin/flights - Listar todos los vuelos con disponibilidad de asientos
// GET /api/admin/flights - Listar vuelos con paginación
export const getAllFlights = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;
    const search = req.query.search?.trim() || '';

    const where = search ? {
  OR: [
    { origin: { code: { contains: search.toUpperCase() } } },
    { destination: { code: { contains: search.toUpperCase() } } },
    ...(!isNaN(parseInt(search)) ? [{ id: { equals: parseInt(search) } }] : [])
  ]
} : {};

    const [flights, total] = await Promise.all([
      prisma.flight.findMany({
        skip,
        take: limit,
        where,
        include: {
          airline: true,
          origin: true,
          destination: true,
          _count: { select: { seats: true } }
        },
        orderBy: { departureTime: 'asc' }
      }),
      prisma.flight.count({ where })
    ]);

    const flightsWithAvailability = flights.map(flight => ({
      ...flight,
      totalSeats: flight._count.seats,
      availableSeats: flight._count.seats,
      occupiedSeats: 0
    }));

    res.json({
      flights: flightsWithAvailability,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1
    });
  } catch (error) {
    console.error("Error fetching flights:", error);
    res.status(500).json({ error: "Error al obtener vuelos" });
  }
};

// POST /api/admin/flights - Crear un nuevo vuelo
export const createFlight = async (req, res) => {
  try {
    const {
      airlineId,
      originAirportId,
      destinationAirportId,
      departureTime,
      arrivalTime,
      price,
      totalSeats,
      status
    } = req.body;

    // Validaciones
    if (!airlineId || !originAirportId || !destinationAirportId || !departureTime || !arrivalTime || !price || !totalSeats) {
      return res.status(400).json({ error: "Faltan campos requeridos" });
    }

    // Crear el vuelo
    const flight = await prisma.flight.create({
      data: {
        airlineId: parseInt(airlineId),
        originAirportId: parseInt(originAirportId),
        destinationAirportId: parseInt(destinationAirportId),
        departureTime: new Date(departureTime),
        arrivalTime: new Date(arrivalTime),
        price: parseFloat(price),
        totalSeats: parseInt(totalSeats),
        status: status || 'ON_TIME'
      },
      include: {
        airline: true,
        origin: true,
        destination: true
      }
    });

    // Crear asientos para el vuelo
    const seats = [];
    const economySeats = Math.floor(totalSeats * 0.8); // 80% económicos
    const businessSeats = totalSeats - economySeats; // 20% negocios

    // Generar asientos económicos (1A-1Z, 2A-2Z, etc.)
    let seatNumber = 1;
    for (let i = 0; i < economySeats; i++) {
      const row = Math.floor(i / 6) + 1;
      const col = String.fromCharCode(65 + (i % 6));
      seats.push({
        number: `${row}${col}`,
        isOccupied: false,
        flightId: flight.id
      });
    }

    // Generar asientos de negocios (1A-1E en filas especiales)
    for (let i = 0; i < businessSeats; i++) {
      const row = Math.floor(economySeats / 6) + Math.floor(i / 4) + 1;
      const col = String.fromCharCode(65 + (i % 4));
      seats.push({
        number: `${row}${col}B`,
        isOccupied: false,
        flightId: flight.id
      });
    }

    await prisma.seat.createMany({ data: seats });

    res.status(201).json({
      message: "Vuelo creado exitosamente",
      flight: {
        ...flight,
        totalSeats: parseInt(totalSeats),
        occupiedSeats: 0,
        availableSeats: parseInt(totalSeats)
      }
    });
  } catch (error) {
    console.error("Error creating flight:", error);
    res.status(500).json({ error: "Error al crear el vuelo" });
  }
};

// PUT /api/admin/flights/:id - Actualizar vuelo
export const updateFlight = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, price, totalSeats } = req.body;

    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (totalSeats !== undefined) updateData.totalSeats = parseInt(totalSeats);

    const flight = await prisma.flight.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        airline: true,
        origin: true,
        destination: true,
        seats: true
      }
    });

    res.json({
      message: "Vuelo actualizado exitosamente",
      flight: {
        ...flight,
        occupiedSeats: flight.seats.filter(s => s.isOccupied).length,
        availableSeats: flight.seats.filter(s => !s.isOccupied).length
      }
    });
  } catch (error) {
    console.error("Error updating flight:", error);
    res.status(500).json({ error: "Error al actualizar el vuelo" });
  }
};

// DELETE /api/admin/flights/:id - Soft delete de vuelo
export const deleteFlight = async (req, res) => {
  try {
    const { id } = req.params;

    // Soft delete: cambiar estado a CANCELLED
    const flight = await prisma.flight.update({
      where: { id: parseInt(id) },
      data: { status: 'CANCELLED' }
    });

    res.json({ message: "Vuelo cancelado exitosamente", flight });
  } catch (error) {
    console.error("Error deleting flight:", error);
    res.status(500).json({ error: "Error al cancelar el vuelo" });
  }
};

// PUT /api/admin/flights/:id/status - Cambiar estado del vuelo
export const updateFlightStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['ON_TIME', 'DELAYED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Estado inválido" });
    }

    const flight = await prisma.flight.update({
      where: { id: parseInt(id) },
      data: { status },
      include: {
        airline: true,
        origin: true,
        destination: true
      }
    });

    res.json({ message: "Estado del vuelo actualizado", flight });
  } catch (error) {
    console.error("Error updating flight status:", error);
    res.status(500).json({ error: "Error al actualizar el estado" });
  }
};

// PUT /api/admin/users/:id/status - Actualizar si el usuario está activo
export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const targetUserId = parseInt(id);
    if (targetUserId === req.userId) {
      return res.status(403).json({ error: 'No se puede cambiar el estado de la propia cuenta de administrador' });
    }

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'El campo isActive debe ser booleano' });
    }

    const user = await prisma.user.update({
      where: { id: targetUserId },
      data: { isActive }
    });

    res.json({ message: 'Estado del usuario actualizado', user });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ error: 'Error al actualizar el estado del usuario' });
  }
};

// DELETE /api/admin/users/:id - Eliminar usuario permanentemente
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const targetUserId = parseInt(id);

    if (targetUserId === req.userId) {
      return res.status(403).json({ error: 'No se puede eliminar la propia cuenta de administrador' });
    }

    await prisma.user.delete({
      where: { id: targetUserId }
    });

    res.json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Error al eliminar el usuario' });
  }
};

// POST /api/admin/users - Crear un nuevo usuario desde el panel de admin
export const createUser = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Nombre, email, contraseña y rol son obligatorios' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'El correo ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone: phone || null,
        role,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      }
    });

    res.status(201).json({ message: 'Usuario creado exitosamente', user });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Error al crear el usuario' });
  }
};

// GET /api/admin/users - Listar todos los usuarios con conteo de reservas
export const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        reservations: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const usersWithBookingCount = users.map(user => ({
      ...user,
      bookingCount: user.reservations.length,
      reservations: undefined
    }));

    res.json(usersWithBookingCount);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
};

// PUT /api/admin/bookings/:id/status - Actualizar estado de una reserva
export const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['CONFIRMED', 'PENDING', 'CANCELLED'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    const reservation = await prisma.reservation.update({
      where: { id: parseInt(id) },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
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
        },
        passengers: true,
        tickets: true
      }
    });

    res.json({ message: 'Estado de la reserva actualizado', reservation });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ error: 'Error al actualizar el estado de la reserva' });
  }
};

// GET /api/admin/bookings - Listar todas las reservas
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await prisma.reservation.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
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
        },
        passengers: true,
        tickets: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ error: "Error al obtener reservas" });
  }
};