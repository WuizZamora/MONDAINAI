const express = require("express");
const bodyParser = require("body-parser");
const authController = require("../controllers/authController");
const clientController = require("../controllers/clientRequestController");
const dispatchController = require("../controllers/dispatchManagementController");

const router = express.Router();

// Middleware para parsear el cuerpo de las solicitudes POST
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());
// AUTENTIFICACIONES, ALTAS NUEVOS USUARIOS, ETC.
router.post("/AltaUsuario", authController.altaUsuario);
router.get("/getNombrePorRFC/:rfc", authController.getNombrePorRFC);
router.post("/updatePerfil", authController.updatePerfil);
router.post("/login", authController.login);
router.post("/PreAlta", authController.PreAlta);
// ALTA SOLICITUD CLIENTE 
router.post("/AltaInfoEmpresaDespacho", clientController.AltaInfoEmpresaDespacho);
router.post("/guardar-datos", clientController.guardarDatos);
router.post("/guardar-contactos", clientController.guardarContactos);
router.post("/guardar-EdoDeCuenta", clientController.guardarEdoDeCuenta);
router.post("/guardar-HistorialPagos", clientController.guardarHistorialPagos);
router.post("/guardar-DocumentosDescripcion", clientController.guardarDocumentosDescripcion);

// VERIFICACION, RETROALIMENTACION Y VALIDACIONES CLIENTE
router.post("/ValidarCotizacion", clientController.ValidarCotizacion);
router.post("/ValidarGastosHonorarios", clientController.ValidarGastosHonorarios);
router.post("/ValidarImportes", clientController.ValidarImportes);

// COMUNICACION BIDIRECCIONAL ENTRE CLIENTE Y DESPACHO
router.post("/Comentarios", clientController.Comentarios);
router.post("/ComentariosAccion", clientController.ComentariosAccion);

router.post("/asignarCaso", dispatchController.asignarCaso);
router.post("/actualizar-caso", dispatchController.actualizarCaso);
router.post("/Plazos", dispatchController.Plazos);
router.post("/Garantia", dispatchController.Garantia);
router.post("/ProcesoJudicial", dispatchController.ProcesoJudicial);
router.post("/Pagares", dispatchController.Pagares);
router.post("/cotizacion", dispatchController.cotizacion);
router.post("/CostosHonorarios", dispatchController.CostosHonorarios);
router.post("/Importes", dispatchController.Importes);
router.post("/EstadoDelCaso", dispatchController.EstadoDelCaso);
router.post("/DocumentosProcesales", dispatchController.DocumentosProcesales);
router.post("/Incobrabilidad", dispatchController.Incobrabilidad);

// Middleware de manejo de errores
router.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Algo salió mal en sere.');
});

module.exports = router;