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
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pagos (
    id SERIAL PRIMARY KEY,
    socio_id INT REFERENCES socios(id) ON DELETE CASCADE,
    monto NUMERIC(10,2) NOT NULL,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE
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


// Registrar pago
app.post("/pagos", async (req, res) => {
  try {
    const { socio_id, monto } = req.body;
    const result = await pool.query(
      "INSERT INTO pagos(socio_id, monto) VALUES($1, $2) RETURNING *",
      [socio_id, monto]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Listar pagos por socio
app.get("/pagos/:socio_id", async (req, res) => {
  try {
    const { socio_id } = req.params;
    const result = await pool.query(
      "SELECT * FROM pagos WHERE socio_id=$1 ORDER BY fecha DESC",
      [socio_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reporte: total en caja
app.get("/reportes/total", async (req, res) => {
  try {
    const result = await pool.query("SELECT COALESCE(SUM(monto),0) as total FROM pagos");
    res.json({ total: result.rows[0].total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reporte: resumen por socio
app.get("/reportes/socios", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.id, s.nombre, COALESCE(SUM(p.monto),0) AS total_pagado
      FROM socios s
      LEFT JOIN pagos p ON s.id = p.socio_id
      GROUP BY s.id
      ORDER BY s.id;
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Puerto para Render o local
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));