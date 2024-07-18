const pool = require("../config/database");
const moment = require("moment");

exports.renderIndex = (req, res) => {
  const { Nombre } = req.session.usuario;
  res.render("index", { Nombre });
};

exports.renderAsignarRol = (req, res) => {
  try {
    const { RFC, RFCAsociado, IDPerfil } = req.session.usuario;
    let query;
    let params;

    if (IDPerfil === "AM") {
      query =
        "SELECT u.RFC, u.Nombre, u.Correo, p.Nombre AS NombreEmpresa, u.IDPerfil FROM Usuarios u LEFT JOIN PreregistroDespachoEmpresa p ON u.RFCAsociado = p.RFC WHERE u.RFC != ?";
      params = [RFC];
    } else {
      query =
        "SELECT u.RFC, u.Nombre, u.Correo, p.Nombre AS NombreEmpresa, u.IDPerfil FROM Usuarios u LEFT JOIN PreregistroDespachoEmpresa p ON u.RFCAsociado = p.RFC WHERE u.RFCAsociado = ? AND u.RFC != ?";
      params = [RFCAsociado, RFC];
    }

    pool.query(query, params, (error, results) => {
      if (error) {
        console.error("Error al obtener los usuarios:", error);
        return res.status(500).send("Error al obtener los usuarios");
      }
      res.render("AsignarRol", {
        RFCAsociadoSesion: RFCAsociado,
        usuarios: results,
        IDPerfil: IDPerfil,
      });
    });
  } catch (error) {
    console.error("Error al obtener los usuarios:", error);
    res.status(500).send("Error al obtener los usuarios");
  }
};

// Ruta para renderizar el nav
exports.renderNavSere = (req, res) => {
  res.render("partials/NavSere");
};

exports.renderEjemplo = (req, res) => {
  const { RFCAsociado } = req.session.usuario;

  // Consultas SQL
  const queryDatos = `
      SELECT 
        Cliente_InfGeneralCuenta.IDCuenta, 
        Cliente_InfGeneralCuenta.FechaDeAsignacion, 
        Cliente_InfGeneralCuenta.TipoDeCaso,
        Cliente_InfDeudor.RazonSocial
      FROM 
        Cliente_InfGeneralCuenta
      JOIN 
        Cliente_InfDeudor ON Cliente_InfGeneralCuenta.IDCuenta = Cliente_InfDeudor.IDCuenta
      WHERE 
        Cliente_InfGeneralCuenta.RFCDespacho = ?
    `;

  const queryRFCAsociados = `
      SELECT RFC FROM Usuarios WHERE RFCAsociado = ?
    `;

  pool.query(queryDatos, [RFCAsociado], (error, results) => {
    if (error) {
      console.error("Error ejecutando la consulta de datos:", error);
      return res.status(500).send("Error interno del servidor");
    }

    pool.query(queryRFCAsociados, [RFCAsociado], (error, rfcResults) => {
      if (error) {
        console.error("Error ejecutando la consulta de RFC asociados:", error);
        return res.status(500).send("Error interno del servidor");
      }

      const formattedResults = results.map((result) => {
        const formattedDate = new Date(
          result.FechaDeAsignacion
        ).toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
        return {
          ...result,
          FechaDeAsignacion: formattedDate,
        };
      });

      const rfcAsociados = rfcResults.map((row) => row.RFC);

      res.render("ejemplo", { datos: formattedResults, rfcAsociados });
    });
  });
};

// Ruta para obtener los datos
exports.renderDatosDelDeudor = (req, res) => {
  const query = `
       SELECT 
      Cliente_InfGeneralCuenta.IDCuenta AS IDCuenta,
      Cliente_InfGeneralCuenta.NoClientePadre AS NumeroClientePadre,
      Cliente_InfGeneralCuenta.NoClienteHijo AS NumeroClienteHijo,
      Cliente_InfDeudor.Rfc AS RFC,
      Cliente_InfDeudor.RazonSocial AS RazonSocial
  FROM 
      Cliente_InfGeneralCuenta
  JOIN 
      Cliente_InfDeudor ON Cliente_InfGeneralCuenta.IDCuenta = Cliente_InfDeudor.IDCuenta;
  
    `;

  pool.query(query, (err, results) => {
    if (err) throw err;
    res.render("partials/DatosDelDeudor", { data: results });
  });
};

// Función para formatear nombres de campos
function formatFieldName(fieldName) {
  // Convertir CamelCase a palabras separadas
  return fieldName
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2")
    .toUpperCase();
}

// Función para obtener el nombre de la tabla asociada a un campo
function getTableName(key) {
  switch (key) {
    // Cliente_InfGeneralCuenta
    case "IDCuenta":
    case "NoClientePadre":
    case "NoClienteHijo":
    case "TipoDeCaso":
    case "FechaDeAsignacion":
    case "RFCUsuario":
    case "RFCDespacho":
      return "Cliente_InfGeneralCuenta";

    // Cliente_InfDeudor
    case "RegimenDeudor":
    case "DireccionComercial":
    case "PoderNotarial":
    case "PoderNotarialDetalle":
    case "DomicilioFiscal":
    case "DomicilioPersonal":
    case "DomicilioLaboral":
    case "RazonSocial":
    case "Rfc":
    case "Curp":
    case "DomicilioEntrega":
    case "DomicilioAlternativo":
    case "ViaPrincipalDeContacto":
    case "DomicilioConfirmado":
    case "FechaValidacion":
    case "NumeroCelular":
    case "TelefonoFijoUno":
    case "TelefonoFijoDos":
    case "Correo":
      return "Cliente_InfDeudor";

    // Cliente_VariablesDeRiesgo
    case "TipoDeuda":
    case "TipoGarantia":
    case "OtroTipoGarantia":
    case "DocumentacionLegal":
    case "RutaDocumentacionLegal":
    case "DescripcionDañosReclamados":
    case "DocumentacionDañosReclamados":
    case "RutaDocumentacionDañosReclamados":
    case "DescripcionActitudDeudor":
    case "DocumentacionSoporteActitudDeudor":
    case "RutaDocumentacionSoporteActitudDeudor":
    case "BuroDelCliente":
    case "RutaBuroDelCliente":
    case "Banco":
    case "NumeroDeCuenta":
    case "EstadoDeCuenta":
    case "EstadoDeCuentaFile":
    case "RutaEstadoDeCuentaFile":
      return "Cliente_VariablesDeRiesgo";

    // Cliente_DescripcionDelCaso
    case "HistorialDelCaso":
    case "AccionesTomadas":
    case "CircuntanciasEspecificas":
      return "Cliente_DescripcionDelCaso";

    default:
      return "Desconocido";
  }
}

// Ruta para obtener datos de la cuenta
exports.renderdatos = (req, res) => {
  // Obtener el IDCuenta de los parámetros de la consulta
  const id = req.query.IDCuenta;

  // Consulta SQL para obtener los datos de la cuenta
  const sqlQuery = `
        SELECT *
        FROM Cliente_InfGeneralCuenta AS a
        LEFT JOIN Cliente_InfDeudor AS b ON a.IDCuenta = b.IDCuenta
        LEFT JOIN Cliente_VariablesDeRiesgo AS d ON a.IDCuenta = d.IDCuenta
        LEFT JOIN Cliente_DescripcionDelCaso AS h ON a.IDCuenta = h.IDCuenta
        WHERE a.IDCuenta = ?
    `;

  // Ejecutar la consulta SQL para obtener los datos de la cuenta
  pool.query(sqlQuery, [id], (err, results) => {
    if (err) {
      console.error("Error al ejecutar la consulta:", err);
      res.status(500).send("Error al obtener los datos");
      return;
    }
    // Formatear las fechas en los resultados
    results = results.map((row) => {
      // Asegúrate de ajustar los nombres de los campos de fecha según tu tabla
      return {
        ...row,
        FechaDeAsignacion: moment(row.FechaDeAsignacion).format("YYYY-MM-DD"),
        FechaValidacion: moment(row.FechaValidacion).format("YYYY-MM-DD"),
        // Añade más campos de fecha según sea necesario
      };
    });

    // Consulta SQL para obtener los contactos asociados a la cuenta
    const contactosQuery = `
            SELECT *
            FROM Cliente_Contactos
            WHERE IDCuenta = ?
        `;

    // Ejecutar la consulta SQL para obtener los contactos asociados a la cuenta
    pool.query(contactosQuery, [id], (err, contactos) => {
      if (err) {
        console.error("Error al ejecutar la consulta de contactos:", err);
        res.status(500).send("Error al obtener los datos de los contactos");
        return;
      }

      // Consulta SQL para obtener los montos de deuda asociados a la cuenta
      const montosDeDeudaQuery = `
                SELECT *
                FROM Cliente_MontoDeDeuda
                WHERE IDCuenta = ?
            `;

      // Ejecutar la consulta SQL para obtener los montos de deuda asociados a la cuenta
      pool.query(montosDeDeudaQuery, [id], (err, montosDeDeuda) => {
        if (err) {
          console.error(
            "Error al ejecutar la consulta de montos de deuda:",
            err
          );
          res
            .status(500)
            .send("Error al obtener los datos de los montos de deuda");
          return;
        }

        // Consulta SQL para obtener los datos de estado de cuenta asociados a la cuenta
        const estadoDeCuentaQuery = `
                    SELECT *
                    FROM Cliente_EstadoDeCuenta
                    WHERE IDCuenta = ?
                `;

        // Ejecutar la consulta SQL para obtener los datos de estado de cuenta asociados a la cuenta
        pool.query(estadoDeCuentaQuery, [id], (err, estadoDeCuenta) => {
          if (err) {
            console.error(
              "Error al ejecutar la consulta de estado de cuenta:",
              err
            );
            res
              .status(500)
              .send("Error al obtener los datos de estado de cuenta");
            return;
          }

          // Formatear las fechas en los resultados de la consulta de estado de cuenta
          estadoDeCuenta = estadoDeCuenta.map((estado) => {
            return {
              ...estado,
              FechaSoporte: moment(estado.FechaSoporte).format("YYYY-MM-DD"),
              FechSoporteVencimiento: moment(
                estado.FechSoporteVencimiento
              ).format("YYYY-MM-DD"),
              // Añade más campos de fecha según sea necesario
            };
          });

          // Consulta SQL para obtener los datos de historial de pagos asociados a la cuenta
          const historialDePagosQuery = `
                        SELECT *
                        FROM Cliente_HistorialDePagos
                        WHERE IDCuenta = ?
                    `;

          // Ejecutar la consulta SQL para obtener los datos de historial de pagos asociados a la cuenta
          pool.query(historialDePagosQuery, [id], (err, historialDePagos) => {
            if (err) {
              console.error(
                "Error al ejecutar la consulta de historial de pagos:",
                err
              );
              res
                .status(500)
                .send("Error al obtener los datos de historial de pagos");
              return;
            }

            // Formatear las fechas en los resultados de la consulta de historial de pagos
            historialDePagos = historialDePagos.map((pago) => {
              return {
                ...pago,
                FechaTransaccion: moment(pago.FechaTransaccion).format(
                  "YYYY-MM-DD"
                ),
                // Añade más campos de fecha según sea necesario
              };
            });

            // Consulta SQL para obtener los datos de documentación extra asociados a la cuenta
            const documentacionExtraQuery = `
                            SELECT *
                            FROM Cliente_DocumentacionExtra
                            WHERE IDCuenta = ?
                        `;

            // Ejecutar la consulta SQL para obtener los datos de documentación extra asociados a la cuenta
            pool.query(
              documentacionExtraQuery,
              [id],
              (err, documentacionExtra) => {
                if (err) {
                  console.error(
                    "Error al ejecutar la consulta de documentación extra:",
                    err
                  );
                  res
                    .status(500)
                    .send("Error al obtener los datos de documentación extra");
                  return;
                }

                res.render("datos", {
                  datos: results[0],
                  formatFieldName: formatFieldName,
                  getTableName: getTableName, // Añadir getTableName aquí para que esté disponible en la plantilla
                  contactos: contactos,
                  montosDeDeuda: montosDeDeuda,
                  estadoDeCuenta: estadoDeCuenta,
                  historialDePagos: historialDePagos,
                  documentacionExtra: documentacionExtra,
                });
              }
            );
          });
        });
      });
    });
  });
};

// Endpoint para obtener datos
exports.renderdatos1 = (req, res) => {
  const id = req.query.IDCuenta;

  const query = "SELECT * FROM Cliente_InfGeneralCuenta WHERE IDCuenta = ?";
  pool.query(query, [id], (err, results) => {
    if (err) {
      console.error("Error ejecutando la consulta:", err);
      res.status(500).send("Error en la consulta a la base de datos");
      return;
    }

    // console.log("Resultados de la consulta:", results); // Verificar los resultados

    // Renderiza la vista EJS y pasa los resultados
    res.render("datos1", { data: results });
  });
};

const obtenerDatosDeudor = (req, res, next) => {
  const idCuenta = req.query.IDCuenta;

  if (!idCuenta) {
    return res.status(400).send("IDCuenta es requerido");
  }

  const query = `
      SELECT 
        Cliente_InfGeneralCuenta.IDCuenta,
        Cliente_InfGeneralCuenta.NoClientePadre,
        Cliente_InfGeneralCuenta.NoClienteHijo,
        Cliente_InfDeudor.RazonSocial,
        Cliente_InfDeudor.Rfc
      FROM 
        Cliente_InfGeneralCuenta
      JOIN 
        Cliente_InfDeudor ON Cliente_InfGeneralCuenta.IDCuenta = Cliente_InfDeudor.IDCuenta
      WHERE 
        Cliente_InfGeneralCuenta.IDCuenta = ?
    `;

  pool.query(query, [idCuenta], (err, results) => {
    if (err) {
      console.error("Error ejecutando la consulta:", err.stack);
      return res.status(500).send("Error en la base de datos");
    }

    res.locals.results = results;
    next();
  });
};

exports.renderhola2 = [
  obtenerDatosDeudor,
  async (req, res) => {
    try {
      const { RFC, IDPerfil } = req.session.usuario;
      const idCuenta = req.query.IDCuenta;

      if (!idCuenta) {
        res.status(400).send("IDCuenta es requerido");
        return;
      }

      const queryDeuda = `
        SELECT SUM(AdeudoMonto) AS totalDeuda 
        FROM Cliente_MontoDeDeuda 
        WHERE IDCuenta = ?
      `;

      const queryGarantia = `
        SELECT TipoGarantia, RutaDocumentacionLegal 
        FROM Cliente_VariablesDeRiesgo 
        WHERE IDCuenta = ?
      `;

      const queryTipoCaso = `
        SELECT TipoDeCaso
        FROM Cliente_InfGeneralCuenta
        WHERE IDCuenta = ?
      `;

      const [resultsDeuda, resultsGarantia, resultsTipoCaso] =
        await Promise.all([
          new Promise((resolve, reject) => {
            pool.query(queryDeuda, [idCuenta], (error, results) => {
              if (error) {
                reject(error);
              } else {
                resolve(results);
              }
            });
          }),
          new Promise((resolve, reject) => {
            pool.query(queryGarantia, [idCuenta], (error, results) => {
              if (error) {
                reject(error);
              } else {
                resolve(results);
              }
            });
          }),
          new Promise((resolve, reject) => {
            pool.query(queryTipoCaso, [idCuenta], (error, results) => {
              if (error) {
                reject(error);
              } else {
                resolve(results);
              }
            });
          }),
        ]);

      const totalDeuda =
        (resultsDeuda.length > 0 && resultsDeuda[0].totalDeuda) || 0;
      const montoSinIVA = totalDeuda / 1.16;

      let TipoGarantia = "";
      let RutaDocumentacionLegal = "";

      if (resultsGarantia.length > 0) {
        TipoGarantia = resultsGarantia[0].TipoGarantia;
        RutaDocumentacionLegal = resultsGarantia[0].RutaDocumentacionLegal;
      }

      let TipoDeCaso = "";
      if (resultsTipoCaso.length > 0) {
        TipoDeCaso = resultsTipoCaso[0].TipoDeCaso;
      }

      res.render("hola2", {
        idCuenta,
        totalDeuda,
        montoSinIVA,
        RFC,
        IDPerfil,
        TipoGarantia,
        RutaDocumentacionLegal,
        TipoDeCaso,
      });
    } catch (error) {
      console.error("Error executing query:", error);
      res.status(500).send("Error en el servidor");
    }
  },
];

exports.renderhola3 = [
  obtenerDatosDeudor,
  (req, res) => {
    const { RFC, IDPerfil } = req.session.usuario;
    const idCuenta = req.query.IDCuenta;
    if (!idCuenta) {
      res.status(400).send("IDCuenta es requerido");
      return;
    }
    const queryGarantia = `
      SELECT TipoGarantia 
      FROM Cliente_VariablesDeRiesgo 
      WHERE IDCuenta = ?
    `;
    pool.query(queryGarantia, [idCuenta], (error, resultsGarantia) => {
      if (error) {
        console.error("Error executing query:", error);
        res.status(500).send("Error en el servidor");
        return;
      }

      // Manejo de caso cuando no se encuentran datos de garantía
      let TipoGarantia = "";

      if (resultsGarantia.length > 0) {
        TipoGarantia = resultsGarantia[0].TipoGarantia;
      }

      res.render("hola3", { idCuenta, RFC, IDPerfil, TipoGarantia });
    });
  },
];

exports.renderhola4 = [
  obtenerDatosDeudor,
  (req, res) => {
    const { RFC, IDPerfil } = req.session.usuario;
    const idCuenta = req.query.IDCuenta;
    if (!idCuenta) {
      res.status(400).send("IDCuenta es requerido");
      return;
    }

    res.render("hola4", { idCuenta, RFC, IDPerfil });
  },
];

exports.renderhola5 = [
  obtenerDatosDeudor,
  (req, res) => {
    const { RFC, IDPerfil } = req.session.usuario;
    const IDGestion = req.query.IDGestionCaso;
    const idCuenta = req.query.IDCuenta;

    if (!IDGestion) {
      res.status(400).send("IDGestion es requerido");
      return;
    }

    // Consulta SQL para obtener la información de IDGestionCaso
    const sql =
      "SELECT ProximasAcciones, FechaProximaAccion FROM Despacho_GestionCaso WHERE IDGestionCaso = ?";

    // Ejecución de la consulta SQL
    pool.query(sql, [IDGestion], (err, result) => {
      if (err) {
        console.error("Error al obtener información de la acción:", err);
        res.status(500).send("Error al obtener información de la acción");
        return;
      }

      // Si la consulta es exitosa, obtienes los datos de la acción y la fecha
      const { ProximasAcciones, FechaProximaAccion } = result[0];

      // Formatear la fecha usando Moment.js
      const formattedFechaProximaAccion =
        moment(FechaProximaAccion).format("YYYY-MM-DD");

      // Renderizar la vista hola5.ejs pasando los datos necesarios
      res.render("hola5", {
        IDGestion,
        RFC,
        IDPerfil,
        idCuenta,
        ProximasAcciones,
        FechaProximaAccion: formattedFechaProximaAccion,
      });
    });
  },
];