/**
 * RUTA: /api/citas
 * Descripción: Define los endpoints para la gestión del calendario de citas médicas.
 * Arquitectura: Delegación de lógica de negocio al controlador 'citasController'.
 */

const express = require("express");
const router = express.Router();
const citasController = require("../controllers/citas.controller");

/**
 * Operaciones CRUD para Citas:
 */

// Recupera todas las citas (usualmente con un JOIN a la tabla de pacientes)
router.get("/", citasController.obtenerCitas);

// Registra una nueva cita en la agenda
router.post("/", citasController.crearCita);

// Elimina una cita específica mediante su ID
router.delete("/:id", citasController.eliminarCita);

/**
 * Actualiza la información de una cita existente.
 * Nota: Se corrigió la ruta de "//:id" a "/:id" para asegurar la compatibilidad con el frontend.
 */
router.put("/:id", citasController.actualizarCita);

module.exports = router;
