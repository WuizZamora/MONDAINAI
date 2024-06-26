const connection = require("../config/database");
const express = require("express");
const ejs = require("ejs");
const path = require("path");
const app = express();

// Middleware para verificar si el usuario ha iniciado sesión
const verificarAutenticacion = (req, res, next) => {
    if (req.session.usuario) {
        console.log(req.session.usuario);
        next();
    } else {
        res.redirect("/secie/login"); // Cambiar la ruta de redirección
    }
};
// Aplicar el middleware de autenticación a todas las rutas que lo requieran
app.use(verificarAutenticacion);

app.set("views", path.join(__dirname, "..", "views"));

// Configurar EJS como motor de plantillas
app.set("view engine", "ejs");

// Ruta para obtener y mostrar la información en una tabla
app.get('/', (req, res) => {
    // Extraer RFCUsuario de la sesión
    const { RFCUsuario } = req.session.usuario;

    // Primera consulta: Datos del usuario
    connection.query(
        "SELECT * FROM Usuario WHERE RFCUsuario = ?",
        [RFCUsuario], // RFC del usuario de la sesión
        (error, resultsUsuario, fields) => {
            if (error) {
                console.error("Error al ejecutar la consulta del usuario: ", error);
                res.status(500).send("Error al obtener los datos del usuario");
                return;
            }

            // Segunda consulta: Datos de los proyectos
            connection.query(
                "SELECT * FROM NuevoProyecto",
                (error, resultsProyectos, fields) => {
                    if (error) {
                        console.error(
                            "Error al ejecutar la consulta de proyectos: ",
                            error
                        );
                        res.status(500).send("Error al obtener los datos de los proyectos");
                        return;
                    }

                    // Organiza los proyectos por categorías
                    let proyectosPorCategoria = {
                        "Diseño de negocio": [],
                        "Plan de PUV": [],
                        "Planes de Suministro": [],
                        "Cimiento Integral Empresarial": [],
                        "Estabilidad financiera": [],
                        "Sistema de Negocio": [],
                        "Gestión de contingencias": [],
                    };

                    resultsProyectos.forEach((proyecto) => {
                        if (proyectosPorCategoria.hasOwnProperty(proyecto.TipoDeProyecto)) {
                            proyectosPorCategoria[proyecto.TipoDeProyecto].push(proyecto);
                        }
                    });

                    // Renderizar la plantilla con ambos resultados y los proyectos organizados
                    res.render("index", {
                        usuario: resultsUsuario,
                        proyectosPorCategoria: proyectosPorCategoria,
                    });
                }
            );
        }
    );
});

app.get("/IndexPartials", (req, res) => {
    const { RFCUsuario } = req.session.usuario;

    const query = `
        SELECT np.IDProyecto, np.TipoDeProyecto, np.BreveDescripcion
        FROM NuevoProyecto np
        WHERE EXISTS (
            SELECT 1 FROM ResponsableProyecto rp WHERE rp.IDProyecto = np.IDProyecto AND rp.RFCResponsable = ?
        ) OR EXISTS (
            SELECT 1 FROM AuditorProyecto ap WHERE ap.IDProyecto = np.IDProyecto AND ap.RFCAuditor = ?
        ) OR EXISTS (
            SELECT 1 FROM ClienteProyecto cp WHERE cp.IDProyecto = np.IDProyecto AND cp.RFCCliente = ?
        )
    `;

    connection.query(query, [RFCUsuario, RFCUsuario, RFCUsuario], (err, results) => {
        if (err) {
            console.error('Error al realizar la consulta', err);
            return res.status(500).send('Error en la base de datos');
        }
        res.render("index-partials", { proyectos: results });
    });
});


app.get('/AgregarElemento',(req, res) => {
    const idProyecto = req.query.IDProyecto; // Capturar el IDProyecto de la URL

    if (!idProyecto) {
        res.status(400).send("IDProyecto es requerido");
        return;
    }

    let queryResponsables = `
            SELECT u.Nombre, u.RFCUsuario
            FROM ResponsableProyecto rp
            JOIN Usuario u ON rp.RFCResponsable = u.RFCUsuario
            WHERE rp.IDProyecto = ?`;

    let queryAuditores = `
            SELECT u.Nombre, u.RFCUsuario
            FROM AuditorProyecto ap
            JOIN Usuario u ON ap.RFCAuditor = u.RFCUsuario
            WHERE ap.IDProyecto = ?`;

    connection.query(queryResponsables, [idProyecto], (errorResponsables, responsables) => {
        if (errorResponsables) {
            console.error('Error en la consulta de responsables: ', errorResponsables);
            res.render('NuevoElemento', { responsables: [], auditores: [] });
            return;
        }

        connection.query(queryAuditores, [idProyecto], (errorAuditores, auditores) => {
            if (errorAuditores) {
                console.error('Error en la consulta de auditores: ', errorAuditores);
                res.render('NuevoElemento', { responsables, auditores: [] });
                return;
            }

            res.render('NuevoElemento', { responsables, auditores });
        });
    });
});

app.get("/NuevoProyecto", (req, res) => {
    res.render("NuevoProyecto");
});

// app.get("/AgregarElemento", verificarAutenticacion, (req, res) => {
//     res.render("NuevoElemento");
// });

// GET PARA LAS INTERFACES DE LOS FORMULARIOS
app.get("/get-nombre", (req, res) => {
    const rfc = req.query.rfc;
    connection.query(
        "SELECT nombre FROM Usuario WHERE RFCUsuario = ?",
        [rfc],
        (error, results, fields) => {
            if (error) {
                console.error("Error al ejecutar la consulta: ", error);
                res.status(500).json({ error: "Error al obtener los datos" });
                return;
            }
            if (results.length > 0) {
                res.json({ nombre: results[0].nombre });
            } else {
                res.json({ nombre: "" }); // No se encontró el RFC
            }
        }
    );
});

app.get("/get-nombre-responsable", (req, res) => {
    const rfc = req.query.rfc;
    if (!rfc) {
        return res.status(400).json({ error: "RFC es requerido" });
    }
    connection.query(
        "SELECT Nombre, IDPerfil FROM Usuario WHERE RFCUsuario = ?",
        [rfc],
        (error, results) => {
            if (error) {
                console.error("Error en la consulta:", error);
                return res.status(500).json({ error: "Error interno del servidor" });
            }
            if (results.length > 0) {
                const result = results[0];
                res.json({ nombre: result.Nombre, idPerfil: result.IDPerfil });
            } else {
                res
                    .status(404)
                    .json({
                        error: "No se encontró el usuario con el RFC proporcionado",
                    });
            }
        }
    );
});

app.get("/get-nombre-auditor", (req, res) => {
    const rfc = req.query.rfc;
    if (!rfc) {
        return res.status(400).json({ error: "RFC es requerido" });
    }
    connection.query(
        "SELECT Nombre, IDPerfil FROM Usuario WHERE RFCUsuario = ?",
        [rfc],
        (error, results) => {
            if (error) {
                console.error("Error en la consulta:", error);
                return res.status(500).json({ error: "Error interno del servidor" });
            }
            if (results.length > 0) {
                const result = results[0];
                res.json({ nombre: result.Nombre, idPerfil: result.IDPerfil });
            } else {
                res
                    .status(404)
                    .json({
                        error: "No se encontró el usuario con el RFC proporcionado",
                    });
            }
        }
    );
});

app.get("/get-idElemento", (req, res) => {
    const idProyecto = req.query.principal;
    const tipoElemento = req.query.tipoElemento;

    // Definimos qué columnas buscar según el tipo de elemento
    const queries = {
        subproyecto: `
        SELECT 
          (SELECT IFNULL(MAX(IDSubproyecto), 0) + 1 FROM InformacionDelElemento WHERE IDProyecto = ?) AS subproyecto,
          0 AS hito,
          0 AS actividad,
          0 AS accion
      `,
        hito: `
        SELECT 
          (SELECT MAX(IDSubproyecto) FROM InformacionDelElemento WHERE IDProyecto = ?) AS subproyecto,
          (SELECT IFNULL(MAX(IDHito), 0) + 1 FROM InformacionDelElemento WHERE IDProyecto = ? AND IDSubproyecto = (SELECT MAX(IDSubproyecto) FROM InformacionDelElemento WHERE IDProyecto = ?)) AS hito,
          0 AS actividad,
          0 AS accion
      `,
        actividad: `
        SELECT 
          (SELECT MAX(IDSubproyecto) FROM InformacionDelElemento WHERE IDProyecto = ?) AS subproyecto,
          (SELECT MAX(IDHito) FROM InformacionDelElemento WHERE IDProyecto = ? AND IDSubproyecto = (SELECT MAX(IDSubproyecto) FROM InformacionDelElemento WHERE IDProyecto = ?)) AS hito,
          (SELECT IFNULL(MAX(IDActividad), 0) + 1 FROM InformacionDelElemento WHERE IDProyecto = ? AND IDSubproyecto = (SELECT MAX(IDSubproyecto) FROM InformacionDelElemento WHERE IDProyecto = ?) AND IDHito = (SELECT MAX(IDHito) FROM InformacionDelElemento WHERE IDProyecto = ?)) AS actividad,
          0 AS accion
      `,
        accion: `
    SELECT 
      (SELECT MAX(IDSubproyecto) FROM InformacionDelElemento WHERE IDProyecto = ?) AS subproyecto,
      (SELECT MAX(IDHito) FROM InformacionDelElemento WHERE IDProyecto = ? AND IDSubproyecto = (SELECT MAX(IDSubproyecto) FROM InformacionDelElemento WHERE IDProyecto = ?)) AS hito,
      (SELECT MAX(IDActividad) FROM InformacionDelElemento WHERE IDProyecto = ? AND IDSubproyecto = (SELECT MAX(IDSubproyecto) FROM InformacionDelElemento WHERE IDProyecto = ?) AND IDHito = (SELECT MAX(IDHito) FROM InformacionDelElemento WHERE IDProyecto = ?)) AS actividad,
      (SELECT IFNULL(MAX(IDAccion), 0) + 1 FROM InformacionDelElemento WHERE IDProyecto = ? AND IDSubproyecto = (SELECT MAX(IDSubproyecto) FROM InformacionDelElemento WHERE IDProyecto = ?) AND IDHito = (SELECT MAX(IDHito) FROM InformacionDelElemento WHERE IDProyecto = ?) AND IDActividad = (SELECT MAX(IDActividad) FROM InformacionDelElemento WHERE IDProyecto = ?)) AS accion
  `,
    };

    let query = queries[tipoElemento] || null;

    if (!query) {
        res.status(400).json({ error: "Tipo de elemento no válido" });
        return;
    }

    // Asegurarse de que la cantidad de parámetros coincida con los signos de interrogación en la consulta.
    let params = [];
    switch (tipoElemento) {
        case "subproyecto":
            params = [idProyecto];
            break;
        case "hito":
            params = [idProyecto, idProyecto, idProyecto];
            break;
        case "actividad":
            params = [
                idProyecto,
                idProyecto,
                idProyecto,
                idProyecto,
                idProyecto,
                idProyecto,
            ];
            break;
        case "accion":
            params = [
                idProyecto,
                idProyecto,
                idProyecto,
                idProyecto,
                idProyecto,
                idProyecto,
                idProyecto,
                idProyecto,
                idProyecto,
                idProyecto,
                idProyecto,
                idProyecto,
            ];
            break;
    }

    // Ejecutar la consulta apropiada
    connection.query(query, params, (error, results, fields) => {
        if (error) {
            console.error("Error al ejecutar la consulta: ", error);
            res.status(500).json({ error: "Error al obtener los datos" });
            return;
        }

        if (results.length > 0) {
            const result = results[0];
            res.json(result);
        } else {
            res.json({
                subproyecto: 0,
                hito: 0,
                actividad: 0,
                accion: 0,
            });
        }
    });
});

module.exports = app;