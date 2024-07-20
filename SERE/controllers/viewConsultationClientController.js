const pool = require("../config/database");
const moment = require("moment");

exports.renderObtenerCotizacion = (req, res) => {
  const { IDPerfil } = req.session.usuario;
  const IDCuenta = req.query.IDCuenta; // Obtener el ID de cuenta de la solicitud
  const query = "SELECT * FROM Despacho_Cotizacion WHERE IDCuenta = ?"; // Consulta SQL modificada
  pool.query(query, [IDCuenta], (error, results) => {
    if (error) {
      console.error("Error ejecutando la consulta:", error.stack);
      return res.status(500).send("Error en el servidor");
    }
    res.json({ resultados: results, IDPerfil: IDPerfil });
  });
};

exports.renderObtenerGastosHonorarios = (req, res) => {
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
};

exports.renderObtenerImportes = (req, res) => {
  const { IDPerfil } = req.session.usuario;
  const IDCuenta = req.query.IDCuenta; // Obtener el ID de cuenta de la solicitud
  const query = "SELECT * FROM Despacho_ImporteRecuperado WHERE IDCuenta = ?"; // Consulta SQL modificada
  pool.query(query, [IDCuenta], (error, results) => {
    if (error) {
      console.error("Error ejecutando la consulta:", error.stack);
      return res.status(500).send("Error en el servidor");
    }
    // Formatear las fechas
    results = results.map((row) => {
      return {
        ...row,
        FechaImporteRecuperado: moment(row.FechaImporteRecuperado).format(
          "YYYY-MM-DD HH:mm:ss"
        )
      };
    });
    res.json({ resultados: results, IDPerfil: IDPerfil });
  });
};

exports.renderObtenerPlazos = (req, res) => {
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
};

exports.renderObtenerGarantia = (req, res) => {
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
};

exports.renderObtenerPagares = (req, res) => {
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
        FechaPrescripcion: row.FechaPrescripcion
          ? moment(row.FechaPrescripcion).format("YYYY-MM-DD")
          : null,
        FechaSuscripcion: row.FechaSuscripcion
          ? moment(row.FechaSuscripcion).format("YYYY-MM-DD")
          : null,
        FechaVencimiento: row.FechaVencimiento
          ? moment(row.FechaVencimiento).format("YYYY-MM-DD")
          : null,
        fechaHoraPagare: row.fechaHoraPagare
          ? moment(row.fechaHoraPagare).format("YYYY-MM-DD HH:mm:ss")
          : null,
      };
    });

    // Agrupar resultados por PagareID para manejar múltiples suscriptores y avales por pagare
    const pagaresConSuscriptoresAvales = {};
    results.forEach((row) => {
      const {
        ID,
        IDCuenta,
        RFCDespacho,
        FechaPrescripcion,
        Importe,
        FechaSuscripcion,
        FechaVencimiento,
        Monto,
        Interes,
        fechaHoraPagare,
        NombreSuscriptor,
        DomicilioSuscriptor,
        NombreAval,
        DireccionAval,
      } = row;

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
};

exports.renderObtenerProcesoJudicial = (req, res) => {
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
};

exports.renderObtenerProximasAcciones = (req, res) => {
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
};

exports.renderObtenerDocumentosProcesales = (req, res) => {
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
};

exports.renderObtenerComentarios = (req, res) => {
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
};

exports.renderObtenerComentariosAccion = (req, res) => {
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
};

exports.renderObtenerIncobrabilidad = (req, res) => {
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
        FechaRegistro: moment(row.FechaRegistro).format(
          "YYYY-MM-DD HH:mm:ss"
        ),
      };
    });

    res.json({ resultados: results, IDPerfil: IDPerfil });
  });
};