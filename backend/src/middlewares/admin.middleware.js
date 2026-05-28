/**
 * Middleware de autenticación de administrador
 * Verifica que el usuario autenticado tenga rol ADMIN
 */
import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";

export const requireAdmin = async (req, res, next) => {
  try {
    // Obtener el header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: "No token provided" });
    }

    // Extraer token (Formato esperado: Bearer TOKEN)
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Invalid token format" });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Buscar al usuario en la base de datos
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true, email: true }
    });

    if (!user) {
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    // Verificar que sea admin
    if (user.role !== "ADMIN") {
      return res.status(403).json({ error: "Acceso denegado: se requiere rol de administrador" });
    }

    // Guardar datos del usuario en la request
    req.userId = user.id;
    req.user = user;

    // Permitir continuar
    next();

  } catch (error) {
    console.error("Error en middleware de admin:", error);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
