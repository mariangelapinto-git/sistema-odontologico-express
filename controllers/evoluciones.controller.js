// Importa la instancia de la base de datos configurada para ejecutar las operaciones.
const db = require("../config/database");

// Define la lógica para registrar una nueva nota de evolución médica.
const registrarEvolucion = (req, res) => {
	// Extrae la información enviada desde el frontend a través del cuerpo de la petición.
	const { paciente_id, fecha, nota, firma } = req.body;

	// Realiza una validación técnica para asegurar que se cuenta con el ID del paciente y el contenido de la nota.
	if (!paciente_id || !nota) {
		return res
			.status(400)
			.json({ error: "El ID del paciente y la nota son obligatorios" });
	}

	// Prepara una sentencia SQL compleja que utiliza una subconsulta (SELECT) dentro de un INSERT.
	// Esto permite vincular la evolución directamente con el ID de la historia clínica
	// basándose en el ID del paciente proporcionado.
	// Usamos una subconsulta para encontrar el historia_id correcto
	const sql = `
        INSERT INTO evoluciones (historia_id, fecha, descripcion_evolucion, firma_odontologo) 
        SELECT id, ?, ?, ? 
        FROM historia_clinica 
        WHERE paciente_id = ?
    `;

	// Ejecuta la consulta pasando los parámetros de forma segura para evitar inyecciones de código.
	db.run(sql, [fecha, nota, firma, paciente_id], function (err) {
		// Captura y responde ante errores internos del servidor o de la base de datos.
		if (err) return res.status(500).json({ error: err.message });

		// Evalúa si hubo cambios en la base de datos. Si 'this.changes' es 0,
		// significa que el paciente no tiene una historia clínica previa donde asociar la nota.
		// Si no se insertó nada, es porque el paciente no tiene Historia Clínica creada
		if (this.changes === 0) {
			return res.status(404).json({
				error: "No se encontró una Historia Clínica para este paciente. Créala primero.",
			});
		}

		// Informa al cliente que el registro se realizó satisfactoriamente.
		res.status(201).json({ mensaje: "Evolución registrada con éxito" });
	});
};

// Define la lógica para recuperar el historial de evoluciones de un paciente específico.
const listarEvoluciones = (req, res) => {
	// Captura el ID del paciente directamente desde los parámetros de la URL.
	const { id } = req.params; // Este es el paciente_id

	// Realiza una unión (JOIN) entre las tablas de evoluciones e historia clínica
	// para filtrar los registros que pertenecen únicamente al paciente solicitado.
	const sql = `
        SELECT e.* FROM evoluciones e 
        JOIN historia_clinica h ON e.historia_id = h.id 
        WHERE h.paciente_id = ? 
        ORDER BY e.id DESC
    `;

	// Ejecuta la búsqueda y retorna todas las filas encontradas al cliente.
	db.all(sql, [id], (err, rows) => {
		if (err) return res.status(500).json({ error: err.message });
		res.json(rows); // Entrega el listado ordenado de forma descendente (del más reciente al más antiguo).
	});
};

// Exporta las funciones para que puedan ser mapeadas a sus respectivas rutas de la API.
module.exports = { registrarEvolucion, listarEvoluciones };
