/**
 * RUTA: /api/evoluciones
 * Descripción: Gestiona el flujo de información referente al progreso clínico (notas de evolución).
 * Vincula las acciones del usuario con la lógica de persistencia en la base de datos.
 */

const express = require("express");
const router = express.Router();
const evolucionesController = require("../controllers/evoluciones.controller");

/**
 * Operaciones de Historial Clínico:
 */

/**
 * Registro de nueva nota:
 * Recibe los datos de la intervención (descripción, firma, ID del paciente)
 * y los almacena como una nueva entrada cronológica.
 */
router.post("/", evolucionesController.registrarEvolucion);

/**
 * Recuperación de historial:
 * Obtiene todas las notas de progreso vinculadas a un paciente específico.
 * El parámetro ':id' corresponde al identificador único del paciente en la base de datos.
 */
router.get("/:id", evolucionesController.listarEvoluciones);

module.exports = router;
