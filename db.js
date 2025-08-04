import { Pool } from "pg";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Render la pone automáticamente
  ssl: { rejectUnauthorized: false }          // Necesario para conexión segura
});

