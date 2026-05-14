// Configuración inicial que se ejecuta una vez que el DOM ha sido cargado completamente
document.addEventListener("DOMContentLoaded", () => {
	// Referencias a los elementos del formulario, tablas y modales para su manipulación
	const formPaciente = document.getElementById("formPaciente");
	const tablaPacientes = document.getElementById("tablaPacientes");
	const modalElement = document.getElementById("modalPaciente");

	// Inicialización del componente Modal de Bootstrap para controlar su apertura y cierre
	const modalPaciente = new bootstrap.Modal(modalElement);

	// Variables de estado para rastrear si se está editando un registro existente o creando uno nuevo
	let editandoId = null;
	let editandoCitaId = null;

	/**
	 * Función global encargada de gestionar el enrutamiento interno de la aplicación.
	 * Permite cambiar entre las diferentes secciones (Pacientes, Citas, etc.) de forma dinámica.
	 */
	window.mostrarVista = (vista) => {
		// 1. Oculta todas las secciones con la clase 'seccion-vista' para limpiar la pantalla
		document
			.querySelectorAll(".seccion-vista")
			.forEach((s) => (s.style.display = "none"));

		// 2. Localiza y muestra únicamente el contenedor correspondiente a la vista solicitada
		const vistaDiv = document.getElementById(`vista-${vista}`);
		if (vistaDiv) vistaDiv.style.display = "block";

		// 3. Ejecuta la carga automática de datos desde el servidor o base de datos según la vista activa
		if (vista === "pacientes") cargarPacientes();
		if (vista === "citas") {
			cargarCitas(); // Recupera y renderiza el listado de citas programadas
			cargarPacientesEnSelect(); // Sincroniza la lista de pacientes con el menú desplegable del formulario de citas
		}
	};

	/**
	 * Función asíncrona encargada de gestionar la recuperación de datos para la actualización
	 * de una historia clínica existente.
	 */
	window.prepararEdicion = async (id) => {
		try {
			// 1. Realiza una petición al servidor para obtener el listado completo de pacientes
			const res = await fetch("/api/pacientes");
			const pacientes = await res.json();

			// Localiza dentro de la colección el objeto que coincide con el identificador proporcionado
			const p = pacientes.find((paciente) => paciente.id === id);

			if (p) {
				// 2. Asigna el ID a la variable de control para cambiar el comportamiento del formulario a 'modo edición'
				editandoId = id;

				// 3. Realiza el mapeo de datos: transfiere los valores del objeto recuperado a los campos del formulario
				// Se utiliza el operador || "" para evitar que valores nulos o indefinidos se muestren visualmente
				document.getElementById("nombres").value = p.nombres || "";
				document.getElementById("numero_documento").value =
					p.numero_documento || "";
				document.getElementById("celular").value = p.celular || "";
				document.getElementById("direccion").value = p.direccion || "";
				document.getElementById("diagnosticos").value =
					p.diagnosticos || "";
				document.getElementById("motivo_consulta").value =
					p.motivo_consulta || "";
				document.getElementById("plan_tratamiento").value =
					p.plan_tratamiento || "";
				document.getElementById("antecedentes_personales").value =
					p.antecedentes_personales || "";
				document.getElementById("tipo_sangre").value =
					p.tipo_sangre || "";

				// 4. Actualiza dinámicamente la interfaz para reflejar la acción de edición en el encabezado
				document.getElementById("modalTitle").innerText =
					"Editar Historia Clínica";

				// 5. Desencadena la apertura del componente visual (Modal) mediante la instancia de Bootstrap
				modalPaciente.show();
			}
		} catch (err) {
			// Registra cualquier fallo en la comunicación con la API o en el procesamiento de datos
			console.error("Error al preparar edición:", err);
		}
	};

	/**
	 * Función asíncrona encargada de recuperar el listado de citas desde el servidor
	 * y renderizarlas dinámicamente en la interfaz de usuario.
	 */
	const cargarCitas = async () => {
		try {
			// 1. Realiza la petición GET al endpoint de la API para obtener la colección de citas
			const res = await fetch("/api/citas");
			const citas = await res.json();

			// Localización del contenedor de la tabla en el DOM
			const tabla = document.getElementById("tablaCitas");

			// Validación de seguridad para asegurar que el elemento existe antes de manipularlo
			if (!tabla) return;

			// Limpieza del contenido previo de la tabla para evitar duplicidad de registros
			tabla.innerHTML = "";

			// 2. Iteración sobre cada objeto de cita recuperado para construir las filas de la tabla
			citas.forEach((c) => {
				// Concatenación de nombre y apellido, gestionando posibles valores nulos
				const nombrePaciente =
					`${c.nombre || ""} ${c.apellido || ""}`.trim();

				// Inserción dinámica de filas HTML mediante Template Literals
				tabla.innerHTML += `
                <tr>
                    <!-- Visualización de datos clave: Paciente, Fecha, Hora y Motivo -->
                    <td><strong>${nombrePaciente}</strong></td>
                    <td>${c.fecha}</td>
                    <td>${c.hora}</td>
                    <td><small>${c.motivo || "Sin motivo"}</small></td>
                    <td>
                        <!-- Grupo de acciones para la gestión individual de cada registro -->
                        <div class="btn-group">
                            <!-- Botón para consulta detallada -->
                            <button class="btn btn-sm btn-outline-primary" onclick="verDetalleCita(${c.id})" title="Ver">
                                <i class="bi bi-eye"></i>
                            </button>
                            <!-- Botón para disparar el flujo de modificación de la cita -->
                            <button class="btn btn-sm btn-outline-warning" onclick="prepararEdicionCita(${c.id})" title="Editar">
                                <i class="bi bi-pencil-square"></i>
                            </button>
                            <!-- Botón para la eliminación lógica o física del registro -->
                            <button class="btn btn-sm btn-outline-danger" onclick="eliminarCita(${c.id})" title="Eliminar">
                                <i class="bi bi-x-circle"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
			});
		} catch (err) {
			// Registro de excepciones en caso de fallos en la red o en la respuesta de la API
			console.error("Error al cargar citas:", err);
		}
	};
	/**
	 * Escuchador de eventos para el envío del formulario de pacientes.
	 * Gestiona tanto la creación de nuevos registros como la actualización de los existentes.
	 */
	formPaciente.addEventListener("submit", async (e) => {
		// Evita la recarga predeterminada de la página para procesar la solicitud de forma asíncrona
		e.preventDefault();

		/**
		 * Función auxiliar para extraer valores del DOM.
		 * Valida la existencia del elemento antes de acceder a su propiedad 'value'.
		 */
		const getValue = (id) =>
			document.getElementById(id)
				? document.getElementById(id).value
				: "";

		// Construcción del objeto de datos con la información capturada en la interfaz
		const datos = {
			nombres: getValue("nombres"),
			apellido1: getValue("apellido1"),
			apellido2: getValue("apellido2"),
			numero_documento: getValue("numero_documento"),
			celular: getValue("celular"),
			direccion: getValue("direccion"),
			tipo_sangre: getValue("tipo_sangre"),
			motivo_consulta: getValue("motivo_consulta"),
			antecedentes_personales: getValue("antecedentes_personales"),
			diagnosticos: getValue("diagnosticos"),
			plan_tratamiento: getValue("plan_tratamiento"),
			// Asignación de valores por defecto para campos opcionales o no presentes
			sexo: getValue("sexo") || "M",
			fecha_nacimiento: getValue("fecha_nacimiento") || "2000-01-01",
			enfermedad_actual: getValue("enfermedad_actual") || "Ninguna",
		};

		/**
		 * Lógica de enrutamiento dinámico:
		 * Si 'editandoId' contiene un valor, se dirige al endpoint de actualización (PUT).
		 * De lo contrario, se dirige al endpoint de creación (POST).
		 */
		const url = editandoId
			? `/api/pacientes/${editandoId}`
			: "/api/pacientes";
		const method = editandoId ? "PUT" : "POST";

		try {
			// Ejecución de la petición HTTP al servidor con el cuerpo en formato JSON
			const res = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(datos),
			});

			// Si la operación es exitosa, se procede a limpiar la interfaz y refrescar la información
			if (res.ok) {
				modalPaciente.hide(); // Cierra el cuadro de diálogo
				await cargarPacientes(); // Recarga la tabla con los datos actualizados
				limpiarFormulario(); // Restablece los campos a su estado inicial
			}
		} catch (err) {
			// Captura y reporte de fallos durante el ciclo de vida de la petición
			console.error("Error en la solicitud:", err);
		}
	});
	/**
	 * 3. SECCIÓN EVOLUCIONES: Visualización del Historial Clínico Dinámico
	 * Recupera y renderiza la línea de tiempo de los progresos de un paciente específico.
	 */
	window.verHistorialEvolucion = async (id, nombre) => {
		// Cambia la interfaz hacia la vista de evoluciones y localiza el contenedor de destino
		mostrarVista("evoluciones");
		const area = document.getElementById("vista-evoluciones");

		try {
			// Petición asíncrona para obtener todas las notas de evolución vinculadas al ID del paciente
			const res = await fetch(`/api/evoluciones/${id}`);
			const evoluciones = await res.json();

			// Inyección dinámica de la interfaz de historial y el formulario de nueva entrada
			area.innerHTML = `
            <div class="d-flex justify-content-between mb-4">
                <h2>Historial de: ${nombre}</h2>
                <button class="btn btn-outline-secondary btn-sm" onclick="mostrarVista('pacientes')">Volver</button>
            </div>
            <!-- Módulo de captura para nuevas anotaciones clínicas -->
            <div class="card shadow p-4 mb-4">
                <h6>Nueva Entrada</h6>
                <textarea id="nueva-nota" class="form-control mb-2" rows="3" placeholder="Escriba el progreso..."></textarea>
                <button class="btn btn-success w-25" onclick="guardarNuevaEvolucion(${id}, '${nombre}')">Guardar Evolución</button>
            </div>
            <!-- Renderizado de la línea de tiempo mediante el mapeo del array de evoluciones -->
            <div id="timeline">
                ${evoluciones
					.map(
						(e) => `
                    <div class="card mb-2 border-start border-primary border-4 shadow-sm">
                        <div class="card-body">
                            <small class="text-primary fw-bold">${e.fecha}</small>
                            <p class="mb-0">${e.descripcion_evolucion}</p>
                        </div>
                    </div>
                `,
					)
					.join("")}
            </div>`;
		} catch (err) {
			console.error("Error al recuperar el historial:", err);
		}
	};

	/**
	 * 4. SECCIÓN EVOLUCIONES: Persistencia de Notas de Progreso
	 * Registra una nueva observación clínica en la base de datos.
	 */
	window.guardarNuevaEvolucion = async (pacienteId, nombre) => {
		const nota = document.getElementById("nueva-nota").value;

		// Validación de campo obligatorio para evitar registros vacíos
		if (!nota) return alert("Escriba una nota antes de guardar.");

		// Estructuración del objeto de datos con marca de tiempo automática
		const datos = {
			paciente_id: pacienteId,
			fecha: new Date().toLocaleString(),
			nota: nota,
			firma: "Odontólogo de Turno", // Firma genérica para el registro
		};

		try {
			const res = await fetch("/api/evoluciones", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(datos),
			});

			if (res.ok) {
				alert("Evolución guardada");
				// Recarga recursiva de la vista para mostrar la nueva entrada de forma inmediata
				verHistorialEvolucion(pacienteId, nombre);
			}
		} catch (err) {
			console.error("Error al guardar evolución:", err);
		}
	};

	/**
	 * FUNCIONES DE UTILIDAD: Gestión de Eliminación
	 * Ejecuta la baja de un registro de paciente tras confirmación explícita.
	 */
	window.eliminarPaciente = async (id) => {
		// Implementación de confirmación nativa para prevenir borrados accidentales
		if (
			confirm(
				"¿Estás seguro de eliminar este paciente? Todos sus registros se perderán.",
			)
		) {
			try {
				// Envío de petición DELETE al endpoint correspondiente
				const res = await fetch(`/api/pacientes/${id}`, {
					method: "DELETE",
				});

				if (res.ok) {
					alert("Paciente eliminado correctamente");
					// Sincronización global: refresca tablas de pacientes y citas para reflejar la eliminación
					cargarPacientes();
					cargarCitas();
				} else {
					const error = await res.json();
					alert("Error: " + error.error);
				}
			} catch (err) {
				console.error("Error en la petición de eliminación:", err);
			}
		}
	};

	/**
	 * Función encargada de restablecer el estado del formulario a sus valores iniciales.
	 * Es fundamental para asegurar que el sistema no mantenga datos de sesiones previas.
	 */
	window.limpiarFormulario = () => {
		// Restablece el ID de edición a null para que el sistema sepa que la próxima acción es un 'Crear' y no un 'Actualizar'
		editandoId = null;

		// Limpia todos los campos de entrada (inputs, selects, textareas) del formulario
		formPaciente.reset();

		// Restaura el título original del modal para reflejar un nuevo registro
		document.getElementById("modalTitle").innerText =
			"Registro de Historia Clínica";
	};

	// Invocación inicial para poblar la tabla de pacientes al cargar la aplicación por primera vez
	cargarPacientes();
});

/**
 * Función asíncrona encargada de procesar y enviar el registro de evolución clínica al servidor.
 * Valida los datos de entrada antes de realizar la petición HTTP.
 */
const guardarEvolucion = async () => {
	// 1. Extracción de valores desde los elementos del DOM
	const notaInput = document.getElementById("input_nota");
	const firmaInput = document.getElementById("input_firma");
	const pacienteId = document.getElementById("id_paciente_actual").value;

	/**
	 * Capa de validación de negocio:
	 * Verifica la existencia de un paciente vinculado y la presencia de contenido en la nota.
	 */
	if (!pacienteId) {
		alert("Error: No se ha seleccionado un paciente.");
		return;
	}
	if (!notaInput.value.trim()) {
		alert("Por favor, escribe una nota de evolución.");
		return;
	}

	/**
	 * 2. Estructuración del objeto de transporte de datos (DTO).
	 * Se utiliza el formato de fecha local 'es-ES' para mantener la coherencia regional.
	 */
	const datos = {
		paciente_id: pacienteId,
		fecha: new Date().toLocaleString("es-ES"),
		nota: notaInput.value,
		firma: firmaInput.value || "General",
	};

	// Registro de depuración para monitorear el flujo de datos en la consola de desarrollo
	console.log("Enviando datos:", datos);

	try {
		// Ejecución de la petición POST hacia el endpoint de evoluciones
		const res = await fetch("/api/evoluciones", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(datos),
		});

		const resultado = await res.json();

		// 3. Manejo de la respuesta del servidor
		if (res.ok) {
			alert("✅ Evolución guardada correctamente");

			// Limpieza del campo de entrada para permitir nuevas anotaciones
			notaInput.value = "";

			/**
			 * Sincronización de la interfaz:
			 * Si existe la función de carga, refresca la lista para mostrar la nueva entrada inmediatamente.
			 */
			if (typeof cargarListaEvoluciones === "function") {
				cargarListaEvoluciones(pacienteId);
			}
		} else {
			// Notificación visual de errores controlados desde el backend
			alert("❌ Error: " + (resultado.error || "No se pudo guardar"));
		}
	} catch (err) {
		// Gestión de excepciones de red o fallos críticos de comunicación
		console.error("Error en la petición:", err);
		alert("Hubo un problema al conectar con el servidor.");
	}
};

/**
 * --- GESTIÓN DE PACIENTES ---
 * Función asíncrona encargada de recuperar el listado de pacientes y construir
 * dinámicamente la tabla principal con sus respectivas opciones de gestión.
 */
const cargarPacientes = async () => {
	try {
		// 1. Petición GET al endpoint de pacientes para obtener la data actualizada
		const res = await fetch("/api/pacientes");
		const pacientes = await res.json();
		const tabla = document.getElementById("tablaPacientes");

		// Validación de existencia del elemento contenedor en el DOM
		if (!tabla) return;

		// Limpieza de la tabla para evitar la duplicidad de filas al refrescar
		tabla.innerHTML = "";

		// 2. Procesamiento de la colección de pacientes
		pacientes.forEach((p) => {
			/**
			 * Mapeo de alias según la estructura definida en el Backend (SQL):
			 * - p.cedula se recibe como 'numero_documento'
			 * - p.nombre se recibe como 'nombres'
			 * - p.telefono se recibe como 'celular'
			 */
			const documento = p.numero_documento || "S/N";
			const nombreCompleto =
				`${p.nombres || ""} ${p.apellido || ""}`.trim();
			const telefono = p.celular || "N/A";
			const diagnostico = p.diagnosticos || "Sin registro";

			// 3. Construcción de la fila (tr) con inyección de datos y botones de acción
			tabla.innerHTML += `
                <tr>
                    <td><span class="badge bg-secondary">${documento}</span></td>
                    <td><strong>${nombreCompleto}</strong></td>
                    <td>${telefono}</td>
                    <td>${diagnostico}</td>
                    <td>
                        <!-- Grupo de botones con funciones específicas por paciente (ID) -->
                        <div class="btn-group shadow-sm">
                            <!-- Acceso a la agenda del paciente -->
                            <button class="btn btn-outline-info btn-sm" onclick="verCitasPaciente(${p.id}, '${nombreCompleto}')" title="Citas">
                                <i class="bi bi-calendar-event"></i>
                            </button>
                            <!-- Acceso al historial de evolución clínica -->
                            <button class="btn btn-outline-success btn-sm" onclick="verEvolucionPaciente(${p.id}, '${nombreCompleto}')" title="Evolución">
                                <i class="bi bi-clipboard2-pulse"></i>
                            </button>
                            <!-- Disparador del modo edición -->
                            <button class="btn btn-outline-primary btn-sm" onclick="prepararEdicion(${p.id})" title="Editar">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <!-- Disparador del flujo de eliminación -->
                            <button class="btn btn-outline-danger btn-sm" onclick="eliminarPaciente(${p.id})" title="Eliminar">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>`;
		});
	} catch (err) {
		// Reporte de fallos en la comunicación con la API
		console.error("Error al cargar pacientes:", err);
	}
};
/**
 * --- SISTEMA DE AGENDAMIENTO ---
 * 1. Poblado Dinámico de Pacientes:
 * Sincroniza la lista de pacientes registrados con el menú desplegable (select)
 * del formulario de citas para asegurar la integridad referencial.
 */
const cargarPacientesEnSelect = async () => {
	try {
		const res = await fetch("/api/pacientes");
		const pacientes = await res.json();
		const select = document.getElementById("cita_paciente_id");

		if (!select) return;

		// Limpieza y restablecimiento de la opción por defecto (placeholder)
		select.innerHTML =
			'<option value="">Seleccione un paciente...</option>';

		pacientes.forEach((p) => {
			// Extracción de datos usando los alias definidos en el Backend
			const nombreCompleto = `${p.nombres} ${p.apellido}`.trim();
			const documento = p.numero_documento;

			// Creación dinámica de elementos <option> para el selector
			const opcion = document.createElement("option");
			opcion.value = p.id;
			opcion.textContent = `${nombreCompleto} (${documento})`;
			select.appendChild(opcion);
		});

		console.log("Menú de citas actualizado con los pacientes de la DB.");
	} catch (err) {
		console.error("Error al llenar el select:", err);
	}
};

// Exposición global para permitir su invocación desde eventos HTML (como botones en el Navbar)
window.cargarPacientesEnSelect = cargarPacientesEnSelect;

/**
 * 2. Visualización de la Agenda:
 * Recupera el listado completo de citas y renderiza la tabla de control.
 */
const cargarCitas = async () => {
	try {
		const res = await fetch("/api/citas");
		const citas = await res.json();
		const tabla = document.getElementById("tablaCitas");

		if (!tabla) return;
		tabla.innerHTML = "";

		citas.forEach((c) => {
			const nombreCompleto =
				`${c.nombres || ""} ${c.apellido || ""}`.trim();

			// Inserción de filas con información temporal y motivos de consulta
			tabla.innerHTML += `
            <tr>
                <td><strong>${nombreCompleto}</strong></td>
                <td>${c.fecha || "N/A"}</td>
                <td>${c.hora || "N/A"}</td>
                <td>${c.motivo || "Sin motivo"}</td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-outline-primary btn-sm" onclick="prepararEdicionCita(${c.id})" title="Editar Cita">
                            <i class="bi bi-pencil-square"></i>
                        </button>
                        <button class="btn btn-outline-danger btn-sm" onclick="eliminarCita(${c.id})" title="Eliminar Cita">
                            <i class="bi bi-x-circle"></i>
                        </button>
                    </div>
                </td>
            </tr>`;
		});
	} catch (err) {
		console.error("Error al cargar citas:", err);
	}
};

/**
 * 3. Persistencia de Citas:
 * Escucha el envío del formulario, previene la recarga de página y guarda la data.
 */
document.getElementById("formCita").addEventListener("submit", async (e) => {
	e.preventDefault(); // Detiene el comportamiento por defecto de envío del formulario

	// Mapeo de campos del DOM a objeto JSON compatible con el modelo de la DB
	const datos = {
		paciente_id: document.getElementById("cita_paciente_id").value,
		fecha: document.getElementById("cita_fecha").value,
		hora: document.getElementById("cita_hora").value,
		motivo: document.getElementById("cita_motivo").value,
	};

	try {
		const res = await fetch("/api/citas", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(datos),
		});

		if (res.ok) {
			alert("Cita programada con éxito");

			// Cierre programático del Modal usando la instancia de Bootstrap
			bootstrap.Modal.getInstance(
				document.getElementById("modalCita"),
			).hide();

			// Limpieza del formulario y actualización automática de la tabla
			document.getElementById("formCita").reset();
			cargarCitas();
		}
	} catch (err) {
		console.error("Error en el guardado de la cita:", err);
		alert("Error al programar cita");
	}
}); /**
 * 4. Eliminación de Citas:
 * Procesa la cancelación de una consulta previa confirmación del usuario.
 */
window.eliminarCita = async (id) => {
	if (confirm("¿Deseas cancelar esta cita?")) {
		// Ejecución de la baja en el servidor y refresco inmediato de la tabla
		await fetch(`/api/citas/${id}`, { method: "DELETE" });
		cargarCitas();
	}
};

/**
 * 5. Extensión del Enrutador Interno (mostrarVista):
 * Sobrescribe la función original para asegurar que la data de citas
 * esté siempre sincronizada al cambiar de sección.
 */
const mostrarVistaOriginal = window.mostrarVista;
window.mostrarVista = (vista) => {
	mostrarVistaOriginal(vista); // Ejecuta la lógica de visibilidad preexistente

	// Dispara la carga de datos específicos si la vista activa es la de agenda
	if (vista === "citas") {
		cargarCitas();
		cargarPacientesEnSelect();
	}
};

/**
 * Acceso directo desde la tabla de Pacientes:
 * Cambia a la vista de citas y abre el modal con el paciente pre-seleccionado.
 */
window.verCitasPaciente = (id, nombre) => {
	mostrarVista("citas");
	cargarCitas();

	const modal = new bootstrap.Modal(document.getElementById("modalCita"));

	// Asegura que el select esté poblado antes de asignar el valor del paciente
	cargarPacientesEnSelect().then(() => {
		document.getElementById("cita_paciente_id").value = id;
		modal.show();
	});
};

/**
 * Consulta de Detalles:
 * Recupera la información completa de una cita para mostrarla en un resumen visual.
 */
window.verDetalleCita = async (id) => {
	try {
		const res = await fetch(`/api/citas`);
		const citas = await res.json();
		const cita = citas.find((c) => c.id === id);

		// Presentación de la data estructurada al usuario
		alert(
			`Detalles de la Cita:\n\nPaciente: ${cita.nombre}\nMotivo: ${cita.motivo}\nFecha: ${cita.fecha} a las ${cita.hora}`,
		);
	} catch (err) {
		console.error("Error al visualizar detalles:", err);
	}
};

/**
 * Flujo de Edición de Citas:
 * Carga los datos actuales en el formulario y lo prepara para una operación de actualización.
 */
window.prepararEdicionCita = async (id) => {
	console.log("Editando cita con ID:", id);
	try {
		const res = await fetch("/api/citas");
		const citas = await res.json();
		const cita = citas.find((c) => c.id === id);

		if (cita) {
			// Mapeo de datos del objeto 'cita' a los campos del formulario modal
			document.getElementById("cita_paciente_id").value =
				cita.paciente_id;
			document.getElementById("cita_fecha").value = cita.fecha;
			document.getElementById("cita_hora").value = cita.hora;
			document.getElementById("cita_motivo").value = cita.motivo || "";

			// Modificación dinámica de la UI para indicar el estado de edición
			document.querySelector("#modalCita .modal-title").innerHTML =
				'<i class="bi bi-pencil-square"></i> Editar Cita';

			const btnGuardar = document.querySelector(
				'#formCita button[type="submit"]',
			);
			btnGuardar.innerText = "Actualizar Cita";

			// Almacenamiento del ID en el contexto global para la petición PUT posterior
			window.editandoCitaId = id;

			// Apertura del componente visual
			const modalCita = new bootstrap.Modal(
				document.getElementById("modalCita"),
			);
			modalCita.show();
		}
	} catch (err) {
		console.error("Error al cargar datos de la cita:", err);
	}
}; /**
 * Listener para el envío del formulario de citas.
 * Implementa lógica dual: detecta si debe crear un nuevo registro (POST)
 * o actualizar uno existente (PUT).
 */
document.getElementById("formCita").addEventListener("submit", async (e) => {
	e.preventDefault();

	// Recolección de datos desde la interfaz de usuario
	const datos = {
		paciente_id: document.getElementById("cita_paciente_id").value,
		fecha: document.getElementById("cita_fecha").value,
		hora: document.getElementById("cita_hora").value,
		motivo: document.getElementById("cita_motivo").value,
	};

	/**
	 * Selección dinámica de URL y Método HTTP:
	 * Si 'editandoCitaId' tiene valor, la petición se dirige al recurso específico para actualización.
	 */
	const url = editandoCitaId ? `/api/citas/${editandoCitaId}` : "/api/citas";
	const metodo = editandoCitaId ? "PUT" : "POST";

	try {
		const res = await fetch(url, {
			method: metodo,
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(datos),
		});

		if (res.ok) {
			// Feedback visual al usuario según el tipo de operación realizada
			alert(
				editandoCitaId
					? "Cita actualizada correctamente"
					: "Cita creada",
			);

			/**
			 * LIMPIEZA POST-OPERACIÓN:
			 * Restablece el estado global para evitar que la siguiente cita se guarde como edición.
			 */
			editandoCitaId = null;
			document.getElementById("formCita").reset();

			// Cierre del modal de Bootstrap y refresco de la tabla de visualización
			bootstrap.Modal.getInstance(
				document.getElementById("modalCita"),
			).hide();

			cargarCitas();
		}
	} catch (err) {
		alert("Error al procesar la solicitud");
	}
});

/**
 * Orquestador de la Vista de Evoluciones:
 * Prepara el entorno para registrar o consultar el progreso clínico de un paciente.
 */
window.verEvolucionPaciente = async (id, nombreCompleto) => {
	// 1. Persistencia temporal del ID en un campo oculto para futuras operaciones de guardado
	document.getElementById("id_paciente_actual").value = id;

	// 2. Transición de la interfaz hacia la vista de historial de evoluciones
	mostrarVista("evoluciones");

	// 3. Activación visual del contenedor de registro
	document.getElementById("contenedor-registro-evolucion").style.display =
		"block";

	// 4. Personalización del encabezado con el nombre del paciente actual
	const titulo = document.getElementById("nombrePacienteEvolucion");
	if (titulo)
		titulo.innerHTML = `<i class="bi bi-clipboard2-pulse"></i> Historia Clínica: <span class="text-dark">${nombreCompleto}</span>`;

	// 5. Invocación de la carga de datos históricos desde el servidor
	cargarListaEvoluciones(id);
};

/**
 * Función de renderizado para el historial de evoluciones:
 * Construye visualmente la línea de tiempo de notas médicas.
 */
const cargarListaEvoluciones = async (id) => {
	try {
		const res = await fetch(`/api/evoluciones/${id}`);
		const evoluciones = await res.json();
		const lista = document.getElementById("listaEvoluciones");

		lista.innerHTML = ""; // Limpieza del contenedor antes de renderizar

		if (evoluciones.length === 0) {
			// Manejo de estado vacío (Zero State)
			lista.innerHTML = `<div class="alert alert-info">No hay evoluciones previas para este paciente.</div>`;
		} else {
			// Iteración y construcción de tarjetas (cards) para cada nota evolutiva
			evoluciones.forEach((evo) => {
				/**
				 * Extracción de campos según el esquema de base de datos:
				 * - descripcion_evolucion: El texto médico
				 * - firma_odontologo: Identificación del profesional
				 */
				const textoEvo = evo.descripcion_evolucion || "Sin descripción";
				const firma = evo.firma_odontologo || "General";

				lista.innerHTML += `
        <div class="card mb-3 border-0 border-start border-success border-4 shadow-sm">
            <div class="card-body">
                <div class="d-flex justify-content-between mb-2">
                    <h6 class="fw-bold text-success mb-0">${evo.fecha}</h6>
                    <span class="badge bg-light text-dark border">${firma}</span>
                </div>
                <p class="mb-0 text-secondary">${textoEvo}</p>
            </div>
        </div>`;
			});
		}
	} catch (err) {
		console.error("Fallo al cargar el listado de evoluciones:", err);
	}
};

/**
 * Inicialización Global:
 * Define la vista por defecto al cargar el sitio por primera vez.
 */
document.addEventListener("DOMContentLoaded", () => {
	mostrarVista("pacientes");
});
