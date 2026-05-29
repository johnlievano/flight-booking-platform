/**
 * Controlador de rutas administrativas
 * Gestiona vuelos, usuarios y reservas
 */
import prisma from "../config/prisma.js";

// GET /api/admin/flights - Listar todos los vuelos con disponibilidad de asientos
export const getAllFlights = async (req, res) => {
  try {
    const flights = await prisma.flight.findMany({
      include: {
        airline: true,
        origin: true,
        destination: true,
        seats: true
      },
      orderBy: { departureTime: 'asc' }
    });

    // Calcular asientos ocupados para cada vuelo
    const flightsWithAvailability = flights.map(flight => ({
      ...flight,
      occupiedSeats: flight.seats.filter(s => s.isOccupied).length,
      availableSeats: flight.seats.filter(s => !s.isOccupied).length
    }));

    res.json(flightsWithAvailability);
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
    console.error("Error code:", error.code);
    console.error("Error meta:", error.meta);

    // Manejar error de foreign key
    if (error.code === 'P2003') {
      const fieldName = error.meta?.field_name || '';
      console.error("Field name:", fieldName);
      let entityName = 'registro';

      if (fieldName.includes('airlineId') || fieldName.includes('Flight_airlineId')) {
        entityName = 'aerolínea';
      } else if (fieldName.includes('originAirportId') || fieldName.includes('Flight_originAirportId')) {
        entityName = 'aeropuerto de origen';
      } else if (fieldName.includes('destinationAirportId') || fieldName.includes('Flight_destinationAirportId')) {
        entityName = 'aeropuerto de destino';
      }

      console.error("Entity name:", entityName);
      return res.status(400).json({
        error: `La ${entityName} con el ID proporcionado no existe en la base de datos`
      });
    }

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

// POST /api/admin/users - Crear un nuevo usuario
export const createUser = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    // Validaciones
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Nombre, email y contraseña son requeridos" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
    }

    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: "El email ya está registrado" });
    }

    // Hashear la contraseña
    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear el usuario
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone: phone || null,
        role: role || 'PASSENGER',
        isActive: true,
        avatarIndex: 0
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    res.status(201).json({
      message: "Usuario creado exitosamente",
      user: {
        ...user,
        bookingCount: 0
      }
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Error al crear el usuario" });
  }
};

// DELETE /api/admin/users/:id - Eliminar usuario
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Evitar que el admin se elimine a sí mismo
    if (parseInt(id) === req.userId) {
      return res.status(403).json({ error: "No puedes eliminar tu propia cuenta" });
    }

    // Verificar que el usuario no tenga reservas activas
    const userWithReservations = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: {
        reservations: {
          where: {
            status: { in: ['PENDING', 'CONFIRMED'] }
          }
        }
      }
    });

    if (!userWithReservations) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    if (userWithReservations.reservations.length > 0) {
      return res.status(400).json({
        error: "No se puede eliminar el usuario porque tiene reservas activas"
      });
    }

    // Eliminar usuario (hard delete)
    await prisma.user.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: "Usuario eliminado exitosamente" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Error al eliminar el usuario" });
  }
};

// PUT /api/admin/users/:id/role - Cambiar rol del usuario
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Validar rol
    const validRoles = ['PASSENGER', 'ADMIN'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: "Rol inválido. Use PASSENGER o ADMIN" });
    }

    // Evitar que el admin cambie su propio rol
    if (parseInt(id) === req.userId) {
      return res.status(403).json({ error: "No puedes cambiar tu propio rol" });
    }

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    res.json({
      message: "Rol actualizado exitosamente",
      user
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ error: "Error al actualizar el rol" });
  }
};

// PUT /api/admin/users/:id/status - Activar/desactivar usuario
export const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: "El campo isActive debe ser booleano" });
    }

    // Evitar que el admin se desactive a sí mismo
    if (parseInt(id) === req.userId && !isActive) {
      return res.status(403).json({ error: "No puedes desactivar tu propia cuenta" });
    }

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { isActive },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    res.json({
      message: isActive ? "Usuario activado" : "Usuario desactivado",
      user
    });
  } catch (error) {
    console.error("Error toggling user status:", error);
    res.status(500).json({ error: "Error al cambiar el estado del usuario" });
  }
};
