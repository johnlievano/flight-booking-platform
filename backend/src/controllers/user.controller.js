import prisma from "../config/prisma.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { transporter } from "../utils/mailer.js";

// ----------------------------------------------------------------------
// AUTENTICACIÓN (Registro y Login)
// ----------------------------------------------------------------------

// Registro de nuevos usuarios
export const registerUser = async (req, res) => {
  try {
    // Extraemos los datos que vienen del formulario de registro
    const { name, email, password } = req.body;

    // Validar si el correo ya está en uso
    // Buscamos en la base de datos algún usuario con ese email
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      // Si ya existe, devolvemos un error 400 (Bad Request)
      return res.status(400).json({ error: "El correo ya está registrado" });
    }

    // Encriptar la contraseña antes de guardarla
    // El 10 es el "salt rounds" - mientras más alto, más seguro pero más lento
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear el usuario en la base de datos
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword, // Guardamos la contraseña encriptada, no la original
      }
    });

    // Respondemos con éxito y código 201 (Created)
    res.status(201).json({ message: "Usuario registrado exitosamente" });
  } catch (error) {
    // Si algo falla, lo mostramos en consola y devolvemos error 500
    console.error("Error en el registro:", error);
    res.status(500).json({ error: "Error al registrar el usuario" });
  }
};

// Inicio de sesión de usuarios
export const loginUser = async (req, res) => {
  try {
    // Extraemos credenciales del body
    const { email, password } = req.body;

    // Buscamos al usuario por su email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // No especificamos "usuario no encontrado" por seguridad
      // Así no damos pistas de si el email existe o no
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    // Verificamos si la cuenta está activa (por si implementamos desactivación)
    if (user.isActive === false) {
      return res.status(403).json({ error: "Esta cuenta está desactivada. Contacta a soporte." });
    }

    // Comparamos la contraseña que recibimos con el hash guardado
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      // Mismo mensaje genérico por seguridad
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    // Generamos un token JWT que el frontend usará para autenticarse
    // El token incluye el ID del usuario y expira en 1 día
    const token = jwt.sign(
      { userId: user.id }, // Payload: datos que guardamos en el token
      process.env.JWT_SECRET, // Clave secreta para firmar (desde .env)
      { expiresIn: '1d' } // El token expira en 24 horas
    );

    // Devolvemos el token al frontend
    res.json({ message: "Login exitoso", token });
  } catch (error) {
    console.error("Error en el login:", error);
    res.status(500).json({ error: "Error al iniciar sesión" });
  }
};

// ----------------------------------------------------------------------
// GESTIÓN DE PERFIL (Leer, Modificar, Eliminar)
// ----------------------------------------------------------------------

/*
  1. Obtener los datos del perfil del usuario autenticado
  - req.userId viene del middleware de autenticación (auth.middleware.js)
  - Seleccionamos solo los campos que queremos devolver (excluimos password)
*/
export const getProfile = async (req, res) => {
  try {
    // Buscamos al usuario por el ID que viene del token
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      // Seleccionamos explícitamente los campos que queremos devolver
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        savedCard: true,
        avatarIndex: true, // Para el avatar personalizado
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Devolvemos los datos del perfil
    res.json(user);
  } catch (error) {
    console.error("Error obteniendo perfil:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

/*
  2. Actualizar los datos del perfil
  - El usuario puede modificar nombre, teléfono, tarjeta guardada y avatar
  - Solo actualizamos los campos que vienen en la petición
*/
export const updateProfile = async (req, res) => {
  try {
    const { name, phone, savedCard, avatarIndex } = req.body;

    // Actualizamos el usuario con los nuevos datos
    // Usamos el operador ternario para actualizar solo lo que llegó
    const updatedUser = await prisma.user.update({
      where: { id: req.userId },
      data: {
        // Si el campo existe en el body, lo actualizamos; si no, dejamos el valor anterior
        name: name !== undefined ? name : undefined,
        phone: phone !== undefined ? phone : undefined,
        savedCard: savedCard !== undefined ? savedCard : undefined,
        // avatarIndex puede venir como string, lo convertimos a número
        avatarIndex: avatarIndex !== undefined ? parseInt(avatarIndex) : undefined
      },
      // Devolvemos los campos actualizados
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarIndex: true,
        savedCard: true
      }
    });

    res.json({ message: "Perfil actualizado exitosamente", user: updatedUser });
  } catch (error) {
    console.error("Error actualizando perfil:", error);
    res.status(500).json({ error: "Error al actualizar los datos" });
  }
};

/*
  3. Eliminar la cuenta permanentemente
  - Esto borra al usuario y por cascada también sus reservas, tickets, etc.
  - Es una operación irreversible
*/
export const deleteAccount = async (req, res) => {
  try {
    // Eliminamos al usuario por su ID
    await prisma.user.delete({
      where: { id: req.userId }
    });

    res.json({ message: "Cuenta eliminada exitosamente" });
  } catch (error) {
    console.error("Error eliminando cuenta:", error);
    res.status(500).json({ error: "Error al intentar eliminar la cuenta" });
  }
};

// Desactivar cuenta (en lugar de borrarla)
// Útil si se quiere implementar "suspender cuenta" temporalmente
export const deactivateUser = async (req, res) => {
  try {
    // Cambiamos el estado a inactivo en lugar de borrar
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { isActive: false }
    });
    res.status(200).json({ message: "Usuario desactivado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al desactivar usuario" });
  }
};

// ----------------------------------------------------------------------
// RECUPERACIÓN DE CONTRASEÑA
// ----------------------------------------------------------------------

// Solicitud de recuperación (envía el correo con el enlace)
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "El correo es requerido" });
    }

    // 1. Verificamos que el usuario exista
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({ error: "No existe ninguna cuenta con ese correo." });
    }

    // Verificamos que la cuenta esté activa
    if (!user.isActive) {
      return res.status(403).json({ error: "Esta cuenta está desactivada." });
    }

    // 2. Generamos un token especial para resetear contraseña
    // Este token es diferente al de login y expira en 15 minutos
    const resetToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '15m' } // Expiración corta por seguridad
    );

    // 3. Construimos el enlace que irá en el correo
    // Apunta al frontend, que mostrará el formulario para nueva contraseña
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    // 4. Preparamos el correo electrónico (con el mismo estilo de los tickets)
    const mailOptions = {
      from: `"Intouch Airlines Soporte" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Recuperación de Contraseña - Intouch Airlines",
      // HTML con estilos en línea para compatibilidad con clientes de correo
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <div style="background-color: #2A3F45; padding: 20px; text-align: center;">
                <h1 style="color: #E5B869; margin: 0; font-size: 24px; letter-spacing: 1px;">Intouch Airlines</h1>
            </div>
            <div style="padding: 30px; background-color: #ffffff;">
                <h2 style="color: #1f2937; font-size: 20px; margin-top: 0;">Recuperación de Acceso</h2>
                <p style="color: #4b5563; line-height: 1.6;">Hola <strong>${user.name}</strong>,</p>
                <p style="color: #4b5563; line-height: 1.6;">Hemos recibido una solicitud para restablecer la contraseña de tu cuenta de pasajero.</p>
                <p style="color: #4b5563; line-height: 1.6;">Haz clic en el siguiente botón para crear una nueva contraseña. Por seguridad, este enlace expira en <strong>15 minutos</strong>.</p>
                
                <div style="text-align: center; margin: 35px 0;">
                    <a href="${resetLink}" style="background-color: #E5B869; color: #2A3F45; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">Restablecer Contraseña</a>
                </div>
                
                <p style="color: #9ca3af; font-size: 13px; border-top: 1px solid #e5e7eb; padding-top: 20px;">Si no solicitaste este cambio, puedes ignorar este correo de forma segura. Tus datos siguen protegidos.</p>
            </div>
        </div>
      `,
    };

    // 5. Enviamos el correo usando nodemailer
    await transporter.sendMail(mailOptions);

    // Respondemos éxito aunque el usuario no exista (por seguridad)
    // Pero en este caso ya verificamos existencia arriba
    res.json({ message: "¡Exito! Se ha enviado un enlace de recuperación a tu correo." });

  } catch (error) {
    console.error("Error en recuperación de contraseña:", error);
    res.status(500).json({ error: "Error al procesar la solicitud. Verifica la configuración de correo." });
  }
};

// Restablecer la contraseña (cuando el usuario hace clic en el enlace)
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: "Faltan datos requeridos." });
    }

    // 1. Verificamos que el token sea válido y no haya expirado
    // Si el token expiró o es inválido, jwt.verify lanzará un error
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 2. Encriptamos la nueva contraseña (igual que en el registro)
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 3. Actualizamos la contraseña en la base de datos
    await prisma.user.update({
      where: { id: decoded.userId },
      data: { password: hashedPassword }
    });

    res.json({ message: "¡Contraseña actualizada con éxito! Ya puedes iniciar sesión." });

  } catch (error) {
    console.error("Error al resetear contraseña:", error);
    // Diferenciamos si el error es por token expirado o por otro motivo
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ error: "El enlace de recuperación ha expirado." });
    }
    res.status(400).json({ error: "El enlace de recuperación es inválido o ha expirado." });
  }
};