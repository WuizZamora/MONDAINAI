const pool = require("../config/database");
const moment = require("moment");

exports.renderIndex = (req, res) => {
  const { Nombre } = req.session.usuario;
  res.render("index", { Nombre });
};

exports.renderClientes = (req, res) => {
  res.render("Clientes");
};

exports.renderContingencias = (req, res) => {
  const { IDPerfil, Usuario_Activo } = req.session.usuario;
  res.render("Contingencias", { IDPerfil, Usuario_Activo });
};

exports.renderAltaInfGeneral = (req, res) => {
  const { RFCAsociado } = req.session.usuario;
  res.render("Alta-InfoGeneral", {RFCAsociado});
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

// VAMOS A DARLE
exports.renderEjemplo = (req, res) => {
  const { RFCAsociado, IDPerfil, RFC } = req.session.usuario;
  let queryDatos;
  let queryRFCAsociados = null;
  let queryParams = [];

  if (IDPerfil === "AD") {
    queryDatos = `
      SELECT 
        c.IDCuenta, 
        c.FechaDeAsignacion, 
        c.TipoDeCaso,
        d.RazonSocial, 
        c.RFCUsuario,
        u.Nombre AS NombreUsuario -- Añadir esta línea para obtener el nombre del usuario
      FROM 
        Cliente_InfGeneralCuenta c
      JOIN 
        Cliente_InfDeudor d ON c.IDCuenta = d.IDCuenta
      JOIN 
        Usuarios u ON c.RFCUsuario = u.RFC -- Añadir este JOIN para enlazar con la tabla Usuarios
      WHERE 
        c.RFCDespacho = ? AND EXISTS (
          SELECT 1
          FROM Despacho_Cotizacion dc
          WHERE dc.IDCuenta = c.IDCuenta
            AND dc.IDCotizacion = (
              SELECT MAX(dc2.IDCotizacion)
              FROM Despacho_Cotizacion dc2
              WHERE dc2.IDCuenta = c.IDCuenta
            )
            AND dc.Validacion = TRUE
        )
    `;
    queryRFCAsociados = `
      SELECT RFC FROM Usuarios WHERE RFCAsociado = ?
    `;
    queryParams = [RFCAsociado];
  } else if (!IDPerfil) {
    queryDatos = `
      WITH UltimosCasos AS (
        SELECT IDCuenta, MAX(IDAsignacionDeCaso) AS UltimoIDAsignacionDeCaso
        FROM Despacho_AsignacionDeCaso
        GROUP BY IDCuenta
      ),
      CasosConRFC AS (
        SELECT a.IDCuenta, a.IDAsignacionDeCaso
        FROM Despacho_AsignacionDeCaso a
        JOIN UltimosCasos u ON a.IDCuenta = u.IDCuenta AND a.IDAsignacionDeCaso = u.UltimoIDAsignacionDeCaso
        WHERE a.AbogadoResponsable = 'ZAPL0108266K7' OR a.AbogadoAsistente = 'ZAPL0108266K7'
      )
      SELECT 
        c.IDCuenta, 
        c.FechaDeAsignacion, 
        c.TipoDeCaso,
        d.RazonSocial,
        c.RFCDespacho,
        c.RFCUsuario,
        u.Nombre AS NombreUsuario, -- Añadir esta línea para obtener el nombre del usuario
        ud.Nombre AS NombreDespacho -- Añadir esta línea para obtener el nombre del usuario
      FROM 
        Cliente_InfGeneralCuenta c
      JOIN 
        Cliente_InfDeudor d ON c.IDCuenta = d.IDCuenta
      JOIN 
        Usuarios u ON c.RFCUsuario = u.RFC -- Añadir este JOIN para enlazar con la tabla Usuarios
      JOIN 
        Usuarios ud ON c.RFCDespacho = ud.RFC -- Añadir este JOIN para enlazar con la tabla Usuarios
      WHERE 
        c.IDCuenta IN (
          SELECT IDCuenta
          FROM CasosConRFC
        )
        AND EXISTS (
          SELECT 1
          FROM Despacho_Cotizacion dc
          WHERE dc.IDCuenta = c.IDCuenta
            AND dc.IDCotizacion = (
              SELECT MAX(dc2.IDCotizacion)
              FROM Despacho_Cotizacion dc2
              WHERE dc2.IDCuenta = c.IDCuenta
            )
            AND dc.Validacion = TRUE
        )
    `;
    queryParams = [];
  } else {
    queryDatos = `
      SELECT 
        c.IDCuenta, 
        c.FechaDeAsignacion, 
        c.TipoDeCaso,
        d.RazonSocial,
        c.RFCDespacho,
        u.Nombre AS NombreDespacho -- Añadir esta línea para obtener el nombre del usuario
      FROM 
        Cliente_InfGeneralCuenta c
      JOIN 
        Cliente_InfDeudor d ON c.IDCuenta = d.IDCuenta
      JOIN 
      Usuarios u ON c.RFCDespacho = u.RFC -- Añadir este JOIN para enlazar con la tabla Usuarios
      WHERE 
        c.RFCAsociado = ? AND EXISTS (
          SELECT 1
          FROM Despacho_Cotizacion dc
          WHERE dc.IDCuenta = c.IDCuenta
            AND dc.IDCotizacion = (
              SELECT MAX(dc2.IDCotizacion)
              FROM Despacho_Cotizacion dc2
              WHERE dc2.IDCuenta = c.IDCuenta
            )
            AND dc.Validacion = TRUE
        )
    `;
    queryParams = [RFCAsociado];
  }

  pool.query(queryDatos, queryParams, (error, results) => {
    if (error) {
      console.error("Error ejecutando la consulta de datos:", error);
      return res.status(500).send("Error interno del servidor");
    }

    if (queryRFCAsociados) {
      pool.query(queryRFCAsociados, [RFCAsociado], (error, rfcResults) => {
        if (error) {
          console.error(
            "Error ejecutando la consulta de RFC asociados:",
            error
          );
          return res.status(500).send("Error interno del servidor");
        }

        const formattedResults = results.map((result) => {
          return {
            ...result,
            FechaDeAsignacion: new Date(
              result.FechaDeAsignacion
            ).toLocaleDateString("es-ES", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            }),
            FechaDeCierre: result.FechaDeCierre
              ? new Date(result.FechaDeCierre).toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })
              : "N/A",
          };
        });

        const rfcAsociados = rfcResults.map((row) => row.RFC);

        res.render("ejemplo", {
          datos: formattedResults,
          rfcAsociados,
          IDPerfil,
        });
      });
    } else {
      const formattedResults = results.map((result) => {
        return {
          ...result,
          FechaDeAsignacion: new Date(
            result.FechaDeAsignacion
          ).toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          }),
          FechaDeCierre: result.FechaDeCierre
            ? new Date(result.FechaDeCierre).toLocaleDateString("es-ES", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })
            : "N/A",
        };
      });

      res.render("ejemplo", {
        datos: formattedResults,
        rfcAsociados: [],
        IDPerfil,
      });
    }
  });
};

// Ruta para obtener los datos
exports.renderDatosDelDeudor = (req, res) => {
  const { RFC, RFCAsociado, IDPerfil, Usuario_Activo} = req.session.usuario;
  let query = `
    SELECT 
      Cliente_InfGeneralCuenta.IDCuenta AS IDCuenta,
      Cliente_InfGeneralCuenta.NoClientePadre AS NumeroClientePadre,
      Cliente_InfGeneralCuenta.NoClienteHijo AS NumeroClienteHijo,
      Cliente_InfDeudor.Rfc AS RFC,
      Cliente_InfDeudor.RazonSocial AS RazonSocial,
      CASE
        WHEN (
          SELECT Validacion 
          FROM Despacho_Cotizacion 
          WHERE Despacho_Cotizacion.IDCuenta = Cliente_InfGeneralCuenta.IDCuenta
          ORDER BY Despacho_Cotizacion.IDCotizacion DESC
          LIMIT 1
        ) = TRUE THEN 'validada'
        WHEN EXISTS (
          SELECT 1 
          FROM Despacho_Cotizacion 
          WHERE Despacho_Cotizacion.IDCuenta = Cliente_InfGeneralCuenta.IDCuenta
        ) THEN 'no_validada'
        ELSE 'no_cotizacion'
      END AS EstadoCotizacion
    FROM 
      Cliente_InfGeneralCuenta
    JOIN 
      Cliente_InfDeudor ON Cliente_InfGeneralCuenta.IDCuenta = Cliente_InfDeudor.IDCuenta
  `;

  if (IDPerfil === "AD" || IDPerfil === "AM") {
    query += `WHERE Cliente_InfGeneralCuenta.RFCDespacho = ?;`;
  } else {
    query += `WHERE Cliente_InfGeneralCuenta.RFCAsociado = ?;`;
  }

  const parametro = RFCAsociado;

  pool.query(query, [parametro], (error, results) => {
    if (error) {
      console.error("Error ejecutando la consulta de datos:", error);
      return res.status(500).send("Error interno del servidor");
    }

    const formattedResults = results.map((result) => ({
      ...result,
      EstadoCotizacion: result.EstadoCotizacion,
    }));

    res.render("partials/DatosDelDeudor", {
      datos: formattedResults,
      IDPerfil, Usuario_Activo
    });
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
  const { RFC, IDPerfil } = req.session.usuario;
  const idCuenta = req.query.IDCuenta;

  const query = "SELECT * FROM Cliente_InfGeneralCuenta WHERE IDCuenta = ?";
  pool.query(query, [idCuenta], (err, results) => {
    if (err) {
      console.error("Error ejecutando la consulta:", err);
      res.status(500).send("Error en la consulta a la base de datos");
      return;
    }

    // console.log("Resultados de la consulta:", results); // Verificar los resultados

    // Renderiza la vista EJS y pasa los resultados
    res.render("datos1", { idCuenta, RFC, IDPerfil, data: results });
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

const obtenerAbogados = async (idCuenta) => {
  const queryAbogados = `
    SELECT AbogadoResponsable, AbogadoAsistente
    FROM Despacho_AsignacionDeCaso
    WHERE IDCuenta = ?
  `;

  return new Promise((resolve, reject) => {
    pool.query(queryAbogados, [idCuenta], (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
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

      const [resultsDeuda, resultsGarantia, resultsTipoCaso, resultsAbogados] =
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
          obtenerAbogados(idCuenta), // Llamada a la función para obtener abogados
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

      let AbogadoResponsable = "";
      let AbogadoAsistente = "";

      if (resultsAbogados.length > 0) {
        AbogadoResponsable = resultsAbogados[0].AbogadoResponsable;
        AbogadoAsistente = resultsAbogados[0].AbogadoAsistente;
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
        AbogadoResponsable, // Pasar el ID del abogado responsable al frontend
        AbogadoAsistente, // Pasar el ID del abogado asistente al frontend
      });
    } catch (error) {
      console.error("Error executing query:", error);
      res.status(500).send("Error en el servidor");
    }
  },
];

exports.renderhola3 = [
  obtenerDatosDeudor,
  async (req, res) => {
    try {
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

      // Obtener los datos de garantía
      const resultsGarantia = await new Promise((resolve, reject) => {
        pool.query(queryGarantia, [idCuenta], (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(results);
          }
        });
      });

      // Obtener los datos de los abogados
      const resultsAbogados = await obtenerAbogados(idCuenta);

      // Manejo de caso cuando no se encuentran datos de garantía
      let TipoGarantia = "";
      if (resultsGarantia.length > 0) {
        TipoGarantia = resultsGarantia[0].TipoGarantia;
      }

      // Manejo de caso cuando no se encuentran datos de abogados
      let AbogadoResponsable = "";
      let AbogadoAsistente = "";

      if (resultsAbogados.length > 0) {
        AbogadoResponsable = resultsAbogados[0].AbogadoResponsable;
        AbogadoAsistente = resultsAbogados[0].AbogadoAsistente;
      }

      res.render("hola3", {
        idCuenta,
        RFC,
        IDPerfil,
        TipoGarantia,
        AbogadoResponsable, // Pasar el nombre del abogado responsable al frontend
        AbogadoAsistente, // Pasar el nombre del abogado asistente al frontend
      });
    } catch (error) {
      console.error("Error executing query:", error);
      res.status(500).send("Error en el servidor");
    }
  },
];

exports.renderhola4 = [
  obtenerDatosDeudor,
  async (req, res) => {
    try {
      const { RFC, IDPerfil } = req.session.usuario;
      const idCuenta = req.query.IDCuenta;

      if (!idCuenta) {
        res.status(400).send("IDCuenta es requerido");
        return;
      }

      // Obtener los datos de los abogados
      const resultsAbogados = await obtenerAbogados(idCuenta);

      // Manejo de caso cuando no se encuentran datos de abogados
      let AbogadoResponsable = "";
      let AbogadoAsistente = "";

      if (resultsAbogados.length > 0) {
        AbogadoResponsable = resultsAbogados[0].AbogadoResponsable;
        AbogadoAsistente = resultsAbogados[0].AbogadoAsistente;
      }

      res.render("hola4", {
        idCuenta,
        RFC,
        IDPerfil,
        AbogadoResponsable, // Pasar el nombre del abogado responsable al frontend
        AbogadoAsistente, // Pasar el nombre del abogado asistente al frontend
      });
    } catch (error) {
      console.error("Error executing query:", error);
      res.status(500).send("Error en el servidor");
    }
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
