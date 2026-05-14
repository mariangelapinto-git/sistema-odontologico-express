// Importa el framework Express para la creación del servidor web.
const express = require("express");
const app = express();
// Importa el módulo 'path' para gestionar rutas de archivos y directorios de forma segura.
const path = require("path");

// Configura el middleware para que el servidor pueda procesar datos en formato JSON.
app.use(express.json()); // Permite leer JSON enviado desde el frontend
// Configura el middleware para procesar datos provenientes de formularios codificados en la URL.
app.use(express.urlencoded({ extended: true })); // Permite leer formularios

// Importar las Rutas (creadas en la carpeta /routes)
// Carga la lógica de rutas específica para el módulo de pacientes.
const pacientesRoutes = require("./routes/pacientes.routes.js");
//Usar evoluciones.controller
// ... otros imports
// Carga la lógica de rutas para el módulo de evoluciones médicas.
const evolucionesRoutes = require("./routes/evoluciones.routes");
// Define el prefijo '/api/evoluciones' para todas las rutas relacionadas con evoluciones.
app.use("/api/evoluciones", evolucionesRoutes);

// Carga la lógica de rutas para la gestión de citas.
const citasRoutes = require("./routes/citas.routes");
// Define el prefijo '/api/citas' para todas las rutas relacionadas con citas.
app.use("/api/citas", citasRoutes);

// Middleware para entender JSON y formularios (Se repite la configuración para asegurar la lectura de datos).
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configura el servidor para entregar archivos estáticos (como CSS o imágenes) desde la carpeta 'public'.
app.use(express.static(path.join(__dirname, "public")));

// 1. Conexión a la base de datos
// Al importar el archivo de configuración, se ejecutan los CREATE TABLE automáticamente.
// Este paso garantiza que la estructura de la base de datos esté lista al iniciar el servidor.
const db = require("./config/database.js");

// 2. Uso de Rutas
// Establece el punto de acceso para las operaciones de pacientes.
// Todas las rutas de pacientes empezarán con /api/pacientes
app.use("/api/pacientes", pacientesRoutes);
// Reafirma el uso de las rutas de evoluciones en el flujo de la aplicación.
app.use("/api/evoluciones", evolucionesRoutes);

// 3. Ruta de prueba para el Navegador
// Define la ruta raíz que sirve el archivo principal del frontend (index.html).
app.get("/", (req, res) => {
	res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 4. Encender el servidor
// Define el puerto de escucha y activa el servidor para recibir peticiones.
const PORT = 3000;
app.listen(PORT, () => {
	// Informa en la consola la URL local donde la aplicación está operativa.
	console.log(`Servidor corriendo en http://localhost:${PORT}`);
	// Indica al desarrollador cómo finalizar el proceso del servidor de forma manual.
	console.log("Presiona CTRL+C para detenerlo");
});
