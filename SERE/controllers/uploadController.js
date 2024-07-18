const multer = require("multer");
const fs = require("fs");
const path = require("path");

// FUNCIÓN PARA CREAR EL DIRECTORIO ESPECÍFICO PARA EL USUARIO SI NO EXISTE Y CONFIGURAR MULTER PARA EL MANEJO DE ARCHIVOS
function createUploadDirForUser(IDCuenta) {
  const uploadDir = path.join(__dirname, "../uploads");
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

module.exports = { createUploadDirForUser };
