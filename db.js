// import { Pool } from "pg";

// export const pool = new Pool({
//   connectionString: process.env.DATABASE_URL, // Render la pone automáticamente
//   ssl: { rejectUnauthorized: false }          // Necesario para conexión segura
// });

import pkg from 'pg';
const { Pool } = pkg;

export const pool = new Pool({
  host: 'ep-dawn-frog-acmo2yd4-pooler.sa-east-1.aws.neon.tech',
  user: 'neondb_owner',
  password: 'npg_0k7DAxhwLzlP',
  database: 'neondb',
  port: 5432,
  ssl: { rejectUnauthorized: false } // necesario para Neon
});