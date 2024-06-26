const express = require("express");
const bodyParser = require("body-parser"); // Importa body-parser
const bcrypt = require("bcrypt");
const connection = require("../config/database"); // Importa la conexión a la base de datos

const app = express();

// Middleware para parsear el cuerpo de las solicitudes POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// ALTA USUARIO
app.post("/AltaUsuario", (req, res) => {
  const { contrasena, rfc, correo, nombre, tipo_alta } = req.body;
  // Generar hash bcrypt de la contraseña
  bcrypt.hash(contrasena, 10, function (err, hash) {
    if (err) {
      console.error("Error al cifrar la contraseña:", err);
      res.status(500).send("Error al procesar la solicitud");
      return;
    }
    const sql =
      "INSERT INTO Usuario (RFCUsuario, IDPerfil, CorreoUsuario, Nombre, Contraseña) VALUES (?, ?, ?, ?, ?)";
    connection.query(
      sql,
      [rfc, tipo_alta, correo, nombre, hash],
      (err, result) => {
        if (err) {
          console.error("Error al insertar usuario:", err);
          res.status(500).send("Error al procesar la solicitud");
          return;
        }
        console.log("Usuario " + nombre + " insertado correctamente");
        res.status(200).send("Usuario registrado correctamente");
      }
    );
  });
});

// LOGIN
app.post("/login", (req, res) => {
  const { correo, contrasena } = req.body;
  // CONSULTAR LA BASE DE DATOS PARA OBTENER EL USUARIO
  const sql = "SELECT * FROM Usuario WHERE CorreoUsuario = ?";
  connection.query(sql, [correo], (err, results) => {
    if (err) {
      console.error("Error al buscar correo:", err);
      res.status(500).send("Error interno del servidor");
      return;
    }
    // VERIFICAR SI SE ENCONTRÓ EL USUARIO
    if (results.length === 0) {
      res.status(401).send("Correo o contraseña incorrectos");
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
        res.redirect("/secie/");
      }
    );
  });
});

app.post("/AltaNuevoProyecto", async (req, res) => {
  const { tipo_proyecto, descripcion_proyecto } = req.body;

  // Inicia una transacción para manejar las inserciones
  connection.beginTransaction(err => {
    if (err) {
      return res.status(500).send("Error al iniciar la transacción");
    }

    // Insertar en NuevoProyecto
    const queryNuevoProyecto = `
      INSERT INTO NuevoProyecto (TipoDeProyecto, BreveDescripcion) 
      VALUES (?, ?);
    `;
    connection.query(queryNuevoProyecto, [tipo_proyecto, descripcion_proyecto], (err, proyectoResult) => {
      if (err) {
        connection.rollback(() => {
          console.error("Error al insertar NuevoProyecto:", err);
          return res.status(500).send("Error al guardar el proyecto");
        });
      }

      const proyectoId = proyectoResult.insertId;
      const entriesCliente = [];
      const entriesResponsable = [];
      const entriesAuditor = [];

      // Extraer RFCs de responsables y auditores de forma dinámica
      Object.keys(req.body).forEach(key => {
        if (key.startsWith('rfc_responsable')) {
          entriesResponsable.push([proyectoId, req.body[key]]);
        } else if (key.startsWith('rfc_auditor')) {
          entriesAuditor.push([proyectoId, req.body[key]]);
        }
      });

      // Asumimos que el RFC del cliente es estático, como mencionaste antes
      entriesCliente.push([proyectoId, req.body.rfc]);

      // Funciones de inserción como anteriormente
      const multiInsert = (query, entries, callback) => {
        if (entries.length > 0) {
          connection.query(query, [entries], callback);
        } else {
          callback(null, null); // No hay entradas para insertar
        }
      };

      multiInsert('INSERT INTO ClienteProyecto (IDProyecto, RFCCliente) VALUES ?', entriesCliente, (err, results) => {
        if (err) {
          connection.rollback(() => {
            console.error("Error al insertar ClienteProyecto:", err);
            return res.status(500).send("Error al guardar el cliente del proyecto");
          });
        }

        multiInsert('INSERT INTO ResponsableProyecto (IDProyecto, RFCResponsable) VALUES ?', entriesResponsable, (err, results) => {
          if (err) {
            connection.rollback(() => {
              console.error("Error al insertar ResponsableProyecto:", err);
              return res.status(500).send("Error al guardar los responsables del proyecto");
            });
          }

          multiInsert('INSERT INTO AuditorProyecto (IDProyecto, RFCAuditor) VALUES ?', entriesAuditor, (err, results) => {
            if (err) {
              connection.rollback(() => {
                console.error("Error al insertar AuditorProyecto:", err);
                return res.status(500).send("Error al guardar los auditores del proyecto");
              });
            }

            // Si todo ha ido bien, hacemos commit
            connection.commit(err => {
              if (err) {
                connection.rollback(() => {
                  console.error("Error al hacer commit de la transacción:", err);
                  return res.status(500).send("Error al finalizar la transacción");
                });
              }
              console.log("Proyecto " + proyectoId + " creado correctamente");
              res.status(200).send("Proyecto creado correctamente");
            });
          });
        });
      });
    });
  });
});

app.post("/HOLA", (req, res) => {
  const datos = req.body;
  // console.log(datos);
  // Función para asignar un valor predeterminado si el campo está vacío
  const asignarValorPredeterminado = (campo, valorPredeterminado = "N/A") =>
    campo && campo.trim() !== "" ? campo : valorPredeterminado;

  // Convertir cada campo dinámico en una cadena numerada y delimitada
  const convertToNumberedString = (keyPrefix) => {
    const keys = Object.keys(datos)
      .filter((key) => key.startsWith(`${keyPrefix}-`))
      .sort((a, b) => parseInt(a.split("-")[1]) - parseInt(b.split("-")[1]))
      .map(
        (key, index) => `${index + 1}-${asignarValorPredeterminado(datos[key])}`
      );

    return keys.length > 0 ? keys.join(";") : "N/A";
  };

  // Procesar datos recibidos y asignar valores predeterminados si son vacíos
  const procesado = {
    id_proyecto: asignarValorPredeterminado(datos.id_proyecto),
    id_subproyecto: asignarValorPredeterminado(datos.id_subproyecto),
    id_hito: asignarValorPredeterminado(datos.id_hito),
    id_actividad: asignarValorPredeterminado(datos.id_actividad),
    id_accion: asignarValorPredeterminado(datos.id_accion),
    tipo_elemento: asignarValorPredeterminado(datos.tipo_elemento),
    rfc_auditor: asignarValorPredeterminado(datos.auditor),
    rfc_responsable: asignarValorPredeterminado(datos.auditor),
    relacion: asignarValorPredeterminado(datos.relacion),
    concepto_principal: asignarValorPredeterminado(datos.concepto_principal),
    descripcion: asignarValorPredeterminado(datos.descripcion),
    importancias: convertToNumberedString("importancia"),
    metas: convertToNumberedString("meta"),
    objetivos: convertToNumberedString("objetivo"),
    herramientas: convertToNumberedString("herramientas"),
    pasos: convertToNumberedString("pasos"),
    kpis: asignarValorPredeterminado(datos.kpis),
    dependencia: asignarValorPredeterminado(datos.dependencia),
    prioridad: asignarValorPredeterminado(datos.prioridad),
    resultado_esperado: asignarValorPredeterminado(datos.resultado_esperado),
    area_responsable: asignarValorPredeterminado(datos.area),
  };
  const query = `INSERT INTO InformacionDelElemento (IDProyecto, IDSubproyecto, IDHito, IDActividad, IDAccion, TipoDeElemento, RFCAuditor, RFCResponsable, Relacion, ConceptoPrincipal, Descripcion, Importancia, Metas, Objetivos, Kpis, Herramientas, Dependencia, Pasos, Prioridad, ResultadoEsperado, AreaResponsable) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const values = [procesado.id_proyecto, procesado.id_subproyecto, procesado.id_hito, procesado.id_actividad, procesado.id_accion, procesado.tipo_elemento, procesado.rfc_auditor, procesado.rfc_responsable, procesado.relacion, procesado.concepto_principal, procesado.descripcion, procesado.importancias, procesado.metas, procesado.objetivos, procesado.kpis, procesado.herramientas, procesado.dependencia, procesado.pasos, procesado.prioridad, procesado.resultado_esperado, procesado.area_responsable];

  connection.query(query, values, (error, results, fields) => {
    if (error) {
      console.error(error);
      res.status(500).send("Error al insertar datos");
    } else {
      console.log("Datos insertados correctamente");
      res.status(200).send("DATOS DEL ELEMENTO RECIBIDOS Y GUARDADOS");
    }
  });
});

module.exports = app;