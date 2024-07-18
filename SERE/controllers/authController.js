const bcrypt = require("bcrypt"); // Encriptación de contraseña
const pool = require("../config/database"); // Importa la conexión a la base de datos

// PREALTA PARA HABILITAR EL REGISTRO DE NUEVOS USUARIOS EN EL SISTEMA
exports.PreAlta = (req, res) => {
  const { Nombre, RFC } = req.body;
  const query =
    "INSERT INTO PreregistroDespachoEmpresa (Nombre, RFC) VALUES (?, ?)";

  pool.query(query, [Nombre, RFC], (err, result) => {
    if (err) {
      return res.status(500).send("Error al guardar en la base de datos");
    }
    res.send("Registro guardado exitosamente");
  });
};

// VERIFICACIÓN DE LA VALIDEZ DEL RFC ASOCIADO PARA ALTA DE USUARIOS
exports.getNombrePorRFC = (req, res) => {
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
};

// ALTA DE NUEVOS USUARIOS EN EL SISTEMA
exports.altaUsuario = (req, res) => {
  console.log(req.body);
  const { correo, nombre, contrasena, rfc, rfcAsociado } = req.body;
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
};

// INICIO DE SESIÓN DE USUARIOS
exports.login = (req, res) => {
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
};

// ASIGNACIÓN DEL ID DE PERFIL A UN USUARIO POR EMPRESA O CLIENTE
exports.updatePerfil = (req, res) => {
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
};
