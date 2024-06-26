const express = require("express");
const ejs = require("ejs");
const path = require("path");
const app = express();
const PORT = 3000;

// Middleware para analizar JSON y datos de formulario
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Aquí indicas la carpeta que contiene los archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

app.set("views", path.join(__dirname, "views"));

// Configurar EJS como motor de plantillas
app.set("view engine", "ejs");
// Importamos las aplicaciones
const secieApp = require("./SECIE/app");
const sereApp = require("./SERE/app"); // Asegúrate de que la ruta sea correcta

// Montamos cada aplicación en un subdirectorio
app.use("/secie", secieApp);
app.use("/sere", sereApp);

// Página de inicio para seleccionar la aplicación
app.get("/", (req, res) => {
  res.render("index");
});

app.get("/Nosotros", (req, res) => {
  res.render("nosotros");
});
app.get("/Contacto", (req, res) => {
  res.render("contacto");
});
// Ruta para renderizar el header
app.get('/header', (req, res) => {
  res.render('partials/header');
});

// Ruta para renderizar el footer
app.get('/footer', (req, res) => {
  res.render('partials/footer');
});
// Middleware para manejar errores
app.use((req, res, next) => {
  res.status(404).send("Lo siento, no pudimos encontrar eso!");
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("¡Algo salió mal!");
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor principal escuchando en el puerto ${PORT}`);
});
