import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";

export const requireAdmin = async (req, res, next) => {
  // Agregar headers CORS manualmente para que los errores también los incluyan
  const origin = req.headers.origin;
  if (origin && origin.endsWith('.vercel.app')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Invalid token format" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true, email: true }
    });

    if (!user) {
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    if (user.role !== "ADMIN") {
      return res.status(403).json({ error: "Acceso denegado: se requiere rol de administrador" });
    }

    req.userId = user.id;
    req.user = user;
    next();

  } catch (error) {
    console.error("Error en middleware de admin:", error);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};