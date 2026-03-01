import prisma from "../config/prisma.js";

// Crear un nuevo aeropuerto
export const createAirport = async (req, res) => {
  try {
    // Extraemos los datos que envía el usuario
    const { city, code } = req.body;

    // Validamos que no falte ningún dato obligatorio
    if (!city || !code) {
      return res.status(400).json({ error: "City and code required" });
    }

    // Guardamos el registro en la base de datos
    const airport = await prisma.airport.create({
      data: { city, code }
    });

    // Respondemos con éxito y los datos creados (201 Created)
    res.status(201).json(airport);

  } catch (error) {
    console.error("Error creating airport:", error);
    res.status(500).json({ error: "Error creating airport" });
  }
};

// Listar todos los aeropuertos
export const getAirports = async (req, res) => {
  try {
    // Traemos todos los registros de la tabla
    const airports = await prisma.airport.findMany();
    
    // Devolvemos la lista en formato JSON
    res.json(airports);

  } catch (error) {
    console.error("Error fetching airports:", error);
    res.status(500).json({ error: "Error fetching airports" });
  }
};