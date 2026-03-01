import express from "express";
import { 
  registerUser, 
  loginUser, 
  getProfile,
  updateProfile,
  deleteAccount,
  deactivateUser,
  forgotPassword,
  resetPassword
} from "../controllers/user.controller.js";

// Revisa que la ruta de tu middleware coincida con el nombre de tu archivo exacto
import { authenticate } from "../middlewares/auth.middleware.js"; 

const router = express.Router();

/** * @route   POST /api/users/register
 * @desc    Crea y registra un nuevo usuario en la base de datos
 * @access  Público
 */
router.post("/register", registerUser);

/**
 * @route   POST /api/users/login
 * @desc    Autentica al usuario y devuelve un token de sesión (JWT)
 * @access  Público
 */
router.post("/login", loginUser);

/**
 * @route   GET /api/users/me
 * @desc    Obtiene los datos del perfil del usuario actualmente logueado
 * @access  Privado
 */
router.get("/me", authenticate, getProfile);

/**
 * @route   PUT /api/users/me
 * @desc    Actualiza nombre, teléfono y tarjeta guardada
 * @access  Privado
 */
router.put("/me", authenticate, updateProfile);

/**
 * @route   DELETE /api/users/me
 * @desc    Elimina la cuenta del usuario permanentemente
 * @access  Privado
 */
router.delete("/me", authenticate, deleteAccount);

//desactivar cuenta
router.patch('/me/deactivate', authenticate, deactivateUser);

//Importamos la ruta de forgot-password
router.post("/forgot-password", forgotPassword);

//IMportacion de resetPassword
router.post("/reset-Password", resetPassword);

export default router;