require('dotenv').config({ path: __dirname + '/.env' });
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const database = require("./config/database"); // Importa la conexión a la base de datos
const staticRoutes = require("./routes/staticRoutes"); // Importa las rutas estáticas
const formRoutes = require("./routes/formRoutes"); // Importa las rutas de manejo de formularios
const getRoutes = require("./routes/getRoutes")

const app = express();

// Middleware para permitir CORS
app.use(cors());

// Middleware de sesión
app.use(
  session({
    secret: "secreto", // Clave secreta para firmar la sesión
    resave: false,
    saveUninitialized: false,
  })
);

// Middleware para las rutas estáticas
app.use(staticRoutes);

// Middleware para las rutas de manejo de formularios
app.use(formRoutes);

//GET
app.use(getRoutes);

module.exports = app; // Exportar la aplicación Express