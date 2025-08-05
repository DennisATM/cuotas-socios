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
        fecha DATE NOT NULL DEFAULT CURRENT_DATE,
        mes INT NOT NULL CHECK (mes >= 1 AND mes <= 12),
        anio INT NOT NULL
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

// Registrar pago mensual
app.post("/pagos", async (req, res) => {
  try {
    const { socio_id, monto, mes, anio } = req.body;

    // Validar si ya existe un pago para ese mes/año
    const existe = await pool.query(
      "SELECT 1 FROM pagos WHERE socio_id=$1 AND mes=$2 AND anio=$3",
      [socio_id, mes, anio]
    );

    if (existe.rows.length > 0) {
      return res.status(400).json({ error: "Ya existe un pago para este mes y año" });
    }

    const result = await pool.query(
      "INSERT INTO pagos(socio_id, monto, mes, anio) VALUES($1,$2,$3,$4) RETURNING *",
      [socio_id, monto, mes, anio]
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
      "SELECT * FROM pagos WHERE socio_id=$1 ORDER BY anio DESC, mes DESC",
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

// Cuotas pendientes por socio (año actual)
app.get("/cuotas-pendientes/:socio_id/:anio", async (req, res) => {
  const { socio_id, anio } = req.params;
  const meses = [
    "Enero","Febrero","Marzo","Abril","Mayo","Junio",
    "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
  ];

  try {
    // Obtener pagos de ese socio y año
    const result = await pool.query(
      "SELECT mes FROM pagos WHERE socio_id=$1 AND anio=$2",
      [socio_id, anio]
    );

    const mesesPagados = result.rows.map(r => r.mes);

    // Armar reporte de cada mes con estado
    const reporte = meses.map((nombre, index) => ({
      mes: nombre,
      numeroMes: index + 1,
      pagado: mesesPagados.includes(index + 1)
    }));

    res.json(reporte);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reporte de recaudación mensual por año
app.get("/reporte-mensual/:anio", async (req, res) => {
  const { anio } = req.params;
  const meses = [
    "Enero","Febrero","Marzo","Abril","Mayo","Junio",
    "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
  ];

  try {
    // Totalizar pagos por mes del año dado
    const result = await pool.query(`
      SELECT mes, COALESCE(SUM(monto),0) AS total
      FROM pagos
      WHERE anio = $1
      GROUP BY mes
      ORDER BY mes;
    `, [anio]);

    // Pasamos a un formato con los 12 meses
    const datos = Array.from({ length: 12 }, (_, i) => {
      const fila = result.rows.find(r => Number(r.mes) === i+1);
      return {
        mes: meses[i],
        total: fila ? Number(fila.total) : 0
      };
    });

    res.json(datos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Reporte general de cuotas por año
app.get("/reporte-anual/:anio", async (req, res) => {
  const { anio } = req.params;

  try {
    // Traer todos los socios
    const socios = await pool.query("SELECT id, nombre FROM socios");

    // Traer todos los pagos del año
    const pagos = await pool.query(
      "SELECT socio_id, mes FROM pagos WHERE anio = $1",
      [anio]
    );

    const pagosPorSocio = {};
    pagos.rows.forEach(p => {
      if (!pagosPorSocio[p.socio_id]) pagosPorSocio[p.socio_id] = new Set();
      pagosPorSocio[p.socio_id].add(p.mes);
    });

    // Armar reporte
    const reporte = socios.rows.map(socio => {
      const mesesPagados = pagosPorSocio[socio.id]?.size || 0;
      const mesesPendientes = 12 - mesesPagados;

      return {
        id: socio.id,
        nombre: socio.nombre,
        pagados: mesesPagados,
        pendientes: mesesPendientes,
        estado: mesesPagados === 12 ? "Al día" : "Pendiente"
      };
    });

    res.json(reporte);
    
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Puerto para Render o local
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));