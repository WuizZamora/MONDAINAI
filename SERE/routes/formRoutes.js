const express = require("express");
const bcrypt = require("bcrypt");
const multer = require("multer");
const fs = require("fs"); // Módulo para manejar el sistema de archivos
const bodyParser = require("body-parser"); // Importa body-parser
const path = require("path");
const pool = require("../config/database"); // Importa la conexión a la base de datos

const app = express();

// Middleware para parsear el cuerpo de las solicitudes POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.post("/AltaUsuario", (req, res) => {
  console.log(req.body);
  const { correo, nombre, contrasena, rfc, rfcAsociado, } = req.body;
  // Verificar si el RFC ya tiene usuarios asociados
  const sqlCheckRFC = "SELECT COUNT(*) AS count FROM Usuarios WHERE RFC = ?";
  pool.query(sqlCheckRFC, [rfc], (err, results) => {
    if (err) {
      console.error("Error al verificar el RFC:", err);
      res.status(500).send("Error interno del servidor");
      return;
    }

    const { count } = results[0];

    // Generar hash bcrypt de la contraseña
    bcrypt.hash(contrasena, 10, function (err, hash) {
      if (err) {
        console.error("Error al cifrar la contraseña:", err);
        res.status(500).send("Error interno del servidor");
        return;
      }

      // INSERSIÓN A LA TABLA USUARIOS CON LA CONTRASEÑA YA ENCRIPTADA
      const sqlInsert =
        "INSERT INTO Usuarios (RFC, Correo, Nombre, Contraseña, RFCAsociado) VALUES (?, ?, ?, ?, ?)";
      pool.query(
        sqlInsert,
        [rfc, correo, nombre, hash, rfcAsociado],
        (err, result) => {
          if (err) {
            console.error("Error al insertar usuario:", err);
            res.status(500).send("Error interno del servidor");
            return;
          }
          console.log("Usuario insertado correctamente");
          res.status(200).send("Usuario insertado correctamente");
        }
      );
    });
  });
});

app.get("/getNombrePorRFC/:rfc", (req, res) => {
  const rfc = req.params.rfc;
  // console.log("Buscando nombre para RFC:", rfc); // Log para verificar el RFC recibido
  const sqlGetNombre =
    "SELECT Nombre FROM PreregistroDespachoEmpresa WHERE RFC = ?";

  pool.query(sqlGetNombre, [rfc], (err, results) => {
    if (err) {
      console.error("Error al buscar el nombre por RFC:", err);
      res.status(500).send("Error interno del servidor");
      return;
    }

    if (results.length > 0) {
      // console.log("Nombre encontrado:", results[0].Nombre); // Log para verificar el nombre encontrado
      res.json({ nombre: results[0].Nombre });
    } else {
      console.log("No se encontró ningún nombre para el RFC:", rfc); // Log para el caso en que no se encuentre un nombre
      res.json({ nombre: null });
    }
  });
});

app.post("/updatePerfil", (req, res) => {
  const { RFC, IDPerfil } = req.body;

  const query = "UPDATE Usuarios SET IDPerfil = ? WHERE RFC = ?";
  const values = [IDPerfil, RFC];

  pool.query(query, values, (error, results) => {
    if (error) {
      console.error("Error ejecutando la consulta", error.stack);
      res
        .status(500)
        .json({ success: false, error: "Error al actualizar el perfil." });
    } else {
      res.status(200).json({ success: true });
    }
  });
});

// RECIBO FORM PARA LOGIN
app.post("/login", (req, res) => {
  const { correo, contrasena } = req.body;

  // CONSULTAR LA BASE DE DATOS PARA OBTENER EL USUARIO
  const sql = "SELECT * FROM Usuarios WHERE Correo = ?";
  pool.query(sql, [correo], (err, results) => {
    if (err) {
      console.error("Error al buscar usuario:", err);
      res.status(500).send("Error interno del servidor");
      return;
    }

    // VERIFICAR SI SE ENCONTRÓ EL USUARIO
    if (results.length === 0) {
      res.status(401).send("Usuario o contraseña incorrectos");
      return;
    }

    const usuarioEncontrado = results[0];

    // VERIFICAR LA CONTRASEÑA UTILIZANDO BCRYPT
    bcrypt.compare(
      contrasena,
      usuarioEncontrado.Contraseña,
      (error, result) => {
        if (error) {
          console.error("Error al comparar contraseñas:", error);
          res.status(500).send("Error interno del servidor");
          return;
        }

        if (!result) {
          res.status(401).send("Usuario o contraseña incorrectos");
          return;
        }

        // AUTENTICACIÓN EXITOSA, GUARDAR EL USUARIO EN LA SESIÓN
        req.session.usuario = usuarioEncontrado;

        // Redirigir al usuario a la página principal después de iniciar sesión
        res.redirect("/sere/");
      }
    );
  });
});

// FORMULARIO DE ALTA, INF GENERAL CUENTA
app.post("/guardar-datos", (req, res) => {
  const data = req.body;
  console.log(data);

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
          console.log("------------------------------------------");
          console.log("ALTA INICIADA CON IDCUENTA:" + IDCuenta);
          res.status(200).json({
            message: "Datos guardados correctamente",
            IDCuenta: IDCuenta,
          });
        }
      );
    }
  );
});

// Función para crear el directorio específico para el usuario si no existe y configurar multer
function createUploadDirForUser(IDCuenta) {
  const uploadDir = path.join(__dirname, "../uploads"); // Ajusta según la estructura de directorios
  const uploadDirForUser = path.join(uploadDir, IDCuenta.toString());

  if (!fs.existsSync(uploadDirForUser)) {
    fs.mkdirSync(uploadDirForUser, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDirForUser);
    },
    filename: function (req, file, cb) {
      const timestamp = Date.now();
      const ext = file.originalname.split(".").pop();
      const prefix = file.fieldname;
      const filename = `${prefix}-${timestamp}.${ext}`;
      cb(null, filename);
    },
  });

  return multer({ storage: storage });
}

app.post(
  "/upload",
  (req, res, next) => {
    const IDCuenta = 333333;

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
  (req, res) => {
    try {
      const IDCuenta = 333333;

      const DocumentacionLegal = req.files["DocumentacionLegal"]
        ? req.files["DocumentacionLegal"][0].filename
        : "N/A";
      const DocumentacionDanosReclamados = req.files[
        "DocumentacionDanosReclamados"
      ]
        ? req.files["DocumentacionDanosReclamados"][0].filename
        : "N/A";
      const DocumentacionSoporteActitudDeudor = req.files[
        "DocumentacionSoporteActitudDeudor"
      ]
        ? req.files["DocumentacionSoporteActitudDeudor"][0].filename
        : "N/A";
      const BuroDelCliente = req.files["BuroDelCliente"]
        ? req.files["BuroDelCliente"][0].filename
        : "N/A";
      const EstadoDeCuentaFile = req.files["EstadoDeCuentaFile"]
        ? req.files["EstadoDeCuentaFile"][0].filename
        : "N/A";

      const rutaDocumentacionLegal = `uploads/${IDCuenta}/${DocumentacionLegal}`;
      const rutaDocumentacionDanosReclamados = `uploads/${IDCuenta}/${DocumentacionDanosReclamados}`;
      const rutaDocumentacionSoporteActitudDeudor = `uploads/${IDCuenta}/${DocumentacionSoporteActitudDeudor}`;
      const rutaBuroDelCliente = `uploads/${IDCuenta}/${BuroDelCliente}`;
      const rutaEstadoDeCuentaFile = EstadoDeCuentaFile
        ? `uploads/${IDCuenta}/${EstadoDeCuentaFile}`
        : "N/A";

      // Aquí puedes manejar los archivos como desees
      res.status(200).json({ message: "Files uploaded successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Ruta para manejar el formulario enviado
app.post("/PreAlta", (req, res) => {
  const { Nombre, RFC } = req.body;
  const query =
    "INSERT INTO PreregistroDespachoEmpresa (Nombre, RFC) VALUES (?, ?)";

  pool.query(query, [Nombre, RFC], (err, result) => {
    if (err) {
      return res.status(500).send("Error al guardar en la base de datos");
    }
    res.send("Registro guardado exitosamente");
  });
});

app.post(
  "/AltaInfoEmpresaDespacho",
  (req, res, next) => {
    const { RFCAsociado } = req.session.usuario;
    const upload = createUploadDirForUser(RFCAsociado);

    const uploadHandler = upload.fields([{ name: "csf", maxCount: 1 }]);

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
    const { RFCAsociado } = req.session.usuario;
    const csf = req.files["csf"] ? req.files["csf"][0] : null;
    const rutaCsf = `uploads/${RFCAsociado}/${csf}`;
    const { nombre, correo, cfdi, claveSat } = req.body;
    // Consulta SQL para insertar datos
    const sql = `
        INSERT INTO DespachoEmpresa (RFC, NombreEntregaFactura, CorreoEntregaFactura, UsoCFDI, ClaveSAT, CSF)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    // Valores para la consulta
    const values = [RFCAsociado, nombre, correo, cfdi, claveSat, rutaCsf];

    // Ejecutar la consulta
    pool.query(sql, values, (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Error al guardar los datos");
      }

      res.send("Datos guardados correctamente");
    });
  }
);

// Ruta para manejar el formulario enviado
app.post(
  "/guardar-contactos",
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
  }
);

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
    console.log(`Contacto ${numeroContacto} insertado correctamente`);
  }
}

async function insertarMontoDeuda(IDCuenta, IDMonto, body) {
  const descripcionAdeudo = body["descripcionAdeudo" + IDMonto];
  const adeudoMonto = body["adeudoMonto" + IDMonto];

  if (descripcionAdeudo || adeudoMonto) {
    const sql = `INSERT INTO Cliente_MontoDeDeuda (IDCuenta, IDMonto, DescripcionAdeudo, AdeudoMonto) VALUES (?, ?, ?, ?)`;
    const values = [IDCuenta, IDMonto, descripcionAdeudo, adeudoMonto];
    await pool.query(sql, values);
    console.log(`Monto de deuda ${IDMonto} insertado correctamente`);
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
  console.log("Datos de variables de riesgo insertados correctamente");
}

// FORMULARIO ESTADO DE CUENTA
app.post(
  "/guardar-EdoDeCuenta",
  (req, res, next) => {
    const IDCuenta = req.session.IDCuenta;
    const upload = createUploadDirForUser(IDCuenta);
    upload.fields([{ name: "SoporteEdoDeCuenta", maxCount: 1 }])(
      req,
      res,
      (err) => {
        if (err) {
          console.error("Error al procesar la carga del archivo:", err);
          res.status(500).send("Error interno del servidor");
          return;
        }
        next();
      }
    );
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
          if (err.code === 'ER_DUP_ENTRY') {
            res.status(409).send("Ya existe un estado de cuenta con ese IDEstadoDeCuenta");
          } else {
            res.status(500).send("Error interno del servidor");
          }
          return;
        }
        console.log("Datos insertados correctamente en la base de datos");
        res.status(204).end(); // Enviar una respuesta vacía con el código 204 al cliente
      });
    }
  }
);

// FORMULARIO HISTORIAL DE PAGOS
app.post("/guardar-HistorialPagos", (req, res) => {
  const IDCuenta = req.session.IDCuenta;
  const formData = req.body;
console.log(formData);
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
});

//FORMULARIO DESCRIPCION DEL CASO Y DOCUMENTOS
app.post(
  "/guardar-DocumentosDescripcion",
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
      IDCuenta: IDCuenta, // Se agrega la IDCuenta aquí
      HistorialDelCaso: req.body.HistoriaDelCaso,
      AccionesTomadas: req.body.AccionesTomadas,
      CircuntanciasEspecificas: req.body.CircunstanciasEspecificas,
    };

    // Insertar descripción del caso en la tabla DescripcionDelCaso
    pool.query(
      "INSERT INTO Cliente_DescripcionDelCaso SET ?",
      descripcionDelCaso,
      (error, results) => {
        if (error) {
          console.error("Error al insertar descripción del caso:", error);
          res.status(500).send("Error interno del servidor");
          return;
        }

        // Obtener el IDDocumentacion inicial
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

            // Procesar cada archivo extra recibido e insertarlo en DocumentacionExtra
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

              // Insertar en DocumentacionExtra
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

            console.log("Datos insertados correctamente en la base de datos");
            res.status(204).end();
          }
        );
      }
    );
  }
);

app.post("/asignarCaso", (req, res) => {
  const {
    IDCuenta,
    AbogadoResponsable,
    AbogadoAsistente,
    EstadoDeCuenta,
    FechaDeCierre,
  } = req.body;

  const query = `
    INSERT INTO Cliente_AsignacionDeCaso (IDCuenta, AbogadoResponsable, AbogadoAsistente, EstadoDeCuenta, FechaDeCierre)
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
});

app.post("/actualizar-caso", (req, res) => {
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
});

app.post(
  "/cotizacion",
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
      const IDCuenta = req.query.IDCuenta;
      const validacion = parseInt(req.body.validacion);
      const TipoCaso = req.body.TipoDeCaso;
      const fecha = req.body.fechaCotizacion;
      const cotizacion = req.files["Cotizacion"]
        ? req.files["Cotizacion"][0].filename
        : "N/A";
      const rutaCotizacion = `uploads/${IDCuenta}/${cotizacion}`;
      // Guardar rutaCotizacion en la base de datos
      pool.query(
        "INSERT INTO Cliente_Cotizacion(IDCuenta, TipoDeCaso, Comentarios, Cotizacion, FechaCotizacion, Validacion) VALUES (?, ?, ?, ?, ?, ?)",
        [
          IDCuenta,
          TipoCaso,
          datos.Comentarios,
          rutaCotizacion,
          fecha,
          validacion,
        ],
        (error, results, fields) => {
          if (error) {
            throw error;
          }
          console.log("Ruta de cotización guardada en la base de datos.");
        }
      );

      console.log(JSON.stringify(datos) + " " + rutaCotizacion);
      // Aquí puedes manejar los archivos como desees
      res.status(200).json({ message: "Files uploaded successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

app.post("/CostosHonorarios", (req, res, next) => {
  const IDCuenta = req.query.IDCuenta;

  const upload = createUploadDirForUser(IDCuenta);

  const uploadHandler = upload.fields([{ name: "soporteCostoHonorario", maxCount: 1 }]);

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
      const SoporteCosto = req.files["soporteCostoHonorario"] ? req.files["soporteCostoHonorario"][0].filename : "N/A";
      const rutaSoporteCosto = `uploads/${IDCuenta}/${SoporteCosto}`;
      const query = `
    INSERT INTO Despacho_CostosHonorarios (IDCuenta, TipoDeCosto, Cantidad, Descripcion, FechaCostoHonorario, RFCDespacho, Soporte)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
      pool.query(
        query,
        [ID, TipoCosto, parseFloat(cantidad), descripcion, fecha, RFC, rutaSoporteCosto],
        (error, results) => {
          if (error) {
            console.error("Error ejecutando la consulta:", error.stack);
            return res.status(500).send("Error en el servidor");
          }
          res
            .status(201)
            .send({
              message: "Datos insertados correctamente",
              id: results.insertId,
            });
        }
      );
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

app.post("/ValidarGastosHonorarios", (req, res) => {
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
});

app.post("/Importes", (req, res, next) => {
  const IDCuenta = req.query.IDCuenta;

  const upload = createUploadDirForUser(IDCuenta);

  const uploadHandler = upload.fields([{ name: "SoporteImporte", maxCount: 1 }]);

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
      const { RFC, ImporteRecuperado, ImporteRestante, ObservacionesImporte, fecha } = req.body;
      const IDCuenta = req.query.IDCuenta;
      const SoporteImporte = req.files["SoporteImporte"] ? req.files["SoporteImporte"][0].filename : "N/A";
      const rutaSoporteImporte = `uploads/${IDCuenta}/${SoporteImporte}`;

      // Aquí realizamos la inserción en la base de datos
      const query = `
        INSERT INTO Despacho_ImporteRecuperado (
          IDCuenta, RFCDespacho, ImporteRecuperado, ImporteRestante, Observaciones, FechaImporteRecuperado, Soporte
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [IDCuenta, RFC, ImporteRecuperado, ImporteRestante, ObservacionesImporte, fecha, rutaSoporteImporte];

      pool.query(query, values, (err, results) => {
        if (err) {
          console.error('Error inserting data:', err.stack);
          return res.status(500).json({ error: 'Database error' });
        }
        res.status(200).json({ message: 'OK' }); // Aquí enviamos una respuesta JSON
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

app.post("/ValidarImportes", (req, res) => {
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
});

app.post("/Plazos", (req, res) => {
  const IDCuenta = req.query.IDCuenta;
  const { RFC, FechaPlazo, Descripcion, fecha } = req.body;

  if (!IDCuenta || !RFC || !FechaPlazo || !Descripcion || !fecha) {
    return res.status(400).send('Faltan datos en la petición');
  }

  const query = `
    INSERT INTO Despacho_PlazosFechasLimite (IDCuenta, RFCDespacho, FechaPlazoFecha, Descripcion, FechaRegistroPlazo)
    VALUES (?, ?, ?, ?, ?)
  `;

  pool.query(query, [IDCuenta, RFC, FechaPlazo, Descripcion, fecha], (err, results) => {
    if (err) {
      console.error('Error ejecutando la consulta:', err);
      return res.status(500).send('Error en el servidor');
    }
    res.status(200).json({ message: 'OK' }); // Aquí enviamos una respuesta JSON
  });
});

app.post("/Garantia", (req, res) => {
  const data = req.body;
  console.log(data);

  const { ID, RFC, TipoGarantia, Documento, fecha, Retroalimentacion } = data;

  // Asumiendo que IDCuenta es el valor de ID
  const query = `INSERT INTO Despacho_Garantia (IDCuenta, RFCDespacho, TipoGarantia, DocumentoSoporte, FechaRegistro, RetroAlimentacion) VALUES (?, ?, ?, ?, ?, ?)`;

  const values = [ID, RFC, TipoGarantia, Documento, fecha, Retroalimentacion];

  pool.query(query, values, (err, results) => {
    if (err) {
      console.error('Error inserting data into Despacho_Garantia:', err);
      res.status(500).send('Error inserting data');
      return;
    }
    res.status(200).json({ message: 'OK' }); // Aquí enviamos una respuesta JSON
  });
});

app.post("/ProcesoJudicial", (req, res) => {
  const { ID, RFC, Expediente, Juzgado, Jurisdiccion, fecha, estadoDelCaso } = req.body;

  const query = `INSERT INTO Despacho_ProcesoJudicial (IDCuenta, RFCDespacho, Expediente, Juzgado, Jurisdiccion, FechaRegistro, EstadoDelCaso) VALUES (?, ?, ?, ?, ?, ?, ?)`;

  pool.query(query, [ID, RFC, Expediente, Juzgado, Jurisdiccion, fecha, estadoDelCaso], (error, results) => {
    if (error) {
      console.error('Error ejecutando la consulta: ' + error.stack);
      res.status(500).send('Error al guardar en la base de datos');
      return;
    }
    res.status(200).json({ message: 'OK' }); // Aquí enviamos una respuesta JSON
  });
});

// Ruta para manejar la inserción de pagares
app.post("/Pagares", (req, res) => {
  const data = req.body;
  const IDCuenta = req.query.IDCuenta;
  // Iniciar la transacción con el pool
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error al conectar con la base de datos:', err);
      return res.status(500).json({ error: 'Error de conexión con la base de datos' });
    }

    // Iniciar la transacción
    connection.beginTransaction(err => {
      if (err) {
        console.error('Error al iniciar la transacción:', err);
        connection.release();
        return res.status(500).json({ error: 'Error al iniciar la transacción' });
      }

      // Insertar en la tabla Pagares
      connection.query('INSERT INTO Pagares (IDCuenta, RFCDespacho, FechaPrescripcion, Importe, FechaSuscripcion, FechaVencimiento, Monto, Interes, fechaHoraPagare) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [IDCuenta, data.RFC, data.FechaPrescripcion, data.Importe, data.FechaSuscripcion, data.FechaVencimiento, data.Monto, data.Interes, data.fecha],
        (err, results) => {
          if (err) {
            connection.rollback(() => {
              console.error('Error al insertar en Pagares:', err);
              connection.release();
              return res.status(500).json({ error: 'Error al insertar en Pagares' });
            });
          }

          const PagarID = results.insertId; // Obtener el ID generado

          // Insertar suscriptores
          if (data.suscriptores && data.suscriptores.length > 0) {
            const suscriptoresValues = data.suscriptores.map(suscriptor => [PagarID, suscriptor.NombreSuscriptor, suscriptor.DomicilioSuscriptor]);
            connection.query('INSERT INTO Suscriptores (PagarID, NombreSuscriptor, DomicilioSuscriptor) VALUES ?', [suscriptoresValues], (err, results) => {
              if (err) {
                connection.rollback(() => {
                  console.error('Error al insertar suscriptores:', err);
                  connection.release();
                  return res.status(500).json({ error: 'Error al insertar suscriptores' });
                });
              }

              // Insertar avales
              if (data.avales && data.avales.length > 0) {
                const avalesValues = data.avales.map(aval => [PagarID, aval.NombreAval, aval.DireccionAval]);
                connection.query('INSERT INTO Avales (PagarID, NombreAval, DireccionAval) VALUES ?', [avalesValues], (err, results) => {
                  if (err) {
                    connection.rollback(() => {
                      console.error('Error al insertar avales:', err);
                      connection.release();
                      return res.status(500).json({ error: 'Error al insertar avales' });
                    });
                  }

                  // Commit si todo ha ido bien
                  connection.commit((err) => {
                    if (err) {
                      connection.rollback(() => {
                        console.error('Error al hacer commit:', err);
                        connection.release();
                        return res.status(500).json({ error: 'Error al hacer commit' });
                      });
                    }

                    // console.log('Transacción completada.');
                    connection.release();
                    res.status(200).json({ message: 'OK' });
                  });
                });
              } else {
                // Commit si no hay avales
                connection.commit((err) => {
                  if (err) {
                    connection.rollback(() => {
                      console.error('Error al hacer commit:', err);
                      connection.release();
                      return res.status(500).json({ error: 'Error al hacer commit' });
                    });
                  }
                  // console.log('Transacción completada.');
                  connection.release();
                  res.status(200).json({ message: 'OK' });
                });
              }
            });
          } else {
            // Commit si no hay suscriptores ni avales
            connection.commit((err) => {
              if (err) {
                connection.rollback(() => {
                  console.error('Error al hacer commit:', err);
                  connection.release();
                  return res.status(500).json({ error: 'Error al hacer commit' });
                });
              }

              connection.release();
              res.status(200).json({ message: 'OK' });
            });
          }
        });
    });
  });
});

app.post("/EstadoDelCaso", (req, res, next) => {
  const IDCuenta = req.query.IDCuenta;

  const upload = createUploadDirForUser(IDCuenta);

  const uploadHandler = upload.fields([{ name: "SoporteActuaciones", maxCount: 1 }]);

  uploadHandler(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(500).json({ error: err.message });
    }
    next();
  });
}, (req, res) => {
  try {
    const IDCuenta = req.query.IDCuenta;
    const { RFC, FechaProximasAcciones, ProximasAcciones, fechaHoraActual, IDProcesoJudicial } = req.body;
    const SoporteActuaciones = req.files["SoporteActuaciones"] ? req.files["SoporteActuaciones"][0].filename : "N/A";
    const rutaSoporteActuaciones = `uploads/${IDCuenta}/${SoporteActuaciones}`;

    // Aquí realizamos la inserción en la base de datos
    const query = `
  INSERT INTO Despacho_GestionCaso (
    IDCuenta, RFCDespacho, FechaProximaAccion, ProximasAcciones, SoporteActuaciones, FechaRegistro, IDProcesoJudicial
  ) VALUES (?, ?, ?, ?, ?, ?, ?)
`;
    const values = [IDCuenta, RFC, FechaProximasAcciones, ProximasAcciones, rutaSoporteActuaciones, fechaHoraActual, IDProcesoJudicial];


    pool.query(query, values, (err, results) => {
      if (err) {
        console.error('Error inserting data:', err.stack);
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(200).json({ message: 'OK' }); // Aquí enviamos una respuesta JSON
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/DocumentosProcesales", (req, res, next) => {
  const IDCuenta = req.query.IDCuenta;

  const upload = createUploadDirForUser(IDCuenta);

  const uploadHandler = upload.fields([{ name: "DocumentosProcesales", maxCount: 1 }]);

  uploadHandler(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(500).json({ error: err.message });
    }
    next();
  });
}, (req, res) => {
  try {
    const IDCuenta = req.query.IDCuenta;
    const { RFC, IDProcesoJudicial, fechaHoraActual } = req.body;
    const SoporteDocumentos = req.files["DocumentosProcesales"] ? req.files["DocumentosProcesales"][0].filename : "N/A";
    const rutaSoporteDocumentos = `uploads/${IDCuenta}/${SoporteDocumentos}`;

    // Inserción en la base de datos
    const query = `INSERT INTO Despacho_DocumentosProcesales 
                   (IDCuenta, RFCDespacho, DocumentosProcesales, FechaRegistro, IDProcesoJudicial) 
                   VALUES (?, ?, ?, ?, ?)`;
    const values = [IDCuenta, RFC, rutaSoporteDocumentos, fechaHoraActual, IDProcesoJudicial];

    pool.query(query, values, (error, results) => {
      if (error) {
        return res.status(500).json({ error: error.message });
      }
      res.status(200).json({ message: 'OK' });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ruta para recibir los datos del formulario
app.post('/Comentarios', (req, res) => {
  const { RFC, idCuenta, Retroalimentacion, fechaHoraRegistro } = req.body;
  console.log(fechaHoraRegistro);
  // Consulta SQL para insertar datos en la tabla Despacho_Retroalimentacion
  const insertQuery = `INSERT INTO Cliente_Retroalimentacion (IDCuenta, RFCDespacho, Retroalimentacion, FechaRegistro)
                         VALUES (?, ?, ?, ?)`;

  // Valores para la consulta preparada
  const values = [idCuenta, RFC, Retroalimentacion, fechaHoraRegistro];

  // Ejecutar la consulta usando el pool de conexiones
  pool.query(insertQuery, values, (error, results, fields) => {
    if (error) {
      console.error('Error al insertar datos:', error);
      res.status(500).json({ message: 'Error al insertar datos en la base de datos' });
    } else {
      console.log('Datos insertados correctamente');
      res.status(200).json({ message: 'Datos recibidos y almacenados correctamente en la base de datos' });
    }
  });
});

app.post('/ComentariosAccion', (req, res) => {
  const { RFC, idCuenta, IDGestion, Retroalimentacion, fechaHoraRegistro } = req.body;

  // Obtener una conexión del pool
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error al obtener conexión del pool:', err);
      return res.status(500).json({ error: 'Error de servidor' });
    }

    // Preparar la consulta SQL
    const sql = `INSERT INTO Cliente_RetroalimentacionAccion (IDCuenta, RFCDespacho, IDGestion, Retroalimentacion, FechaRegistro) VALUES (?, ?, ?, ?, ?)`;
    const values = [idCuenta, RFC, IDGestion, Retroalimentacion, fechaHoraRegistro];

    // Ejecutar la consulta SQL
    connection.query(sql, values, (error, results, fields) => {
      connection.release(); // Liberar la conexión al pool

      if (error) {
        console.error('Error al ejecutar consulta:', error);
        return res.status(500).json({ error: 'Error de servidor al guardar datos' });
      }

      // console.log('Datos insertados correctamente:', results);
      res.json({ message: 'Datos recibidos y guardados correctamente' });
    });
  });
});

app.post("/Incobrabilidad", (req, res, next) => {
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
}, (req, res) => {
  try {
    const IDCuenta = req.query.IDCuenta;
    const formData = req.body;
    const SoporteFormato = req.files["Formato"] ? req.files["Formato"][0].filename : "N/A";
    const rutaFormato = `uploads/${IDCuenta}/${SoporteFormato}`;
    const { ComentariosFormato, RFC, Id, FechaRegistro } = formData;

    // Crear la consulta SQL para insertar en la tabla Despacho_Incobrabilidad
    const insertQuery = `
      INSERT INTO Despacho_Incobrabilidad (IDCuenta, RFCDespacho, FormatoIncobrabilidad, Comentarios, FechaRegistro)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    // Ejecutar la consulta SQL con los valores correspondientes
    pool.query(insertQuery, [Id, RFC, rutaFormato, ComentariosFormato, FechaRegistro], (error, results) => {
      if (error) {
        console.error('Error al insertar en Despacho_Incobrabilidad:', error);
        return res.status(500).json({ error: 'Error interno al guardar los datos' });
      }
      res.status(200).json({ message: 'Datos recibidos y guardados correctamente' });
    });

  } catch (error) {
    console.error('Error en el manejo de la solicitud:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = app;
