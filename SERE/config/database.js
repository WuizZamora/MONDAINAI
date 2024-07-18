const mysql = require('mysql');

// Configuración del pool de conexiones a la base de datos MySQL
const pool = mysql.createPool({
  connectionLimit: 10, // Número máximo de conexiones en el pool
  host: process.env.DB_HOST,
  user: process.env.DB_USER, // Reemplaza con tu usuario de MySQL
  password: process.env.DB_PASSWORD, // Reemplaza con tu contraseña de MySQL
  database: process.env.DATABASESERE, // Reemplaza con el nombre de tu base de datos
});

// Conexión a la base de datos con el pool
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Error de conexión a la base de datos:', err);
    return;
  }

  if (connection) {
    // console.log('Conexión a la base de datos establecida en SECIE');
    connection.release(); // Liberar la conexión después de usarla
  }
});

// Manejo de errores en el pool
pool.on('error', (err) => {
  console.error('Pool error:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.error('Conexión a la base de datos perdida');
  } else {
    throw err;
  }
});

// Mantener la conexión activa
setInterval(() => {
  pool.query('SELECT 1', (err) => {
    if (err) {
      console.error('Error ejecutando la consulta de keep-alive:', err);
    }
  });
}, 5000);

module.exports = pool;