const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'ishaiasor',
  password: process.env.DB_PASSWORD || 'ishaiasor1996',
  database: process.env.DB_NAME || 'app_db',
  port: 5432,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};