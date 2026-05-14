/**
 * RUTA: /api/pacientes
 * Descripción: Define los puntos de acceso para la administración de la base de datos de pacientes.
 * Módulo Crítico: Gestiona el ciclo de vida completo de un paciente (CRUD).
 */

const express = require("express");
const router = express.Router();

/**
 * Importación del Controlador:
 * El uso de "../" permite retroceder un nivel desde la carpeta 'routes'
 * para acceder a la lógica en 'controllers'.
 */
const pacientesController = require("../controllers/pacientes.controller");

/**
 * Operaciones de Gestión de Pacientes:
 */

// Recupera el listado completo de pacientes registrados
router.get("/", pacientesController.obtenerPacientes);

/**
 * Registro Integral:
 * Crea un nuevo paciente y, según la lógica del controlador,
 * inicializa su historia clínica en una sola operación atómica.
 */
router.post("/", pacientesController.crearPacienteConHistoria);

// Actualiza los datos personales o de contacto de un paciente específico
router.put("/:id", pacientesController.actualizarPaciente);

// Elimina el registro de un paciente mediante su identificador único (ID)
router.delete("/:id", pacientesController.eliminarPaciente);

module.exports = router;
