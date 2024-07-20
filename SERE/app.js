require('dotenv').config({ path: __dirname + '/.env' });
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const path = require("path");
const staticRoutes = require("./routes/staticRoutes"); // Importa las rutas estáticas
const formRoutes = require("./routes/formRoutes"); // Importa las rutas de manejo de formularios
const getRoutes = require("./routes/getRoutes")

const app = express();

// Establecer la carpeta 'views' para las plantillas
app.set("views", path.join(__dirname, "views"));

// Configurar EJS como motor de plantillas
app.set("view engine", "ejs");

// Middleware para permitir CORS
app.use(cors());

// Middleware de sesión
app.use(
  session({
    secret: "secretoSERE", // Clave secreta para firmar la sesión
    resave: false,
    saveUninitialized: false,
  })
);

// Middleware para servir archivos estáticos
const frontendPath = path.join(__dirname, 'public'); // Ajusta esto según la estructura de tu proyecto
app.use(express.static(frontendPath));

// Middleware para las rutas estáticas
app.use(staticRoutes);

// Middleware para las rutas de manejo de formularios
app.use(formRoutes);

// Middleware para las rutas GET
app.use(getRoutes);

module.exports = app; 
