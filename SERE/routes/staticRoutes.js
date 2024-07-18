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

// Rutas que requieren autenticación
router.get("/clientes", verificarAutenticacion, (req, res) => {
  res.sendFile(path.join(frontendPath, "html", "Clientes", "Clientes.html"));
});

router.get("/Contingencias", verificarAutenticacion, (req, res) => {
  res.sendFile(
    path.join(frontendPath, "html", "Clientes", "Contingencias.html")
  );
});

router.get("/AltaInfGeneral", verificarAutenticacion, (req, res) => {
  res.sendFile(
    path.join(frontendPath, "html", "Clientes", "Alta-InfoGeneral.html")
  );
});

router.get(
  "/AltaContactosVariablesDeRiesgo",
  verificarAutenticacion,
  (req, res) => {
    res.sendFile(path.join(frontendPath, "html", "Clientes", "ejemplo.html"));
  }
);

router.get("/AltaEdoCuenta", verificarAutenticacion, (req, res) => {
  res.sendFile(
    path.join(frontendPath, "html", "Clientes", "Alta-EdoCuenta.html")
  );
});

router.get("/AltaHistorialPagos", verificarAutenticacion, (req, res) => {
  res.sendFile(
    path.join(frontendPath, "html", "Clientes", "Alta-HistorialDePagos.html")
  );
});

router.get("/AltaDescripcionDocumentos", verificarAutenticacion, (req, res) => {
  res.sendFile(
    path.join(
      frontendPath,
      "html",
      "Clientes",
      "Alta-DescripcionDocumentos.html"
    )
  );
});

router.get("/AltaUsuario", (req, res) => {
  res.sendFile(path.join(frontendPath, "html", "Alta-Usuarios.html"));
});

// Ruta para servir la página principal
// app.get("/", verificarAutenticacion, (req, res) => {
//   res.sendFile(path.join(frontendPath, "html", "index.html"));
// });

// Ruta para servir el formulario de inicio de sesión
router.get("/login", (req, res) => {
  res.sendFile(path.join(frontendPath, "html", "login.html"));
});

module.exports = router;