// 🔹 Cambia esta URL por la de tu API en Render
const API_URL = "https://cuotas-socios.onrender.com";

// ---------- Funciones de Socios ----------
async function cargarSocios() {
  const res = await fetch(`${API_URL}/socios`);
  const socios = await res.json();

  // Llenar el select de pagos
  const select = document.getElementById("selectSocio");
  select.innerHTML = "";
  socios.forEach(s => {
    const option = document.createElement("option");
    option.value = s.id;
    option.textContent = `${s.id} - ${s.nombre}`;
    select.appendChild(option);
  });

  // Actualizar reportes
  cargarReporteSocios();
}

// Agregar socio
document.getElementById("btnAgregarSocio").addEventListener("click", async () => {
  const nombre = document.getElementById("nombreSocio").value.trim();
  if (!nombre) return alert("Ingrese un nombre");

  await fetch(`${API_URL}/socios`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre })
  });

  document.getElementById("nombreSocio").value = "";
  cargarSocios();
});

// ---------- Funciones de Pagos ----------
document.getElementById("btnRegistrarPago").addEventListener("click", async () => {
  const socio_id = document.getElementById("selectSocio").value;
  const monto = document.getElementById("montoPago").value;

  if (!socio_id || !monto) return alert("Seleccione socio y monto válido");

  await fetch(`${API_URL}/pagos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ socio_id, monto })
  });

  document.getElementById("montoPago").value = "";
  cargarReporteTotal();
  cargarReporteSocios();
  cargarPagosPorSocio(socio_id);
});

// ---------- Reportes ----------
async function cargarReporteTotal() {
  const res = await fetch(`${API_URL}/reportes/total`);
  const data = await res.json();
  document.getElementById("totalCaja").textContent = `$${data.total}`;
}

async function cargarReporteSocios() {
  const res = await fetch(`${API_URL}/reportes/socios`);
  const data = await res.json();

  const tbody = document.querySelector("#tablaReporte tbody");
  tbody.innerHTML = "";
  data.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${r.nombre}</td><td>$${r.total_pagado}</td>`;
    tbody.appendChild(tr);
  });
}

// ---------- Pagos por socio ----------
async function cargarPagosPorSocio(socio_id) {
  const res = await fetch(`${API_URL}/pagos/${socio_id}`);
  const pagos = await res.json();

  const lista = document.getElementById("listaPagos");
  lista.innerHTML = "";
  pagos.forEach(p => {
    const li = document.createElement("li");
    li.textContent = `Pago $${p.monto} - ${p.fecha}`;
    lista.appendChild(li);
  });
}

// Cambiar lista de pagos al cambiar socio
document.getElementById("selectSocio").addEventListener("change", (e) => {
  cargarPagosPorSocio(e.target.value);
});

// Inicial
cargarSocios();
cargarReporteTotal();