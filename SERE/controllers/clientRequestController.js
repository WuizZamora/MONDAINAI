const multer = require("multer");
const pool = require("../config/database"); // Importa la conexión a la base de datos
const { createUploadDirForUser } = require("./uploadController");

// ALTA DE INFORMACIÓN DE FACTURACIÓN PARA CLIENTES
exports.AltaInfoEmpresaDespacho = (req, res) => {
  const { RFCAsociado } = req.session.usuario;
  const upload = createUploadDirForUser(RFCAsociado);
  const uploadHandler = upload.fields([{ name: "csf", maxCount: 1 }]);

  uploadHandler(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(500).json({ error: err.message });
    }

    const csf = req.files["csf"] ? req.files["csf"][0] : null;
    const rutaCsf = `uploads/${RFCAsociado}/${csf.filename}`;
    const { nombre, correo, cfdi, claveSat } = req.body;

    const sql = `
          INSERT INTO DespachoEmpresa (RFC, NombreEntregaFactura, CorreoEntregaFactura, UsoCFDI, ClaveSAT, CSF)
          VALUES (?, ?, ?, ?, ?, ?)
      `;
    const values = [RFCAsociado, nombre, correo, cfdi, claveSat, rutaCsf];

    pool.query(sql, values, (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Error al guardar los datos");
      }

      res.send("Datos guardados correctamente");
    });
  });
};

// FORMULARIO DE ALTA PARA INFORMACIÓN GENERAL DE LA CUENTA
exports.guardarDatos = (req, res) => {
  const data = req.body;
  // console.log(data);

  const { RFC } = req.session.usuario; // Asegúrate de que este valor se obtiene de manera adecuada según tu aplicación

  // Función para asignar "N/A" a campos vacíos excepto para FechaValidacion
  const naIfEmpty = (value) => (value ? value : "N/A");

  // Primero insertamos en la tabla Cliente_InfGeneralCuenta
  const queryInfGeneral = `
      INSERT INTO Cliente_InfGeneralCuenta
      (NoClientePadre, NoClienteHijo, TipoDeCaso, FechaDeAsignacion, RFCUsuario, RFCDespacho)
      VALUES (?, ?, ?, ?, ?, ?);
    `;

  // Usar la conexión para insertar los datos generales de la cuenta
  pool.query(
    queryInfGeneral,
    [
      naIfEmpty(data.NoClientePadre),
      naIfEmpty(data.NoClienteHijo),
      naIfEmpty(data.TipoDeCaso),
      data.FechaDeAsignacion,
      RFC,
      data.RFCDespacho,
    ],
    (error, results) => {
      if (error) {
        console.error("Error al insertar en Cliente_InfGeneralCuenta:", error);
        return res.status(500).send("Error al guardar los datos de la cuenta");
      }

      // Obtenemos el IDCuenta generado
      const IDCuenta = results.insertId;
      // Almacenar el IDCuenta en la sesión
      req.session.IDCuenta = IDCuenta;

      // Ahora insertamos en la tabla Cliente_InfDeudor
      const queryInfDeudor = `
        INSERT INTO Cliente_InfDeudor
        (IDCuenta, RegimenDeudor, DireccionComercial, PoderNotarial, PoderNotarialDetalle,
        DomicilioFiscal, DomicilioPersonal, DomicilioLaboral, RazonSocial, Rfc, Curp,
        DomicilioEntrega, DomicilioAlternativo, ViaPrincipalDeContacto, DomicilioConfirmado,
        FechaValidacion, NumeroCelular, TelefonoFijoUno, TelefonoFijoDos, Correo)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `;

      pool.query(
        queryInfDeudor,
        [
          IDCuenta,
          naIfEmpty(data.RegimenDeudor),
          naIfEmpty(data.DireccionComercial),
          naIfEmpty(data.PoderNotarial),
          naIfEmpty(data.PoderNotarialDetalle),
          naIfEmpty(data.DomicilioFiscal),
          naIfEmpty(data.DomicilioPersonal),
          naIfEmpty(data.DomicilioLaboral),
          naIfEmpty(data.RazonSocial),
          naIfEmpty(data.Rfc),
          naIfEmpty(data.Curp),
          naIfEmpty(data.DomicilioEntrega),
          naIfEmpty(data.DomicilioAlternativo),
          naIfEmpty(data.ViaPrincipalDeContacto),
          naIfEmpty(data.DomicilioConfirmado),
          data.FechaValidacion || null,
          naIfEmpty(data.NumeroCelular),
          naIfEmpty(data.TelefonoFijoUno),
          naIfEmpty(data.TelefonoFijoDos),
          naIfEmpty(data.correo),
        ],
        (error, results) => {
          if (error) {
            console.error("Error al insertar:", error);
            return res
              .status(500)
              .send("Error al guardar los datos del deudor");
          }
          // Si todo ha ido bien, enviar una respuesta de éxito con el IDCuenta
          // console.log("------------------------------------------");
          // console.log("ALTA INICIADA CON IDCUENTA:" + IDCuenta);
          res.status(200).json({
            message: "Datos guardados correctamente",
            IDCuenta: IDCuenta,
          });
        }
      );
    }
  );
};

// FORMULARIO DE ALTA PARA CONTACTOS Y VARIABLES DE RIESGO
exports.guardarContactos = [
  (req, res, next) => {
    const IDCuenta = req.session.IDCuenta;
    const upload = createUploadDirForUser(IDCuenta);
    const uploadHandler = upload.fields([
      { name: "DocumentacionLegal", maxCount: 1 },
      { name: "DocumentacionDanosReclamados", maxCount: 1 },
      { name: "DocumentacionSoporteActitudDeudor", maxCount: 1 },
      { name: "BuroDelCliente", maxCount: 1 },
      { name: "EstadoDeCuentaFile", maxCount: 1 },
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
  async (req, res) => {
    try {
      const IDCuenta = req.session.IDCuenta;

      // Insertar datos del contacto fijo
      await insertarContacto(IDCuenta, 1, req.body);

      // Insertar datos de contactos dinámicos
      for (let i = 2; i <= 3; i++) {
        await insertarContacto(IDCuenta, i, req.body); // No necesitas los archivos para los contactos dinámicos
      }

      // Insertar montos de deuda
      for (let i = 1; i <= 10; i++) {
        await insertarMontoDeuda(IDCuenta, i, req.body);
      }

      // Insertar datos variables de riesgo
      await insertarVariablesRiesgo(IDCuenta, req.body, req.files);

      res.status(200).json({ message: "Datos guardados correctamente" }); // Enviar un JSON con mensaje de éxito
    } catch (error) {
      console.error("Error al insertar en la base de datos: " + error.message);
      res
        .status(500)
        .json({ error: "Error interno del servidor", details: error.message }); // Enviar un JSON con el error
    }
  },
];

async function insertarContacto(IDCuenta, numeroContacto, body) {
  const {
    ["NombreContacto" + numeroContacto]: NombreContacto,
    ["DireccionContacto" + numeroContacto]: DireccionContacto,
    ["TelefonoContacto" + numeroContacto]: TelefonoContacto,
    ["CelularContacto" + numeroContacto]: CelularContacto,
    ["PuestoContacto" + numeroContacto]: PuestoContacto,
    ["EmailContacto" + numeroContacto]: EmailContacto,
    ["EmailContactoAdicional" + numeroContacto]: EmailContactoAdicional,
    ["ObservacionesContacto" + numeroContacto]: ObservacionesContacto,
  } = body;

  // Verifica si al menos uno de los campos del contacto está presente
  if (
    NombreContacto ||
    DireccionContacto ||
    TelefonoContacto ||
    CelularContacto ||
    PuestoContacto ||
    EmailContacto ||
    EmailContactoAdicional ||
    ObservacionesContacto
  ) {
    const sql = `INSERT INTO Cliente_Contactos (IDCuenta, NumeroContacto, NombreContacto, DireccionContacto, TelefonoContacto, CelularContacto, PuestoContacto, EmailContacto, EmailContactoAdicional, ObservacionesContacto) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [
      IDCuenta,
      numeroContacto,
      NombreContacto || "N/A",
      DireccionContacto || "N/A",
      TelefonoContacto || "N/A",
      CelularContacto || "N/A",
      PuestoContacto || "N/A",
      EmailContacto || "N/A",
      EmailContactoAdicional || "N/A",
      ObservacionesContacto || "N/A",
    ];
    await pool.query(sql, values);
    // console.log(`Contacto ${numeroContacto} insertado correctamente`);
  }
}

async function insertarMontoDeuda(IDCuenta, IDMonto, body) {
  const descripcionAdeudo = body["descripcionAdeudo" + IDMonto];
  const adeudoMonto = body["adeudoMonto" + IDMonto];

  if (descripcionAdeudo || adeudoMonto) {
    const sql = `INSERT INTO Cliente_MontoDeDeuda (IDCuenta, IDMonto, DescripcionAdeudo, AdeudoMonto) VALUES (?, ?, ?, ?)`;
    const values = [IDCuenta, IDMonto, descripcionAdeudo, adeudoMonto];
    await pool.query(sql, values);
    // console.log(`Monto de deuda ${IDMonto} insertado correctamente`);
  }
}

async function insertarVariablesRiesgo(IDCuenta, body, files) {
  const {
    TipoDeuda = "N/A",
    TipoGarantia = "N/A",
    OtroTipoGarantia = "N/A",
    DescripcionDanosReclamados = "N/A",
    DescripcionActitudDeudor = "N/A",
    Banco = "N/A",
    NumeroDeCuenta = "N/A",
    EstadoDeCuenta = "N/A",
  } = body;

  const DocumentacionLegal = files["DocumentacionLegal"]
    ? files["DocumentacionLegal"][0].filename
    : "N/A";
  const DocumentacionDanosReclamados = files["DocumentacionDanosReclamados"]
    ? files["DocumentacionDanosReclamados"][0].filename
    : "N/A";
  const DocumentacionSoporteActitudDeudor = files[
    "DocumentacionSoporteActitudDeudor"
  ]
    ? files["DocumentacionSoporteActitudDeudor"][0].filename
    : "N/A";
  const BuroDelCliente = files["BuroDelCliente"]
    ? files["BuroDelCliente"][0].filename
    : "N/A";
  const EstadoDeCuentaFile = files["EstadoDeCuentaFile"]
    ? files["EstadoDeCuentaFile"][0].filename
    : "N/A";

  const rutaDocumentacionLegal = `uploads/${IDCuenta}/${DocumentacionLegal}`;
  const rutaDocumentacionDanosReclamados = `uploads/${IDCuenta}/${DocumentacionDanosReclamados}`;
  const rutaDocumentacionSoporteActitudDeudor = `uploads/${IDCuenta}/${DocumentacionSoporteActitudDeudor}`;
  const rutaBuroDelCliente = `uploads/${IDCuenta}/${BuroDelCliente}`;
  const rutaEstadoDeCuentaFile = EstadoDeCuentaFile
    ? `uploads/${IDCuenta}/${EstadoDeCuentaFile}`
    : "N/A";

  const sql = `INSERT INTO Cliente_VariablesDeRiesgo (IDCuenta, TipoDeuda, TipoGarantia, OtroTipoGarantia, DocumentacionLegal, RutaDocumentacionLegal, DescripcionDañosReclamados, DocumentacionDañosReclamados, RutaDocumentacionDañosReclamados, DescripcionActitudDeudor, DocumentacionSoporteActitudDeudor, RutaDocumentacionSoporteActitudDeudor, BuroDelCliente, RutaBuroDelCliente, Banco, NumeroDeCuenta, EstadoDeCuenta, EstadoDeCuentaFile, RutaEstadoDeCuentaFile) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const values = [
    IDCuenta,
    TipoDeuda,
    TipoGarantia,
    OtroTipoGarantia,
    DocumentacionLegal,
    rutaDocumentacionLegal,
    DescripcionDanosReclamados,
    DocumentacionDanosReclamados,
    rutaDocumentacionDanosReclamados,
    DescripcionActitudDeudor,
    DocumentacionSoporteActitudDeudor,
    rutaDocumentacionSoporteActitudDeudor,
    BuroDelCliente,
    rutaBuroDelCliente,
    Banco,
    NumeroDeCuenta,
    EstadoDeCuenta,
    EstadoDeCuentaFile,
    rutaEstadoDeCuentaFile,
  ];

  await pool.query(sql, values);
  // console.log("Datos de variables de riesgo insertados correctamente");
}

// FORMULARIO PARA INGRESAR EL ESTADO DE CUENTA
exports.guardarEdoDeCuenta = [
  (req, res, next) => {
    const IDCuenta = req.session.IDCuenta;
    const upload = createUploadDirForUser(IDCuenta);
    const uploadHandler = upload.fields([
      { name: "SoporteEdoDeCuenta", maxCount: 1 },
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
    const IDCuenta = req.session.IDCuenta;
    const formData = req.body;

    if (
      req.files &&
      req.files["SoporteEdoDeCuenta"] &&
      req.files["SoporteEdoDeCuenta"].length > 0
    ) {
      const ArchivoSoporte = req.files["SoporteEdoDeCuenta"][0].filename;
      const RutaArchivoSoporte = `uploads/${IDCuenta}/${ArchivoSoporte}`;

      // Preparar la consulta SQL para la inserción
      let sql = `INSERT INTO Cliente_EstadoDeCuenta (IDCuenta, IDEstadoDeCuenta, TipoDocumento, NoDeDocumento, FechaSoporte, FechSoporteVencimiento, ImporteTotal, ImporteRestante, PromedioPonderado, ArchivosSoporte, RutaArchivosSoporte) VALUES ?`;
      let values = [];

      // Generar un ID único para cada fila
      let IDEstadoDeCuenta = 1; // Empezamos con 1, puedes ajustar la lógica según tu necesidad

      // Iterar sobre todas las filas enviadas desde el frontend
      for (let i = 1; formData["TipoDocumento" + i]; i++) {
        values.push([
          IDCuenta,
          IDEstadoDeCuenta,
          formData["TipoDocumento" + i],
          formData["NoDeDocumento" + i],
          formData["FechaSoporte" + i],
          formData["FechaSoporteVencimiento" + i],
          formData["ImporteTotal" + i],
          formData["ImporteRestante" + i],
          formData["PromedioPonderado" + i],
          ArchivoSoporte, // Usar el nombre del archivo para todas las filas
          RutaArchivoSoporte, // Usar la misma ruta de archivo para todas las filas
        ]);

        IDEstadoDeCuenta++; // Incrementar el ID para la siguiente fila
      }

      // Ejecutar la consulta SQL
      pool.query(sql, [values], (err, result) => {
        if (err) {
          console.error(
            "Error al insertar datos en la base de datos: " + err.message
          );
          if (err.code === "ER_DUP_ENTRY") {
            res
              .status(409)
              .send("Ya existe un estado de cuenta con ese IDEstadoDeCuenta");
          } else {
            res.status(500).send("Error interno del servidor");
          }
          return;
        }
        // console.log("Datos insertados correctamente en la base de datos");
        res.status(204).end(); // Enviar una respuesta vacía con el código 204 al cliente
      });
    }
  },
];

// FORMULARIO PARA REGISTRAR EL HISTORIAL DE PAGOS
exports.guardarHistorialPagos = (req, res) => {
  const IDCuenta = req.session.IDCuenta;
  const formData = req.body;
  // console.log(formData);
  // Itera sobre los datos del formulario y los inserta en la base de datos
  Object.keys(formData).forEach((key) => {
    // Verifica que el nombre de la clave sea válido (corresponde a un campo del formulario)
    if (key.startsWith("FechaTransaccion") && formData[key]) {
      const IDHistorialDePago = parseInt(key.replace("FechaTransaccion", ""));
      const FechaTransaccion = formData[key];
      const NumeroFacturaORecibo =
        formData["NumeroFacturaORecibo" + IDHistorialDePago];
      const MontoPagado = formData["MontoPagado" + IDHistorialDePago];
      const EstadoDelPago = formData["EstadoDelPago" + IDHistorialDePago];
      const ObservacionesPago =
        formData["ObservacionesContacto" + IDHistorialDePago];

      // Realiza la inserción en la base de datos
      const query =
        "INSERT INTO Cliente_HistorialDePagos (IDCuenta, IDHistorialDePago, FechaTransaccion, NumeroFacturaORecibo, MontoPagado, EstadoDelPago, ObservacionesPago) VALUES (?, ?, ?, ?, ?, ?, ?)";
      const values = [
        IDCuenta,
        IDHistorialDePago,
        FechaTransaccion,
        NumeroFacturaORecibo,
        MontoPagado,
        EstadoDelPago,
        ObservacionesPago,
      ];

      pool.query(query, values, (error, results, fields) => {
        if (error) {
          console.error("Error al insertar datos en la base de datos:", error);
          res
            .status(500)
            .json({ error: "Error al guardar los datos en la base de datos" });
        }
      });
    }
  });

  // Envía una respuesta vacía al navegador con un código de estado 204 (No Content)
  res.status(204).end();
};

// FORMULARIO PARA LA DESCRIPCIÓN DEL CASO Y CARGA DE DOCUMENTOS
exports.guardarDocumentosDescripcion = [
  (req, res, next) => {
    const IDCuenta = req.session.IDCuenta;
    const upload = createUploadDirForUser(IDCuenta);
    upload.any()(req, res, (err) => {
      if (err) {
        return res.status(500).send("Error al cargar archivos: " + err.message);
      }
      next();
    });
  },
  (req, res) => {
    const IDCuenta = req.session.IDCuenta;
    const archivosExtras = req.files;
    const descripcionDelCaso = {
      IDCuenta: IDCuenta,
      HistorialDelCaso: req.body.HistoriaDelCaso,
      AccionesTomadas: req.body.AccionesTomadas,
      CircuntanciasEspecificas: req.body.CircunstanciasEspecificas,
    };

    pool.query(
      "INSERT INTO Cliente_DescripcionDelCaso SET ?",
      descripcionDelCaso,
      (error, results) => {
        if (error) {
          console.error("Error al insertar descripción del caso:", error);
          res.status(500).send("Error interno del servidor");
          return;
        }

        pool.query(
          "SELECT MAX(IDDocumentacion) AS maxId FROM Cliente_DocumentacionExtra WHERE IDCuenta = ?",
          [IDCuenta],
          (error, results) => {
            if (error) {
              console.error(
                "Error al obtener el máximo IDDocumentacion:",
                error
              );
              res.status(500).send("Error interno del servidor");
              return;
            }

            let maxId = results[0].maxId || 0;

            archivosExtras.forEach((archivo, index) => {
              maxId++;
              const nombreArchivo = archivo.filename;
              const rutaArchivo = `uploads/${IDCuenta}/${nombreArchivo}`;
              const documentacionExtra = {
                IDCuenta: IDCuenta,
                IDDocumentacion: maxId,
                DescripcionArchivoExtra:
                  req.body[`DescripcionArchivoExtra${index + 1}`],
                ArchivoExtra: nombreArchivo,
                RutaArchivoExtra: rutaArchivo,
                ModoEntregaArchivoExtra:
                  req.body[`ModoEntregaArchivoExtra${index + 1}`],
              };

              pool.query(
                "INSERT INTO Cliente_DocumentacionExtra SET ?",
                documentacionExtra,
                (error, results) => {
                  if (error) {
                    console.error(
                      "Error al insertar documentación extra:",
                      error
                    );
                    res.status(500).send("Error interno del servidor");
                    return;
                  }
                }
              );
            });

            // console.log("Datos insertados correctamente en la base de datos");
            res.status(204).end();
          }
        );
      }
    );
  },
];

// VALIDACIÓN DE CLIENTE PARA LA COTIZACION DEL DESPACHO
exports.ValidarCotizacion = (req, res) => {
  const { id, validado, fechaValidacion, RFCValidacion } = req.body;
  const query = `
      UPDATE Despacho_Cotizacion 
      SET Validacion = ?, RFCUsuario = ?, FechaValidacion = ? 
      WHERE IDCotizacion = ?
    `;
  pool.query(
    query,
    [validado, RFCValidacion, fechaValidacion, id],
    (error) => {
      if (error) {
        console.error("Error ejecutando la consulta:", error.stack);
        return res.status(500).send("Error en el servidor");
      }
      res.sendStatus(200);
    }
  );
};

// VALIDACIÓN DE CLIENTE PARA LOS HONORARIOS DEL DESPACHO
exports.ValidarGastosHonorarios = (req, res) => {
  const { id, validado, fechaHoraValidacion, RFCValidacion } = req.body;
  const query = `
      UPDATE Despacho_CostosHonorarios 
      SET Validacion = ?, RFCUsuario = ?, FechaValidacion = ? 
      WHERE IDCostosHonorarios = ?
    `;
  pool.query(
    query,
    [validado, RFCValidacion, fechaHoraValidacion, id],
    (error) => {
      if (error) {
        console.error("Error ejecutando la consulta:", error.stack);
        return res.status(500).send("Error en el servidor");
      }
      res.sendStatus(200);
    }
  );
};

// VALIDACIÓN DEL CLIENTE PARA LOS IMPORTES RECUPERADOS POR EL DESPACHO
exports.ValidarImportes = (req, res) => {
  const { id, validado, fechaHoraValidacion, RFCValidacion } = req.body;
  // const data = req.body;
  // console.log(data)
  const query = `
      UPDATE Despacho_ImporteRecuperado 
      SET Validacion = ?, RFCUsuario = ?, FechaValidacion = ? 
      WHERE IDImporteRecuperado = ?
    `;
  pool.query(
    query,
    [validado, RFCValidacion, fechaHoraValidacion, id],
    (error) => {
      if (error) {
        console.error("Error ejecutando la consulta:", error.stack);
        return res.status(500).send("Error en el servidor");
      }
      res.sendStatus(200);
    }
  );
};

// COMENTARIOS GENERALES POR CASO (UTILIZADOS POR CLIENTE Y DESPACHO)
exports.Comentarios = (req, res) => {
  const { RFC, idCuenta, Retroalimentacion, fechaHoraRegistro } = req.body;
  // console.log(fechaHoraRegistro);
  // Consulta SQL para insertar datos en la tabla Despacho_Retroalimentacion
  const insertQuery = `INSERT INTO Cliente_Retroalimentacion (IDCuenta, RFCDespacho, Retroalimentacion, FechaRegistro)
                           VALUES (?, ?, ?, ?)`;

  // Valores para la consulta preparada
  const values = [idCuenta, RFC, Retroalimentacion, fechaHoraRegistro];

  // Ejecutar la consulta usando el pool de conexiones
  pool.query(insertQuery, values, (error, results, fields) => {
    if (error) {
      console.error("Error al insertar datos:", error);
      res
        .status(500)
        .json({ message: "Error al insertar datos en la base de datos" });
    } else {
      // console.log("Datos insertados correctamente");
      res.status(200).json({
        message:
          "Datos recibidos y almacenados correctamente en la base de datos",
      });
    }
  });
};

// COMENTARIOS POR ACCIÓN DEL EXPEDIENTE (UTILIZADOS POR CLIENTE Y DESPACHO)
exports.ComentariosAccion = (req, res) => {
  const { RFC, idCuenta, IDGestion, Retroalimentacion, fechaHoraRegistro } =
    req.body;

  // Obtener una conexión del pool
  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Error al obtener conexión del pool:", err);
      return res.status(500).json({ error: "Error de servidor" });
    }

    // Preparar la consulta SQL
    const sql = `INSERT INTO Cliente_RetroalimentacionAccion (IDCuenta, RFCDespacho, IDGestion, Retroalimentacion, FechaRegistro) VALUES (?, ?, ?, ?, ?)`;
    const values = [
      idCuenta,
      RFC,
      IDGestion,
      Retroalimentacion,
      fechaHoraRegistro,
    ];

    // Ejecutar la consulta SQL
    connection.query(sql, values, (error, results, fields) => {
      connection.release(); // Liberar la conexión al pool

      if (error) {
        console.error("Error al ejecutar consulta:", error);
        return res
          .status(500)
          .json({ error: "Error de servidor al guardar datos" });
      }

      // console.log('Datos insertados correctamente:', results);
      res.json({ message: "Datos recibidos y guardados correctamente" });
    });
  });
};
