import express from "express";
import cors from "cors";
import {pool} from "./db.js"; // Importar pool de conexiones
 
const app = express();
app.use(cors());
app.use(express.json());

// Ruta de prueba
app.get("/", (req, res) => {
  res.send("API de Cobro de Cuotas con PostgreSQL 🚀");
});

//Crear tabla socios si no existe (ejecutar una vez al iniciar)
const crearTablas = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS socios (
      id SERIAL PRIMARY KEY,
      nombre TEXT NOT NULL
    );
  `);
};
crearTablas();

// Listar socios
app.get("/socios", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM socios ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Agregar socio
app.post("/socios", async (req, res) => {
  try {
    const { nombre } = req.body;
    const result = await pool.query(
      "INSERT INTO socios(nombre) VALUES($1) RETURNING *",
      [nombre]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Puerto para Render o local
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));