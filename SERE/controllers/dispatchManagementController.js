const pool = require("../config/database"); // Importa la conexión a la base de datos
const { createUploadDirForUser } = require("./uploadController");
const multer = require("multer");

// ANALIZA Y ENVÍA CORRECCIÓN DEL MÉTODO PARA LLEVAR A CABO LA CUENTA
exports.actualizarCaso = (req, res) => {
  const { idCuenta, tipoDeCaso } = req.body;

  const query =
    "UPDATE Cliente_InfGeneralCuenta SET TipoDeCaso = ? WHERE IDCuenta = ?";
  pool.query(query, [tipoDeCaso, idCuenta], (err, result) => {
    if (err) {
      console.error("Error updating the case type:", err);
      return res.json({ success: false });
    }
    res.json({ success: true });
  });
};

// DESPACHO ANALIZA EL CASO Y ASIGNA UNA COTIZACIÓN
exports.cotizacion = [
  (req, res, next) => {
    const IDCuenta = req.query.IDCuenta;
    const upload = createUploadDirForUser(IDCuenta);
    const uploadHandler = upload.fields([{ name: "Cotizacion", maxCount: 1 }]);

    uploadHandler(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: err.message });
      } else if (err) {
        return res.status(500).json({ error: err.message });
      }
      next();
    });
  },
  (req, res) => {
    try {
      const datos = req.body;
      // console.log(datos);
      const { ID, RFC, TipoDeCaso, Comentarios, fechaCotizacion, validacion} = req.body;
      const IDCuenta = req.query.IDCuenta;
      const cotizacion = req.files["Cotizacion"]
        ? req.files["Cotizacion"][0].filename
        : "N/A";
      const rutaCotizacion = `uploads/${IDCuenta}/${cotizacion}`;
      // console.log(rutaCotizacion);
      // Guardar rutaCotizacion en la base de datos
      pool.query(
        "INSERT INTO Despacho_Cotizacion(IDCuenta, RFCDespacho, TipoDeCaso, Comentarios, Cotizacion, FechaCotizacion) VALUES (?, ?, ?, ?, ?, ?)",
        [
          ID,
          RFC,
          TipoDeCaso,
          Comentarios,
          rutaCotizacion,
          fechaCotizacion
        ],
        (error, results) => {
          if (error) {
            console.error("Error ejecutando la consulta:", error.stack);
            return res.status(500).send("Error en el servidor");
          }
          res.status(201).send({
            message: "Datos insertados correctamente",
            id: results.insertId,
          });
        }
      );
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
];

// DESPACHO ASIGNA A SUS ABOGADOS ASOCIADOS AL RFC UN CASO CON COTIZACIÓN VALIDADA
exports.asignarCaso = (req, res) => {
  const {
    IDCuenta,
    AbogadoResponsable,
    AbogadoAsistente,
    EstadoDeCuenta,
    FechaDeCierre,
  } = req.body;

  const query = `
      INSERT INTO Despacho_AsignacionDeCaso (IDCuenta, AbogadoResponsable, AbogadoAsistente, EstadoDeCuenta, FechaDeCierre)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        AbogadoResponsable = VALUES(AbogadoResponsable),
        AbogadoAsistente = VALUES(AbogadoAsistente),
        EstadoDeCuenta = VALUES(EstadoDeCuenta),
        FechaDeCierre = VALUES(FechaDeCierre)
    `;

  const fechaCierreValue = FechaDeCierre ? FechaDeCierre : null;

  pool.query(
    query,
    [
      IDCuenta,
      AbogadoResponsable,
      AbogadoAsistente,
      EstadoDeCuenta,
      fechaCierreValue,
    ],
    (error, results) => {
      if (error) {
        console.error("Error ejecutando la consulta:", error);
        return res
          .status(500)
          .json({ success: false, message: "Error interno del servidor" });
      }

      res.json({ success: true, message: "Caso asignado exitosamente" });
    }
  );
};

// AÑADE TIPO DE COSTOS Y/O HONORARIOS ADICIONALES
exports.CostosHonorarios = [
  (req, res, next) => {
    const IDCuenta = req.query.IDCuenta;

    const upload = createUploadDirForUser(IDCuenta);

    const uploadHandler = upload.fields([
      { name: "soporteCostoHonorario", maxCount: 1 },
    ]);

    uploadHandler(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: err.message });
      } else if (err) {
        return res.status(500).json({ error: err.message });
      }
      next();
    });
  },
  (req, res) => {
    try {
      const { ID, TipoCosto, descripcion, cantidad, fecha, RFC } = req.body;
      const IDCuenta = req.query.IDCuenta;
      const SoporteCosto = req.files["soporteCostoHonorario"]
        ? req.files["soporteCostoHonorario"][0].filename
        : "N/A";
      const rutaSoporteCosto = `uploads/${IDCuenta}/${SoporteCosto}`;
      const query = `
      INSERT INTO Despacho_CostosHonorarios (IDCuenta, TipoDeCosto, Cantidad, Descripcion, FechaCostoHonorario, RFCDespacho, Soporte)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      pool.query(
        query,
        [
          ID,
          TipoCosto,
          parseFloat(cantidad),
          descripcion,
          fecha,
          RFC,
          rutaSoporteCosto,
        ],
        (error, results) => {
          if (error) {
            console.error("Error ejecutando la consulta:", error.stack);
            return res.status(500).send("Error en el servidor");
          }
          res.status(201).send({
            message: "Datos insertados correctamente",
            id: results.insertId,
          });
        }
      );
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
];

//AÑADE IMPORTE RECUPERADOS
exports.Importes = [
  (req, res, next) => {
    const IDCuenta = req.query.IDCuenta;

    const upload = createUploadDirForUser(IDCuenta);

    const uploadHandler = upload.fields([
      { name: "SoporteImporte", maxCount: 1 },
    ]);

    uploadHandler(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: err.message });
      } else if (err) {
        return res.status(500).json({ error: err.message });
      }
      next();
    });
  },
  (req, res) => {
    try {
      const {
        RFC,
        ImporteRecuperado,
        ImporteRestante,
        ObservacionesImporte,
        fecha,
      } = req.body;
      const IDCuenta = req.query.IDCuenta;
      const SoporteImporte = req.files["SoporteImporte"]
        ? req.files["SoporteImporte"][0].filename
        : "N/A";
      const rutaSoporteImporte = `uploads/${IDCuenta}/${SoporteImporte}`;

      // Aquí realizamos la inserción en la base de datos
      const query = `
          INSERT INTO Despacho_ImporteRecuperado (
            IDCuenta, RFCDespacho, ImporteRecuperado, ImporteRestante, Observaciones, FechaImporteRecuperado, Soporte
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

      const values = [
        IDCuenta,
        RFC,
        ImporteRecuperado,
        ImporteRestante,
        ObservacionesImporte,
        fecha,
        rutaSoporteImporte,
      ];

      pool.query(query, values, (err, results) => {
        if (err) {
          console.error("Error inserting data:", err.stack);
          return res.status(500).json({ error: "Database error" });
        }
        res.status(200).json({ message: "OK" }); // Aquí enviamos una respuesta JSON
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
];

// INFORMAR SOBRE PLAZOS Y FECHAS IMPORTANTES
exports.Plazos = (req, res) => {
  const IDCuenta = req.query.IDCuenta;
  const { RFC, FechaPlazo, Descripcion, fecha } = req.body;

  if (!IDCuenta || !RFC || !FechaPlazo || !Descripcion || !fecha) {
    return res.status(400).send("Faltan datos en la petición");
  }

  const query = `
      INSERT INTO Despacho_PlazosFechasLimite (IDCuenta, RFCDespacho, FechaPlazoFecha, Descripcion, FechaRegistroPlazo)
      VALUES (?, ?, ?, ?, ?)
    `;

  pool.query(
    query,
    [IDCuenta, RFC, FechaPlazo, Descripcion, fecha],
    (err, results) => {
      if (err) {
        console.error("Error ejecutando la consulta:", err);
        return res.status(500).send("Error en el servidor");
      }
      res.status(200).json({ message: "OK" }); // Aquí enviamos una respuesta JSON
    }
  );
};

// RETROALIMENTA LA GARANTÍA PROPORCIONADA EN EL ALTA
exports.Garantia = (req, res) => {
  const data = req.body;
  // console.log(data);

  const { ID, RFC, TipoGarantia, Documento, fecha, Retroalimentacion } = data;

  // Asumiendo que IDCuenta es el valor de ID
  const query = `INSERT INTO Despacho_Garantia (IDCuenta, RFCDespacho, TipoGarantia, DocumentoSoporte, FechaRegistro, RetroAlimentacion) VALUES (?, ?, ?, ?, ?, ?)`;

  const values = [ID, RFC, TipoGarantia, Documento, fecha, Retroalimentacion];

  pool.query(query, values, (err, results) => {
    if (err) {
      console.error("Error inserting data into Despacho_Garantia:", err);
      res.status(500).send("Error inserting data");
      return;
    }
    res.status(200).json({ message: "OK" }); // Aquí enviamos una respuesta JSON
  });
};

// AGREGA INFORMACIÓN DEL CASO, EXPEDIENTE, JURISDICCIÓN, ETC.
exports.ProcesoJudicial = (req, res) => {
  const { ID, RFC, Expediente, Juzgado, Jurisdiccion, fecha, estadoDelCaso } =
    req.body;

  const query = `INSERT INTO Despacho_ProcesoJudicial (IDCuenta, RFCDespacho, Expediente, Juzgado, Jurisdiccion, FechaRegistro, EstadoDelCaso) VALUES (?, ?, ?, ?, ?, ?, ?)`;

  pool.query(
    query,
    [ID, RFC, Expediente, Juzgado, Jurisdiccion, fecha, estadoDelCaso],
    (error, results) => {
      if (error) {
        console.error("Error ejecutando la consulta: " + error.stack);
        res.status(500).send("Error al guardar en la base de datos");
        return;
      }
      res.status(200).json({ message: "OK" }); // Aquí enviamos una respuesta JSON
    }
  );
};

// SI LAS GARANTÍAS SON TÍTULOS DE CRÉDITO, EL DESPACHO COMPLETA LA INFORMACIÓN
exports.Pagares = (req, res) => {
  const data = req.body;
  const IDCuenta = req.query.IDCuenta;
  // Iniciar la transacción con el pool
  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error al conectar con la base de datos:", err);
      return res
        .status(500)
        .json({ error: "Error de conexión con la base de datos" });
    }

    // Iniciar la transacción
    connection.beginTransaction((err) => {
      if (err) {
        console.error("Error al iniciar la transacción:", err);
        connection.release();
        return res
          .status(500)
          .json({ error: "Error al iniciar la transacción" });
      }

      // Insertar en la tabla Pagares
      connection.query(
        "INSERT INTO Pagares (IDCuenta, RFCDespacho, FechaPrescripcion, Importe, FechaSuscripcion, FechaVencimiento, Monto, Interes, fechaHoraPagare) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          IDCuenta,
          data.RFC,
          data.FechaPrescripcion,
          data.Importe,
          data.FechaSuscripcion,
          data.FechaVencimiento,
          data.Monto,
          data.Interes,
          data.fecha,
        ],
        (err, results) => {
          if (err) {
            connection.rollback(() => {
              console.error("Error al insertar en Pagares:", err);
              connection.release();
              return res
                .status(500)
                .json({ error: "Error al insertar en Pagares" });
            });
          }

          const PagarID = results.insertId; // Obtener el ID generado

          // Insertar suscriptores
          if (data.suscriptores && data.suscriptores.length > 0) {
            const suscriptoresValues = data.suscriptores.map((suscriptor) => [
              PagarID,
              suscriptor.NombreSuscriptor,
              suscriptor.DomicilioSuscriptor,
            ]);
            connection.query(
              "INSERT INTO Suscriptores (PagarID, NombreSuscriptor, DomicilioSuscriptor) VALUES ?",
              [suscriptoresValues],
              (err, results) => {
                if (err) {
                  connection.rollback(() => {
                    console.error("Error al insertar suscriptores:", err);
                    connection.release();
                    return res
                      .status(500)
                      .json({ error: "Error al insertar suscriptores" });
                  });
                }

                // Insertar avales
                if (data.avales && data.avales.length > 0) {
                  const avalesValues = data.avales.map((aval) => [
                    PagarID,
                    aval.NombreAval,
                    aval.DireccionAval,
                  ]);
                  connection.query(
                    "INSERT INTO Avales (PagarID, NombreAval, DireccionAval) VALUES ?",
                    [avalesValues],
                    (err, results) => {
                      if (err) {
                        connection.rollback(() => {
                          console.error("Error al insertar avales:", err);
                          connection.release();
                          return res
                            .status(500)
                            .json({ error: "Error al insertar avales" });
                        });
                      }

                      // Commit si todo ha ido bien
                      connection.commit((err) => {
                        if (err) {
                          connection.rollback(() => {
                            console.error("Error al hacer commit:", err);
                            connection.release();
                            return res
                              .status(500)
                              .json({ error: "Error al hacer commit" });
                          });
                        }

                        // console.log('Transacción completada.');
                        connection.release();
                        res.status(200).json({ message: "OK" });
                      });
                    }
                  );
                } else {
                  // Commit si no hay avales
                  connection.commit((err) => {
                    if (err) {
                      connection.rollback(() => {
                        console.error("Error al hacer commit:", err);
                        connection.release();
                        return res
                          .status(500)
                          .json({ error: "Error al hacer commit" });
                      });
                    }
                    // console.log('Transacción completada.');
                    connection.release();
                    res.status(200).json({ message: "OK" });
                  });
                }
              }
            );
          } else {
            // Commit si no hay suscriptores ni avales
            connection.commit((err) => {
              if (err) {
                connection.rollback(() => {
                  console.error("Error al hacer commit:", err);
                  connection.release();
                  return res
                    .status(500)
                    .json({ error: "Error al hacer commit" });
                });
              }

              connection.release();
              res.status(200).json({ message: "OK" });
            });
          }
        }
      );
    });
  });
};

// AÑADE INFORMACIÓN DE PRÓXIMAS ACCIONES.
exports.EstadoDelCaso = [
  (req, res, next) => {
    const IDCuenta = req.query.IDCuenta;

    const upload = createUploadDirForUser(IDCuenta);

    const uploadHandler = upload.fields([
      { name: "SoporteActuaciones", maxCount: 1 },
    ]);

    uploadHandler(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: err.message });
      } else if (err) {
        return res.status(500).json({ error: err.message });
      }
      next();
    });
  },
  (req, res) => {
    try {
      const IDCuenta = req.query.IDCuenta;
      const {
        RFC,
        FechaProximasAcciones,
        ProximasAcciones,
        fechaHoraActual,
        IDProcesoJudicial,
      } = req.body;
      const SoporteActuaciones = req.files["SoporteActuaciones"]
        ? req.files["SoporteActuaciones"][0].filename
        : "N/A";
      const rutaSoporteActuaciones = `uploads/${IDCuenta}/${SoporteActuaciones}`;

      // Aquí realizamos la inserción en la base de datos
      const query = `
    INSERT INTO Despacho_GestionCaso (
      IDCuenta, RFCDespacho, FechaProximaAccion, ProximasAcciones, SoporteActuaciones, FechaRegistro, IDProcesoJudicial
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
      const values = [
        IDCuenta,
        RFC,
        FechaProximasAcciones,
        ProximasAcciones,
        rutaSoporteActuaciones,
        fechaHoraActual,
        IDProcesoJudicial,
      ];

      pool.query(query, values, (err, results) => {
        if (err) {
          console.error("Error inserting data:", err.stack);
          return res.status(500).json({ error: "Database error" });
        }
        res.status(200).json({ message: "OK" }); // Aquí enviamos una respuesta JSON
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
];

//AÑADE DOCUMENTOS PROCESALES
exports.DocumentosProcesales = [
  (req, res, next) => {
    const IDCuenta = req.query.IDCuenta;

    const upload = createUploadDirForUser(IDCuenta);

    const uploadHandler = upload.fields([
      { name: "DocumentosProcesales", maxCount: 1 },
    ]);

    uploadHandler(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: err.message });
      } else if (err) {
        return res.status(500).json({ error: err.message });
      }
      next();
    });
  },
  (req, res) => {
    try {
      const IDCuenta = req.query.IDCuenta;
      const { RFC, IDProcesoJudicial, fechaHoraActual } = req.body;
      const SoporteDocumentos = req.files["DocumentosProcesales"]
        ? req.files["DocumentosProcesales"][0].filename
        : "N/A";
      const rutaSoporteDocumentos = `uploads/${IDCuenta}/${SoporteDocumentos}`;

      // Inserción en la base de datos
      const query = `INSERT INTO Despacho_DocumentosProcesales 
                     (IDCuenta, RFCDespacho, DocumentosProcesales, FechaRegistro, IDProcesoJudicial) 
                     VALUES (?, ?, ?, ?, ?)`;
      const values = [
        IDCuenta,
        RFC,
        rutaSoporteDocumentos,
        fechaHoraActual,
        IDProcesoJudicial,
      ];

      pool.query(query, values, (error, results) => {
        if (error) {
          return res.status(500).json({ error: error.message });
        }
        res.status(200).json({ message: "OK" });
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
];

// APARTADO PARA CUENTAS INCOBRABLES
exports.Incobrabilidad = [
  (req, res, next) => {
    const IDCuenta = req.query.IDCuenta;

    const upload = createUploadDirForUser(IDCuenta);

    const uploadHandler = upload.fields([{ name: "Formato", maxCount: 1 }]);

    uploadHandler(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: err.message });
      } else if (err) {
        return res.status(500).json({ error: err.message });
      }
      next();
    });
  },
  (req, res) => {
    try {
      const IDCuenta = req.query.IDCuenta;
      const formData = req.body;
      const SoporteFormato = req.files["Formato"]
        ? req.files["Formato"][0].filename
        : "N/A";
      const rutaFormato = `uploads/${IDCuenta}/${SoporteFormato}`;
      const { ComentariosFormato, RFC, Id, FechaRegistro } = formData;

      // Crear la consulta SQL para insertar en la tabla Despacho_Incobrabilidad
      const insertQuery = `
        INSERT INTO Despacho_Incobrabilidad (IDCuenta, RFCDespacho, FormatoIncobrabilidad, Comentarios, FechaRegistro)
        VALUES (?, ?, ?, ?, ?)
      `;

      // Ejecutar la consulta SQL con los valores correspondientes
      pool.query(
        insertQuery,
        [Id, RFC, rutaFormato, ComentariosFormato, FechaRegistro],
        (error, results) => {
          if (error) {
            console.error(
              "Error al insertar en Despacho_Incobrabilidad:",
              error
            );
            return res
              .status(500)
              .json({ error: "Error interno al guardar los datos" });
          }
          res
            .status(200)
            .json({ message: "Datos recibidos y guardados correctamente" });
        }
      );
    } catch (error) {
      console.error("Error en el manejo de la solicitud:", error);
      res.status(500).json({ error: error.message });
    }
  },
];
