const mysql = require("mysql");

// Configuración de la conexión a la base de datos MySQL
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER, // Reemplaza con tu usuario de MySQL
  password: process.env.DB_PASSWORD, // Reemplaza con tu contraseña de MySQL
  database: process.env.DATABASE, // Reemplaza con el nombre de tu base de datos
});

// Conexión a la base de datos
connection.connect((err) => {
  if (err) {
    console.error("Error de conexión a la base de datos:", err);
    return; // Detiene la ejecución del programa después de imprimir el error
  }
  console.log("Conexión a la base de datos establecida en SECIE");
});

module.exports = connection;