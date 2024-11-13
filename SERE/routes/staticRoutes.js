const express = require("express");
const path = require("path");

const app = express();
const router = express.Router();

// Define la ruta a los archivos estáticos del frontend
const frontendPath = path.join(__dirname, "..", "views");

// Middleware para servir archivos estáticos
router.use(express.static(frontendPath));

// Middleware para verificar si el usuario ha iniciado sesión
const verificarAutenticacion = (req, res, next) => {
  if (req.session.usuario) {
    // Si el usuario está autenticado, continuar con la solicitud
    next();
  } else {
    // Si el usuario no está autenticado, redirigir al formulario de inicio de sesión
    res.redirect("/sere/login");
  }
};

// Ruta para cerrar sesión
router.get("/logout", (req, res) => {
  // Eliminar la sesión del usuario
  req.session.destroy((err) => {
    if (err) {
      console.error("Error al cerrar sesión:", err);
      res.status(500).send("Error interno del servidor");
      return;
    }
    // Redirigir al usuario al formulario de inicio de sesión después de cerrar sesión
    res.redirect("/sere/login");
  });
});

// router.get("/AltaUsuario", (req, res) => {
//   res.sendFile(path.join(frontendPath, "html", "Alta-Usuarios.html"));
// });

module.exports = router;