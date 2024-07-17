const pool = require("../config/database");
const express = require("express");
const ejs = require("ejs");
const path = require("path");
const app = express();
const moment = require("moment");

app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// Establecer la carpeta 'views' para las plantillas
app.set("views", path.join(__dirname, "..", "views"));

// Configurar EJS como motor de plantillas
app.set("view engine", "ejs");

// Middleware para verificar si el usuario ha iniciado sesión
const verificarAutenticacion = (req, res, next) => {
  if (req.session.usuario) {
    console.log(req.session.usuario);
    next();
  } else {
    res.redirect("/sere/login"); // Cambiar la ruta de redirección
  }
};

// Ruta para renderizar el nav
app.get("/NavSere", (req, res) => {
  res.render("partials/NavSere");
});

app.get("/", verificarAutenticacion, (req, res) => {
  // Extraer
  const { Nombre } = req.session.usuario;
  res.render("index", { Nombre });
});

app.get("/AsignarRol", verificarAutenticacion, (req, res) => {
  try {
    const { RFC, RFCAsociado, IDPerfil } = req.session.usuario;
    let query;
    let params;

    if (IDPerfil === "AM") {
      // Consulta todos los RFCs, excluyendo el RFC del usuario actual
      query =
        "SELECT u.RFC, u.Nombre, u.Correo, p.Nombre AS NombreEmpresa, u.IDPerfil FROM Usuarios u LEFT JOIN PreregistroDespachoEmpresa p ON u.RFCAsociado = p.RFC WHERE u.RFC != ?";
      params = [RFC];
    } else {
      // Consulta solo los RFCs asociados, excluyendo el RFC del usuario actual
      query =
        "SELECT u.RFC, u.Nombre, u.Correo, p.Nombre AS NombreEmpresa, u.IDPerfil FROM Usuarios u LEFT JOIN PreregistroDespachoEmpresa p ON u.RFCAsociado = p.RFC WHERE u.RFCAsociado = ? AND u.RFC != ?";
      params = [RFCAsociado, RFC];
    }

    pool.query(query, params, (error, results) => {
      if (error) {
        console.error("Error al obtener los usuarios:", error);
        return res.status(500).send("Error al obtener los usuarios");
      }
      // Renderiza la vista y pasa los resultados de la consulta
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
});

app.get("/Ejemplo", verificarAutenticacion, (req, res) => {
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
});

// Ruta para obtener los datos
app.get("/DatosDelDeudor", (req, res) => {
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
});

// Función para formatear nombres de campos
function formatFieldName(fieldName) {
  // Convertir CamelCase a palabras separadas
  return fieldName.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/([A-Z])([A-Z][a-z])/g, '$1 $2').toUpperCase();
}

// Función para obtener el nombre de la tabla asociada a un campo
function getTableName(key) {
  switch (key) {
    // Cliente_InfGeneralCuenta
    case 'IDCuenta':
    case 'NoClientePadre':
    case 'NoClienteHijo':
    case 'TipoDeCaso':
    case 'FechaDeAsignacion':
    case 'RFCUsuario':
    case 'RFCDespacho':
      return 'Cliente_InfGeneralCuenta';

    // Cliente_InfDeudor
    case 'RegimenDeudor':
    case 'DireccionComercial':
    case 'PoderNotarial':
    case 'PoderNotarialDetalle':
    case 'DomicilioFiscal':
    case 'DomicilioPersonal':
    case 'DomicilioLaboral':
    case 'RazonSocial':
    case 'Rfc':
    case 'Curp':
    case 'DomicilioEntrega':
    case 'DomicilioAlternativo':
    case 'ViaPrincipalDeContacto':
    case 'DomicilioConfirmado':
    case 'FechaValidacion':
    case 'NumeroCelular':
    case 'TelefonoFijoUno':
    case 'TelefonoFijoDos':
    case 'Correo':
      return 'Cliente_InfDeudor';

    // Cliente_VariablesDeRiesgo
    case 'TipoDeuda':
    case 'TipoGarantia':
    case 'OtroTipoGarantia':
    case 'DocumentacionLegal':
    case 'RutaDocumentacionLegal':
    case 'DescripcionDañosReclamados':
    case 'DocumentacionDañosReclamados':
    case 'RutaDocumentacionDañosReclamados':
    case 'DescripcionActitudDeudor':
    case 'DocumentacionSoporteActitudDeudor':
    case 'RutaDocumentacionSoporteActitudDeudor':
    case 'BuroDelCliente':
    case 'RutaBuroDelCliente':
    case 'Banco':
    case 'NumeroDeCuenta':
    case 'EstadoDeCuenta':
    case 'EstadoDeCuentaFile':
    case 'RutaEstadoDeCuentaFile':
      return 'Cliente_VariablesDeRiesgo';

    // Cliente_DescripcionDelCaso
    case 'HistorialDelCaso':
    case 'AccionesTomadas':
    case 'CircuntanciasEspecificas':
      return 'Cliente_DescripcionDelCaso';

    default:
      return 'Desconocido';
  }
}

// Ruta para obtener datos de la cuenta
app.get("/datos", (req, res) => {
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
              FechSoporteVencimiento: moment(estado.FechSoporteVencimiento).format("YYYY-MM-DD"),
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
          FechaTransaccion: moment(pago.FechaTransaccion).format("YYYY-MM-DD"),
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
});

// Endpoint para obtener datos
app.get("/datos1", (req, res) => {
  const id = req.query.IDCuenta;

  const query = "SELECT * FROM Cliente_InfGeneralCuenta WHERE IDCuenta = ?";
  pool.query(query, [id], (err, results) => {
    if (err) {
      console.error("Error ejecutando la consulta:", err);
      res.status(500).send("Error en la consulta a la base de datos");
      return;
    }

    console.log("Resultados de la consulta:", results); // Verificar los resultados

    // Renderiza la vista EJS y pasa los resultados
    res.render("datos1", { data: results });
  });
});

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

app.get("/hola2", obtenerDatosDeudor, (req, res) => {
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

  // Ejecutar consultas en paralelo usando Promise.all
  Promise.all([
    new Promise((resolve, reject) => {
      pool.query(queryDeuda, [idCuenta], (error, resultsDeuda) => {
        if (error) {
          reject(error);
        } else {
          resolve(resultsDeuda);
        }
      });
    }),
    new Promise((resolve, reject) => {
      pool.query(queryGarantia, [idCuenta], (error, resultsGarantia) => {
        if (error) {
          reject(error);
        } else {
          resolve(resultsGarantia);
        }
      });
    }),
    new Promise((resolve, reject) => {
      pool.query(queryTipoCaso, [idCuenta], (error, resultsTipoCaso) => {
        if (error) {
          reject(error);
        } else {
          resolve(resultsTipoCaso);
        }
      });
    })
  ])
    .then(([resultsDeuda, resultsGarantia, resultsTipoCaso]) => {
      const totalDeuda = resultsDeuda[0].totalDeuda || 0; // Si no hay deudas, el total es 0
      const montoSinIVA = totalDeuda / 1.16; // Calcula el monto sin IVA

      // Manejo de caso cuando no se encuentran datos de garantía
      let TipoGarantia = "";
      let RutaDocumentacionLegal = "";

      if (resultsGarantia.length > 0) {
        TipoGarantia = resultsGarantia[0].TipoGarantia;
        RutaDocumentacionLegal = resultsGarantia[0].RutaDocumentacionLegal;
      }

      // Obtener TipoDeCaso
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
        TipoDeCaso, // Incluir TipoDeCaso en los datos enviados al frontend
      });
    })
    .catch(error => {
      console.error("Error executing query:", error);
      res.status(500).send("Error en el servidor");
    });
});

app.get("/ObtenerIncobrabilidad", (req, res) => {
  const { IDPerfil } = req.session.usuario;
  const IDCuenta = req.query.IDCuenta; // Obtener el ID de cuenta de la solicitud
  const query = "SELECT * FROM Despacho_Incobrabilidad WHERE IDCuenta = ?"; // Consulta SQL modificada
  pool.query(query, [IDCuenta], (error, results) => {
    if (error) {
      console.error("Error ejecutando la consulta:", error.stack);
      return res.status(500).send("Error en el servidor");
    }

    // Formatear las fechas
    results = results.map((row) => {
      return {
        ...row,
        FechaRegistro: moment(row.FechaRegistroPlazo).format(
          "YYYY-MM-DD HH:mm:ss"
        ),
      };
    });

    res.json({ resultados: results, IDPerfil: IDPerfil });
  });
});

app.get("/ObtenerGastosHonorarios", (req, res) => {
  const { IDPerfil } = req.session.usuario;
  const IDCuenta = req.query.IDCuenta; // Obtener el ID de cuenta de la solicitud
  const query = "SELECT * FROM Despacho_CostosHonorarios WHERE IDCuenta = ?"; // Consulta SQL modificada
  pool.query(query, [IDCuenta], (error, results) => {
    if (error) {
      console.error("Error ejecutando la consulta:", error.stack);
      return res.status(500).send("Error en el servidor");
    }
    res.json({ resultados: results, IDPerfil: IDPerfil });
  });
});

app.get("/ObtenerImportes", (req, res) => {
  const { IDPerfil } = req.session.usuario;
  const IDCuenta = req.query.IDCuenta; // Obtener el ID de cuenta de la solicitud
  const query = "SELECT * FROM Despacho_ImporteRecuperado WHERE IDCuenta = ?"; // Consulta SQL modificada
  pool.query(query, [IDCuenta], (error, results) => {
    if (error) {
      console.error("Error ejecutando la consulta:", error.stack);
      return res.status(500).send("Error en el servidor");
    }
    res.json({ resultados: results, IDPerfil: IDPerfil });
  });
});

app.get("/ObtenerPlazos", (req, res) => {
  const { IDPerfil } = req.session.usuario;
  const IDCuenta = req.query.IDCuenta; // Obtener el ID de cuenta de la solicitud
  const query = "SELECT * FROM Despacho_PlazosFechasLimite WHERE IDCuenta = ?"; // Consulta SQL modificada
  pool.query(query, [IDCuenta], (error, results) => {
    if (error) {
      console.error("Error ejecutando la consulta:", error.stack);
      return res.status(500).send("Error en el servidor");
    }

    // Formatear las fechas
    results = results.map((row) => {
      return {
        ...row,
        FechaPlazoFecha: moment(row.FechaPlazoFecha).format("YYYY-MM-DD"),
        FechaRegistroPlazo: moment(row.FechaRegistroPlazo).format(
          "YYYY-MM-DD HH:mm:ss"
        ),
      };
    });

    res.json({ resultados: results, IDPerfil: IDPerfil });
  });
});

app.get("/ObtenerGarantia", (req, res) => {
  const { IDPerfil } = req.session.usuario;
  const IDCuenta = req.query.IDCuenta; // Obtener el ID de cuenta de la solicitud
  const query = "SELECT * FROM Despacho_Garantia WHERE IDCuenta = ?";

  pool.query(query, [IDCuenta], (error, results) => {
    if (error) {
      console.error("Error ejecutando la consulta:", error.stack);
      return res.status(500).send("Error en el servidor");
    }

    // Formatear las fechas antes de enviar la respuesta
    results = results.map((row) => {
      return {
        ...row,
        FechaRegistro: moment(row.FechaRegistro).format("YYYY-MM-DD HH:mm:ss"),
      };
    });

    res.json({ resultados: results, IDPerfil: IDPerfil });
  });
});

app.get("/hola3", obtenerDatosDeudor, (req, res) => {
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
});

app.get("/ObtenerProcesoJudicial", (req, res) => {
  const { IDPerfil } = req.session.usuario;
  const IDCuenta = req.query.IDCuenta; // Obtener el ID de cuenta de la solicitud
  const query = "SELECT * FROM Despacho_ProcesoJudicial WHERE IDCuenta = ?";
  pool.query(query, [IDCuenta], (error, results) => {
    if (error) {
      console.error("Error ejecutando la consulta:", error.stack);
      return res.status(500).send("Error en el servidor");
    }

    // Formatear las fechas
    results = results.map((row) => {
      return {
        ...row,
        FechaRegistro: moment(row.FechaRegistro).format("YYYY-MM-DD HH:mm:ss"),
      };
    });

    // Obtener IDProcesoJudicial del primer resultado (suponiendo que solo esperas un resultado)
    const IDProcesoJudicial =
      results.length > 0 ? results[0].IDProcesoJudicial : null;

    res.json({
      resultados: results,
      IDPerfil: IDPerfil,
      IDProcesoJudicial: IDProcesoJudicial,
    });
  });
});

// Ruta para obtener los pagares con sus suscriptores y avales
app.get("/ObtenerPagares", (req, res) => {
  const IDCuenta = req.query.IDCuenta;

  // Consulta SQL para obtener los pagares con sus suscriptores y avales
  const sql = `
    SELECT 
        Pagares.*,
        Suscriptores.NombreSuscriptor,
        Suscriptores.DomicilioSuscriptor,
        Avales.NombreAval,
        Avales.DireccionAval
    FROM Pagares
    LEFT JOIN Suscriptores ON Pagares.ID = Suscriptores.PagarID
    LEFT JOIN Avales ON Pagares.ID = Avales.PagarID
    WHERE Pagares.IDCuenta = ?
  `;

  // Ejecutar la consulta usando el pool de conexiones
  pool.query(sql, [IDCuenta], (error, results) => {
    if (error) {
      console.error("Error al obtener los pagares:", error);
      res.status(500).json({ error: "Error al obtener los pagares" });
      return;
    }

    // Formatear las fechas en los resultados
    results = results.map((row) => {
      return {
        ...row,
        FechaPrescripcion: row.FechaPrescripcion ? moment(row.FechaPrescripcion).format("YYYY-MM-DD") : null,
        FechaSuscripcion: row.FechaSuscripcion ? moment(row.FechaSuscripcion).format("YYYY-MM-DD") : null,
        FechaVencimiento: row.FechaVencimiento ? moment(row.FechaVencimiento).format("YYYY-MM-DD") : null,
        fechaHoraPagare: row.fechaHoraPagare ? moment(row.fechaHoraPagare).format("YYYY-MM-DD HH:mm:ss") : null,
      };
    });

    // Agrupar resultados por PagareID para manejar múltiples suscriptores y avales por pagare
    const pagaresConSuscriptoresAvales = {};
    results.forEach((row) => {
      const { ID, IDCuenta, RFCDespacho, FechaPrescripcion, Importe, FechaSuscripcion, FechaVencimiento, Monto, Interes, fechaHoraPagare, NombreSuscriptor, DomicilioSuscriptor, NombreAval, DireccionAval } = row;

      if (!pagaresConSuscriptoresAvales[ID]) {
        pagaresConSuscriptoresAvales[ID] = {
          id: ID,
          idCuenta: IDCuenta,
          rfcDespacho: RFCDespacho,
          fechaPrescripcion: FechaPrescripcion,
          importe: Importe,
          fechaSuscripcion: FechaSuscripcion,
          fechaVencimiento: FechaVencimiento,
          monto: Monto,
          interes: Interes,
          fechaHoraPagare: fechaHoraPagare,
          suscriptores: [],
          avales: [],
        };
      }

      if (NombreSuscriptor) {
        pagaresConSuscriptoresAvales[ID].suscriptores.push({
          nombre: NombreSuscriptor,
          domicilio: DomicilioSuscriptor,
        });
      }

      if (NombreAval) {
        pagaresConSuscriptoresAvales[ID].avales.push({
          nombre: NombreAval,
          direccion: DireccionAval,
        });
      }
    });

    // Convertir objeto a array para enviar como respuesta JSON
    const pagaresArray = Object.values(pagaresConSuscriptoresAvales);

    // Enviar los resultados como JSON al front-end
    res.json(pagaresArray);
  });
});

app.get("/ObtenerProximasAcciones", (req, res) => {
  const { IDProcesoJudicial } = req.query;
  const query =
    "SELECT * FROM Despacho_GestionCaso WHERE IDProcesoJudicial = ?";
  pool.query(query, [IDProcesoJudicial], (error, results) => {
    if (error) {
      console.error(
        "Error ejecutando la consulta de próximas acciones:",
        error.stack
      );
      return res.status(500).send("Error en el servidor");
    }
    // Formatear las fechas
    results = results.map((row) => {
      return {
        ...row,
        FechaRegistro: moment(row.FechaRegistro).format("YYYY-MM-DD HH:mm:ss"),
        FechaProximaAccion: moment(row.FechaProximaAccion).format("YYYY-MM-DD"),
      };
    });
    res.json({ proximasAcciones: results });
  });
});

app.get("/ObtenerDocumentosProcesales", (req, res) => {
  const { IDProcesoJudicial } = req.query;
  const query =
    "SELECT * FROM Despacho_DocumentosProcesales WHERE IDProcesoJudicial = ?";
  pool.query(query, [IDProcesoJudicial], (error, results) => {
    if (error) {
      console.error(
        "Error ejecutando la consulta de próximas acciones:",
        error.stack
      );
      return res.status(500).send("Error en el servidor");
    }
    // Formatear las fechas
    results = results.map((row) => {
      return {
        ...row,
        FechaRegistro: moment(row.FechaRegistro).format("YYYY-MM-DD HH:mm:ss"),
      };
    });
    res.json({ documentosProcesales: results });
  });
});

app.get("/hola4", obtenerDatosDeudor, (req, res) => {
  const { RFC, IDPerfil } = req.session.usuario;
  const idCuenta = req.query.IDCuenta;
  if (!idCuenta) {
    res.status(400).send("IDCuenta es requerido");
    return;
  }

  res.render("hola4", { idCuenta, RFC, IDPerfil });
});

app.get("/ObtenerComentarios", (req, res) => {
  const { IDPerfil } = req.session.usuario;
  const IDCuenta = req.query.IDCuenta; // Obtener el ID de cuenta de la solicitud
  const query = "SELECT * FROM Cliente_Retroalimentacion WHERE IDCuenta = ?";
  pool.query(query, [IDCuenta], (error, results) => {
    if (error) {
      console.error("Error ejecutando la consulta:", error.stack);
      return res.status(500).send("Error en el servidor");
    }

    // Formatear las fechas
    results = results.map((row) => {
      return {
        ...row,
        FechaRegistro: moment(row.FechaRegistro).format("YYYY-MM-DD HH:mm:ss"),
      };
    });

    res.json({ resultados: results, IDPerfil: IDPerfil });
  });
});

app.get("/hola5", (req, res) => {
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
});

app.get("/ObtenerComentariosAccion", (req, res) => {
  const { IDPerfil } = req.session.usuario;
  const IDGestion = req.query.IDGestionCaso; // Obtener el ID de cuenta de la solicitud
  const query =
    "SELECT * FROM Cliente_RetroalimentacionAccion WHERE IDGestion = ?";
  pool.query(query, [IDGestion], (error, results) => {
    if (error) {
      console.error("Error ejecutando la consulta:", error.stack);
      return res.status(500).send("Error en el servidor");
    }

    // Formatear las fechas
    results = results.map((row) => {
      return {
        ...row,
        FechaRegistro: moment(row.FechaRegistro).format("YYYY-MM-DD HH:mm:ss"),
      };
    });

    res.json({ resultados: results, IDPerfil: IDPerfil });
  });
});

module.exports = app;
