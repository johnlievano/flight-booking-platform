import prisma from "../config/prisma.js";

// Crear una nueva aerolínea
export const createAirline = async (req, res) => {
  try {
    // Extraemos los datos que envía el usuario
    const { name, code } = req.body;

    // Validamos que no falte ningún dato obligatorio
    if (!name || !code) {
      return res.status(400).json({ error: "Name and code required" });
    }

    // Guardamos el registro en la base de datos
    const airline = await prisma.airline.create({
      data: { name, code }
    });

    // Respondemos con éxito y los datos creados (201 Created)
    res.status(201).json(airline);

  } catch (error) {
    console.error("Error creating airline:", error);
    res.status(500).json({ error: "Error creating airline" });
  }
};

// Listar todas las aerolíneas
export const getAirlines = async (req, res) => {
  try {
    // Traemos todos los registros de la tabla
    const airlines = await prisma.airline.findMany();
    
    // Devolvemos la lista en formato JSON
    res.json(airlines);

  } catch (error) {
    console.error("Error fetching airlines:", error);
    res.status(500).json({ error: "Error fetching airlines" });
  }
};