import prisma from "../config/prisma.js";

// Crear un nuevo vuelo
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

    if (!airlineId || !originAirportId || !destinationAirportId || !departureTime || !arrivalTime || !price || !totalSeats || !status) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const flight = await prisma.flight.create({
      data: {
        airlineId,
        originAirportId,
        destinationAirportId,
        departureTime: new Date(departureTime),
        arrivalTime: new Date(arrivalTime),
        price,
        totalSeats,
        status
      }
    });

    res.status(201).json(flight);
  } catch (error) {
    console.error("Error creating flight:", error);
    res.status(500).json({ error: "Error creating flight" });
  }
};

// Listar todos los vuelos
export const getFlights = async (req, res) => {
  try {
    const flights = await prisma.flight.findMany({
      include: {
        airline: true,
        origin: true,
        destination: true
      }
    });

    res.json(flights);
  } catch (error) {
    console.error("Error fetching flights:", error);
    res.status(500).json({ error: "Error fetching flights" });
  }
};

// Buscar vuelos filtrados de forma avanzada (Requerimientos R1, R5)
export const searchFlights = async (req, res) => {
  try {
    const { origin, destination, date, time, passengers } = req.query;

    const whereClause = { status: "SCHEDULED" };

    if (origin) whereClause.originAirportId = Number(origin);
    if (destination) whereClause.destinationAirportId = Number(destination);

    // FILTRO DE FECHA CORREGIDO: Conversión Colombia → UTC
    if (date) {
      // Colombia (UTC-5): 00:00 Colombia = 05:00 UTC del mismo día
      const utcStart = new Date(date);
      utcStart.setUTCHours(5, 0, 0, 0);
      
      // 23:59 Colombia = 04:59 UTC del día siguiente
      // Creamos un nuevo día sumando 24 horas + 4 horas = 28 horas
      const utcEnd = new Date(date);
      utcEnd.setUTCHours(28, 59, 59, 999); // 28 = 4 + 24 (día siguiente)
      
      whereClause.departureTime = { 
        gte: utcStart, 
        lte: utcEnd 
      };
    }

    // Ejecutamos la consulta a Prisma
    let flights = await prisma.flight.findMany({
      where: whereClause,
      include: {
        airline: true,
        origin: true,
        destination: true,
        seats: {
          where: { isOccupied: false }
        }
      },
      orderBy: { price: 'asc' }
    });

    // Filtramos por asientos de manera segura
    const requiredSeats = passengers ? Number(passengers) : 1;
    flights = flights.filter(flight => {
      const availableCount = Array.isArray(flight.seats) ? flight.seats.length : 0;
      return availableCount >= requiredSeats;
    });

    // FILTRO DE HORA CORREGIDO: Conversión Colombia → UTC
    if (time) {
      // Extraemos hora y minutos (formato "HH:MM" del frontend)
      const [hours, minutes] = time.split(':').map(Number);
      
      // La hora seleccionada está en Colombia (UTC-5)
      const colombiaMinutes = (hours * 60) + minutes;
      
      // Convertimos a UTC: Colombia → UTC = +5 horas (300 minutos)
      // Importante: aplicamos módulo 24*60 por si la suma pasa de 24 horas
      const utcMinutes = (colombiaMinutes + 300) % (24 * 60);

      flights = flights.filter(flight => {
        const flightDate = new Date(flight.departureTime);
        
        // Obtenemos la hora UTC del vuelo (así está almacenada en la BD)
        const flightUtcHours = flightDate.getUTCHours();
        const flightUtcMinutes = flightDate.getUTCMinutes();
        const flightUtcTotalMinutes = (flightUtcHours * 60) + flightUtcMinutes;

        // Para entender la conversión, podemos calcular la hora Colombia del vuelo
        // (solo para debug, no afecta la lógica)
        const colombiaHours = (flightUtcHours - 5 + 24) % 24;
        
        // Comparamos en UTC: la hora UTC del vuelo debe ser >= la hora UTC seleccionada
        // Un vuelo que sale a las 03:00 Colombia (08:00 UTC) sí cumple si buscas desde 00:00 UTC (19:00 Colombia día anterior)
        return flightUtcTotalMinutes >= utcMinutes;
      });
    }

    // Formateo de respuesta seguro
    const formattedFlights = flights.map(f => {
      const availableCount = Array.isArray(f.seats) ? f.seats.length : 0;
      const { seats, ...flightData } = f;
      
      // Agregamos la hora local Colombia para depuración (opcional)
      const departureLocal = new Date(flightData.departureTime);
      const colombiaHours = (departureLocal.getUTCHours() - 5 + 24) % 24;
      const colombiaTimeStr = `${colombiaHours.toString().padStart(2, '0')}:${departureLocal.getUTCMinutes().toString().padStart(2, '0')}`;
      
      return {
        ...flightData,
        availableSeats: availableCount,
        // Opcional: podemos incluir la hora local para que el frontend la muestre sin calcular
        departureTimeColombia: colombiaTimeStr
      };
    });

    res.json(formattedFlights);
  } catch (error) {
    console.error(" Error critico en searchFlights:", error);
    res.status(500).json({ error: "Error interno del servidor", details: error.message });
  }
};

// Obtener un solo vuelo por su ID
export const getFlightById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    const flight = await prisma.flight.findUnique({
      where: { id },
      include: {
        airline: true,
        origin: true,
        destination: true
      }
    });

    if (!flight) {
      return res.status(404).json({ error: "Flight not found" });
    }

    res.json(flight);
  } catch (error) {
    console.error("Error fetching flight:", error);
    res.status(500).json({ error: "Error fetching flight" });
  }
};

// ------------------------------------------------
// Obtener los asientos de un vuelo
// ------------------------------------------------
export const getFlightSeats = async (req, res) => {
  try {
    const flightId = parseInt(req.params.id);
    const seats = await prisma.seat.findMany({
      where: { flightId },
      orderBy: { id: 'asc' }
    });
    res.json(seats);
  } catch (error) {
    console.error("Error fetching seats:", error);
    res.status(500).json({ error: "Error fetching seats" });
  }
};