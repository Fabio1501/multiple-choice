const { Pool } = require('pg');
require('dotenv').config(); // Carga las variables de .env

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Si tu proveedor de DB requiere SSL (como Heroku, Render, etc.)
    // ssl: {
    //   rejectUnauthorized: false
    // }
});

module.exports = {
    query: (text, params) => pool.query(text, params),
};