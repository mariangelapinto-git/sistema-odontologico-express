// Importa el módulo de SQLite3 y activa el modo 'verbose' para facilitar
// el rastreo de errores mediante mensajes más detallados en la consola.
const sqlite3 = require("sqlite3").verbose();

// Inicia la conexión con el archivo de base de datos local './odontologia.db'.
const db = new sqlite3.Database("./odontologia.db", (err) => {
	// Verifica si ocurrió un error al intentar abrir o crear el archivo.
	if (err) console.error("Error al abrir DB:", err.message);
	else {
		// Confirma la conexión exitosa en la terminal del servidor.
		console.log("CONEXION EXITOSA");
		// Ejecuta un comando interno de SQLite para habilitar el soporte de claves foráneas,
		// lo cual es necesario para mantener la integridad de los datos relacionados.
		// Activamos el soporte para claves foráneas
		db.run("PRAGMA foreign_keys = ON");
	}
});

// El método serialize garantiza que la creación de las tablas se realice de
// forma ordenada y secuencial, evitando conflictos durante la inicialización.
db.serialize(() => {
	// 1. TABLA DE PACIENTES
	// Crea la tabla para almacenar los datos básicos de los pacientes si aún no existe.
	db.run(`CREATE TABLE IF NOT EXISTS pacientes (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        nombre TEXT,
        apellido TEXT,
        cedula TEXT UNIQUE,                   
        fecha_nacimiento TEXT,
        genero TEXT,
        telefono TEXT,
        direccion TEXT
    )`);

	// 2. TABLA DE HISTORIA CLÍNICA
	// Establece una relación 1:1 con la tabla de pacientes mediante 'paciente_id UNIQUE'.
	// paciente_id es UNIQUE para asegurar que un paciente solo tenga una historia
	db.run(`CREATE TABLE IF NOT EXISTS historia_clinica (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        paciente_id INTEGER UNIQUE,            
        tipo_sangre TEXT,
        motivo_consulta TEXT,
        enfermedad_actual TEXT,
        antecedentes_personales TEXT,
        antecedentes_familiares TEXT,
        antecedentes_odontologicos TEXT,
        diagnosticos TEXT,
        plan_tratamiento TEXT,
        FOREIGN KEY (paciente_id) REFERENCES pacientes (id) ON DELETE CASCADE
    )`);

	// 3. TABLA DE EVOLUCIONES
	// Registra el progreso clínico del paciente a lo largo del tiempo.
	// En database.js
	db.run(`CREATE TABLE IF NOT EXISTS evoluciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    paciente_id INTEGER, 
    fecha TEXT,
    descripcion_evolucion TEXT,
    firma_odontologo TEXT,
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE
)`);

	// 4. TABLA DE CITAS
	// Gestiona la programación de consultas en el sistema.
	// Dentro de db.serialize en database.js
	db.run(`CREATE TABLE IF NOT EXISTS citas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    paciente_id INTEGER,
    fecha TEXT,
    hora TEXT,
    motivo TEXT,
    estado TEXT DEFAULT 'Pendiente', 
    
    FOREIGN KEY (paciente_id) REFERENCES pacientes (id) ON DELETE CASCADE
)`);
});

// Exporta la conexión de la base de datos para que otros módulos (controladores)
// puedan realizar consultas y operaciones sobre estas tablas.
module.exports = db;
