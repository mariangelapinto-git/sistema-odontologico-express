// Importa la instancia de la base de datos para ejecutar las operaciones CRUD.
const db = require("../config/database");

// 1. Guardar Nuevo Paciente (POST)
// Este controlador gestiona la creación de un paciente y su historia clínica en un solo flujo.
const crearPacienteConHistoria = (req, res) => {
	// Extrae y desestructura los datos del cuerpo de la petición, asignando valores por defecto.
	const {
		nombres = "",
		apellido1 = "",
		apellido2 = "",
		sexo = "M",
		fecha_nacimiento = "2000-01-01",
		numero_documento = "",
		celular = "",
		direccion = "",
		tipo_sangre = "",
		motivo_consulta = "",
		enfermedad_actual = "",
		antecedentes_personales = "",
		antecedentes_familiares = "",
		antecedentes_odontologicos = "",
		diagnosticos = "",
		plan_tratamiento = "",
	} = req.body;

	// Define la consulta para insertar los datos personales en la tabla 'pacientes'.
	const sqlPaciente = `INSERT INTO pacientes (nombre, apellido, cedula, fecha_nacimiento, genero, telefono, direccion) VALUES (?, ?, ?, ?, ?, ?, ?)`;
	const paramsPaciente = [
		nombres,
		`${apellido1} ${apellido2}`.trim(), // Concatena los dos apellidos en un solo campo.
		numero_documento,
		fecha_nacimiento,
		sexo,
		celular,
		direccion,
	];

	// Ejecuta la primera inserción para crear el registro del paciente.
	db.run(sqlPaciente, paramsPaciente, function (err) {
		if (err) return res.status(500).json({ error: err.message });

		// Recupera el ID generado automáticamente para el nuevo paciente.
		const pacienteId = this.lastID;

		// Define la consulta para insertar los datos médicos en la tabla 'historia_clinica'.
		const sqlHistoria = `INSERT INTO historia_clinica (
            paciente_id, tipo_sangre, motivo_consulta, enfermedad_actual, 
            antecedentes_personales, antecedentes_familiares, 
            antecedentes_odontologicos, diagnosticos, plan_tratamiento
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

		const paramsHistoria = [
			pacienteId, // Utiliza el ID obtenido del paso anterior para vincular ambos registros.
			tipo_sangre,
			motivo_consulta,
			enfermedad_actual,
			antecedentes_personales,
			antecedentes_familiares,
			antecedentes_odontologicos,
			diagnosticos,
			plan_tratamiento,
		];

		// Ejecuta la segunda inserción para completar el expediente médico.
		db.run(sqlHistoria, paramsHistoria, (err) => {
			if (err) return res.status(500).json({ error: err.message });
			res.status(201).json({ mensaje: "Guardado correctamente" });
		});
	});
};

// 2. Obtener Pacientes (GET)
// Recupera la lista de pacientes junto con información clave de su historia clínica.
const obtenerPacientes = (req, res) => {
	// Utiliza un 'LEFT JOIN' para asegurar que se muestren todos los pacientes,
	// incluso si por alguna razón no tienen una historia clínica asociada.
	const sql = `
        SELECT p.id, p.nombre AS nombres, p.apellido, p.cedula AS numero_documento, 
               p.telefono AS celular, p.direccion, p.genero AS sexo, p.fecha_nacimiento,
               h.motivo_consulta, h.diagnosticos, h.plan_tratamiento, h.tipo_sangre,
               h.antecedentes_personales, h.enfermedad_actual
        FROM pacientes p 
        LEFT JOIN historia_clinica h ON p.id = h.paciente_id
    `;
	db.all(sql, [], (err, rows) => {
		if (err) return res.status(500).json({ error: err.message });
		res.json(rows);
	});
};

// 3. ACTUALIZAR Paciente (PUT) - CORREGIDO
// Permite modificar la información tanto personal como médica de un registro existente.
const actualizarPaciente = (req, res) => {
	const { id } = req.params; // Obtiene el ID del paciente desde la ruta.
	const {
		nombres,
		apellido1 = "",
		apellido2 = "",
		celular,
		direccion,
		motivo_consulta,
		diagnosticos,
		plan_tratamiento,
		antecedentes_personales,
		tipo_sangre,
		sexo,
		fecha_nacimiento,
	} = req.body;

	const apellidoCompleto = `${apellido1} ${apellido2}`.trim();

	// Primera actualización: afecta los datos personales en la tabla 'pacientes'.
	const sqlP = `UPDATE pacientes SET nombre = ?, apellido = ?, telefono = ?, direccion = ?, genero = ?, fecha_nacimiento = ? WHERE id = ?`;

	db.run(
		sqlP,
		[
			nombres,
			apellidoCompleto,
			celular,
			direccion,
			sexo,
			fecha_nacimiento,
			id,
		],
		function (err) {
			if (err) return res.status(500).json({ error: err.message });

			// Segunda actualización: afecta los datos médicos en 'historia_clinica'.
			const sqlH = `UPDATE historia_clinica SET 
                      motivo_consulta = ?, 
                      diagnosticos = ?, 
                      plan_tratamiento = ?,
                      antecedentes_personales = ?,
                      tipo_sangre = ?
                      WHERE paciente_id = ?`;

			db.run(
				sqlH,
				[
					motivo_consulta,
					diagnosticos,
					plan_tratamiento,
					antecedentes_personales,
					tipo_sangre,
					id,
				],
				function (err) {
					if (err)
						return res.status(500).json({ error: err.message });
					res.json({ mensaje: "Actualizado con éxito" });
				},
			);
		},
	);
};

// 4. Eliminar Paciente (DELETE)
// Remueve al paciente del sistema basándose en su identificador único.
const eliminarPaciente = (req, res) => {
	const { id } = req.params;

	// Ejecuta la sentencia de borrado.
	// Nota: Al borrar al paciente, SQLite borrará automáticamente su historia y evoluciones
	// siempre que se haya configurado "ON DELETE CASCADE".
	db.run(`DELETE FROM pacientes WHERE id = ?`, [id], function (err) {
		if (err) {
			return res
				.status(500)
				.json({ error: "Error al eliminar: " + err.message });
		}
		res.json({
			mensaje: "Paciente y registros asociados eliminados con éxito",
		});
	});
};

// Exporta los controladores para su integración en el sistema de rutas.
module.exports = {
	crearPacienteConHistoria,
	obtenerPacientes,
	actualizarPaciente,
	eliminarPaciente,
};
