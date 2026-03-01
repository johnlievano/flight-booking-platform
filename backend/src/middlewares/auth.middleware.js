/**
 * Middleware de autenticación
 * Verifica que el usuario envíe un JWT válido y obtiene sus datos
 */
import jwt from "jsonwebtoken";
// IMPORTANTE: Asegúrate de que la ruta a tu archivo de Prisma sea la correcta
import prisma from "../config/prisma.js"; 

export const authenticate = async (req, res, next) => { 
  try {
    // 1. Obtener el header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: "No token provided" });
    }

    // 2. Extraer token (Formato esperado: Bearer TOKEN)
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Invalid token format" });
    }

    // 3. Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Buscar al usuario en la base de datos
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true } // Solo pedimos nombre y correo, sin la contraseña
    });

    if (!user) {
      return res.status(401).json({ error: "Usuario no encontrado en la base de datos" });
    }

    // 5. Guardar los datos en la request
    req.userId = user.id; // Mantenemos este por si otras partes de tu código ya lo usan
    req.user = user;      // Guardamos el objeto completo (nombre y correo) para el envío del ticket

    // 6. Permitir continuar
    next();

  } catch (error) {
    console.error("Error en middleware:", error);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};