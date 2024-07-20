const express = require("express");
const path = require("path");
const viewClient = require("../controllers/viewClientController");
const viewConsultationClient = require("../controllers/viewConsultationClientController");
const router = express.Router();

router.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// Middleware para verificar si el usuario ha iniciado sesión
const verificarAutenticacion = (req, res, next) => {
  if (req.session.usuario) {
    // console.log(req.session.usuario);
    next();
  } else {
    res.redirect("/sere/login"); // Cambiar la ruta de redirección
  }
};

// Ruta principal
router.get("/", verificarAutenticacion, viewClient.renderIndex);
router.get("/Clientes", verificarAutenticacion, viewClient.renderClientes);
router.get("/Contingencias", verificarAutenticacion, viewClient.renderContingencias);
router.get("/AsignarRol", verificarAutenticacion, viewClient.renderAsignarRol);
router.get("/NavSere", verificarAutenticacion, viewClient.renderNavSere);
router.get("/Ejemplo", verificarAutenticacion, viewClient.renderEjemplo);
router.get("/DatosDelDeudor", verificarAutenticacion, viewClient.renderDatosDelDeudor);
router.get("/datos", verificarAutenticacion, viewClient.renderdatos);
router.get("/datos1", verificarAutenticacion, viewClient.renderdatos1);
router.get("/hola2", verificarAutenticacion, viewClient.renderhola2);
router.get("/hola3", verificarAutenticacion, viewClient.renderhola3);
router.get("/hola4", verificarAutenticacion, viewClient.renderhola4);
router.get("/hola5", verificarAutenticacion, viewClient.renderhola5);

router.get("/ObtenerCotizacion", viewConsultationClient.renderObtenerCotizacion);
router.get("/ObtenerGastosHonorarios", viewConsultationClient.renderObtenerGastosHonorarios);
router.get("/ObtenerImportes", viewConsultationClient.renderObtenerImportes);
router.get("/ObtenerPlazos", viewConsultationClient.renderObtenerPlazos);
router.get("/ObtenerGarantia", viewConsultationClient.renderObtenerGarantia);
router.get("/ObtenerPagares", viewConsultationClient.renderObtenerPagares);
router.get("/ObtenerProcesoJudicial", viewConsultationClient.renderObtenerProcesoJudicial);
router.get("/ObtenerProximasAcciones", viewConsultationClient.renderObtenerProximasAcciones);
router.get("/ObtenerDocumentosProcesales", viewConsultationClient.renderObtenerDocumentosProcesales);
router.get("/ObtenerComentarios", viewConsultationClient.renderObtenerComentarios);
router.get("/ObtenerComentariosAccion", viewConsultationClient.renderObtenerComentariosAccion);
router.get("/ObtenerIncobrabilidad", viewConsultationClient.renderObtenerIncobrabilidad);

module.exports = router;
