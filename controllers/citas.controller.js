// Se importa la instancia de la base de datos configurada previamente.
const db = require("../config/database");

// Define la lógica para registrar una nueva cita médica.
const crearCita = (req, res) => {
	// Extrae los datos necesarios del cuerpo de la petición.
	const { paciente_id, fecha, hora, motivo } = req.body;

	// Valida que los campos esenciales no estén ausentes para proceder con el registro.
	if (!paciente_id || !fecha || !hora) {
		return res.status(400).json({ error: "Faltan datos obligatorios" });
	}

	// Prepara la instrucción SQL utilizando parámetros seguros (?) para la inserción.
	const sql = `INSERT INTO citas (paciente_id, fecha, hora, motivo) VALUES (?, ?, ?, ?)`;

	// Ejecuta la operación de inserción en la base de datos de manera asíncrona.
	db.run(sql, [paciente_id, fecha, hora, motivo], function (err) {
		// En caso de fallo en el servidor o la BD, retorna un error 500.
		if (err) return res.status(500).json({ error: err.message });

		// Confirma la creación exitosa y devuelve el ID generado por la base de datos.
		res.status(201).json({ mensaje: "Cita programada", id: this.lastID });
	});
};

// Define la lógica para obtener el listado de todas las citas programadas.
const obtenerCitas = (req, res) => {
	// Realiza una consulta que combina citas con la tabla de pacientes para enriquecer la información.
	const sql = `
        SELECT c.*, p.nombre, p.apellido 
        FROM citas c 
        JOIN pacientes p ON c.paciente_id = p.id 
        ORDER BY c.fecha ASC, c.hora ASC`;

	// Solicita todos los registros que coincidan con la consulta.
	db.all(sql, [], (err, rows) => {
		// Maneja posibles errores durante la lectura de la base de datos.
		if (err) return res.status(500).json({ error: err.message });

		// Envía al cliente la lista completa de citas en formato JSON.
		res.json(rows);
	});
};

// Define la lógica para dar de baja una cita específica por su identificador.
const eliminarCita = (req, res) => {
	// Captura el ID de la cita desde los parámetros de la ruta.
	const { id } = req.params;

	// Ejecuta la sentencia de eliminación filtrando por el ID correspondiente.
	db.run(`DELETE FROM citas WHERE id = ?`, [id], (err) => {
		if (err) return res.status(500).json({ error: err.message });

		// Notifica que el proceso de eliminación se completó satisfactoriamente.
		res.json({ mensaje: "Cita eliminada" });
	});
};

// Define la lógica para modificar la información de una cita ya existente.
const actualizarCita = (req, res) => {
	// Recupera el ID de la URL y los nuevos datos desde el cuerpo de la petición.
	const { id } = req.params;
	const { paciente_id, fecha, hora, motivo } = req.body;

	// Prepara la sentencia de actualización para los campos permitidos.
	const sql = `UPDATE citas SET paciente_id = ?, fecha = ?, hora = ?, motivo = ? WHERE id = ?`;

	// Aplica los cambios en la base de datos usando el ID como filtro de seguridad.
	db.run(sql, [paciente_id, fecha, hora, motivo, id], function (err) {
		if (err) return res.status(500).json({ error: err.message });

		// Confirma que la actualización de la información fue exitosa.
		res.json({ mensaje: "Cita actualizada correctamente" });
	});
};

// No olvides agregarla al module.exports al final del archivo
// Exporta todas las funciones de controlador para que el enrutador pueda utilizarlas.
module.exports = { crearCita, obtenerCitas, eliminarCita, actualizarCita };
