const pool = require("../config/database");
const express = require("express");
const ejs = require("ejs");
const path = require("path");
const app = express();
const moment = require('moment');

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

          // Consulta SQL para obtener los datos de historial de pagos asociados a la cuenta
          const historialDePagosQuery = `
            SELECT *
            FROM Cliente_HistorialDePagos
            WHERE IDCuenta = ?
          `;

          // Ejecutar la consulta SQL para obtener los datos de historial de pagos asociados a la cuenta
          pool.query(
            historialDePagosQuery,
            [id],
            (err, historialDePagos) => {
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
                      .send(
                        "Error al obtener los datos de documentación extra"
                      );
                    return;
                  }

                  // Renderizar la plantilla EJS y pasar los datos recuperados
                  res.render("datos", {
                    datos: results[0],
                    contactos: contactos,
                    montosDeDeuda: montosDeDeuda,
                    estadoDeCuenta: estadoDeCuenta,
                    historialDePagos: historialDePagos,
                    documentacionExtra: documentacionExtra,
                  });
                }
              );
            }
          );
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

app.get("/hola2",obtenerDatosDeudor, (req, res) => {
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

  pool.query(queryDeuda, [idCuenta], (error, resultsDeuda) => {
    if (error) {
      console.error("Error executing query:", error);
      res.status(500).send("Error en el servidor");
      return;
    }

    const totalDeuda = resultsDeuda[0].totalDeuda || 0; // Si no hay deudas, el total es 0
    const montoSinIVA = totalDeuda / 1.16; // Calcula el monto sin IVA

    pool.query(queryGarantia, [idCuenta], (error, resultsGarantia) => {
      if (error) {
        console.error("Error executing query:", error);
        res.status(500).send("Error en el servidor");
        return;
      }

      // Manejo de caso cuando no se encuentran datos de garantía
      let TipoGarantia = "";
      let RutaDocumentacionLegal = "";

      if (resultsGarantia.length > 0) {
        TipoGarantia = resultsGarantia[0].TipoGarantia;
        RutaDocumentacionLegal = resultsGarantia[0].RutaDocumentacionLegal;
      }

      res.render("hola2", {
        idCuenta,
        totalDeuda,
        montoSinIVA,
        RFC,
        IDPerfil,
        TipoGarantia,
        RutaDocumentacionLegal,
      });
    });
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
    results = results.map(row => {
      return {
        ...row,
        FechaPlazoFecha: moment(row.FechaPlazoFecha).format('YYYY-MM-DD'),
        FechaRegistroPlazo: moment(row.FechaRegistroPlazo).format('YYYY-MM-DD HH:mm:ss')
      };
    });

    res.json({ resultados: results, IDPerfil: IDPerfil });
  });
});

app.get("/ObtenerGarantia", (req, res) => {
  const { IDPerfil } = req.session.usuario;
  const IDCuenta = req.query.IDCuenta; // Obtener el ID de cuenta de la solicitud
  const query = "SELECT * FROM Despacho_Garantia WHERE IDCuenta = ?"; // Consulta SQL modificada
  pool.query(query, [IDCuenta], (error, results) => {
    if (error) {
      console.error("Error ejecutando la consulta:", error.stack);
      return res.status(500).send("Error en el servidor");
    }

    // Formatear las fechas
    results = results.map(row => {
      return {
        ...row,
        FechaRegistro: moment(row.FechaRegistroPlazo).format('YYYY-MM-DD HH:mm:ss')
      };
    });

    res.json({ resultados: results, IDPerfil: IDPerfil });
  });
});

app.get("/hola3",obtenerDatosDeudor ,(req, res) => {
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
  const query = "SELECT * FROM Despacho_ProcesoJudicial WHERE IDCuenta = ?"; // Consulta SQL modificada
  pool.query(query, [IDCuenta], (error, results) => {
    if (error) {
      console.error("Error ejecutando la consulta:", error.stack);
      return res.status(500).send("Error en el servidor");
    }

    // Formatear las fechas
    results = results.map(row => {
      return {
        ...row,
        FechaRegistro: moment(row.FechaRegistroPlazo).format('YYYY-MM-DD HH:mm:ss')
      };
    });

    res.json({ resultados: results, IDPerfil: IDPerfil });
  });
});

app.get("/hola4",obtenerDatosDeudor, (req, res) => {
  const { RFC, IDPerfil } = req.session.usuario;
  const idCuenta = req.query.IDCuenta;
  if (!idCuenta) {
    res.status(400).send("IDCuenta es requerido");
    return;
  }
 
    res.render("hola4", { idCuenta, RFC, IDPerfil});
});

module.exports = app;
