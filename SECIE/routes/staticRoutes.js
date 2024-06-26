const express = require("express");
const path = require("path");

const app = express();

// Define la ruta a los archivos estáticos del frontend
const frontendPath = path.join(__dirname, "..", "public");

// Middleware para servir archivos estáticos
app.use(express.static(frontendPath));

// Middleware para verificar si el usuario ha iniciado sesión
const verificarAutenticacion = (req, res, next) => {
  if (req.session.usuario) {
      next();
  } else {
      res.redirect("/secie/login"); // Cambiar la ruta de redirección
  }
};


app.get("/AltaUsuario", (req, res) => {
  res.sendFile(path.join(frontendPath, "html", "Alta-usuario.html"));
});

app.get("", (req, res) => {
  res.sendFile(path.join(frontendPath, "html", ""));
});

app.get("", (req, res) => {
  res.sendFile(path.join(frontendPath, "html", ""));
});
// Ruta para servir el formulario de inicio de sesión
app.get("/login", (req, res) => {
  res.sendFile(path.join(frontendPath, "html", "login.html"));
});

// Ruta para cerrar sesión
app.get("/logout", (req, res) => {
  // Eliminar la sesión del usuario
  req.session.destroy(err => {
    if (err) {
      console.error("Error al cerrar sesión:", err);
      res.status(500).send("Error interno del servidor");
      return;
    }
    // Redirigir al usuario al formulario de inicio de sesión después de cerrar sesión
    res.redirect("/secie/login");
  });
});

module.exports = app;
