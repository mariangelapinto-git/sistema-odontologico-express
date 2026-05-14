// Importa el módulo 'sqlite3' y habilita el modo 'verbose', lo que permite
// recibir trazas de ejecución más detalladas para facilitar la depuración.
const sqlite3 = require("sqlite3").verbose();

// Crea e inicializa una instancia de la base de datos apuntando al archivo local './odontologia.db'.
const db = new sqlite3.Database("./odontologia.db", (err) => {
	// Evalúa si existió algún inconveniente durante la apertura del archivo de base de datos.
	if (err) {
		// Reporta el mensaje de error específico en la consola en caso de fallo.
		console.error("Error al abrir DB:", err.message);
	} else {
		// Notifica que la conexión se ha establecido de manera satisfactoria.
		console.log("CONEXION EXITOSA");

		// Ejecuta una instrucción técnica para habilitar el soporte de claves foráneas.
		// Esto es vital para que SQLite valide las relaciones entre tablas (como Citas y Pacientes).
		// Activamos el soporte para claves foráneas
		db.run("PRAGMA foreign_keys = ON");
	}
});
