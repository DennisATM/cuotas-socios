// // 🔹 Cambia esta URL por la de tu API en Render
const API_URL = "https://cuotas-socios.onrender.com";

// // ---------- Funciones de Socios ----------
// async function cargarSocios() {
//   const res = await fetch(`${API_URL}/socios`);
//   const socios = await res.json();

//   // Llenar el select de pagos
//   const select = document.getElementById("selectSocio");
//   select.innerHTML = "";
//   socios.forEach(s => {
//     const option = document.createElement("option");
//     option.value = s.id;
//     option.textContent = `${s.id} - ${s.nombre}`;
//     select.appendChild(option);
//   });

//   // Actualizar reportes
//   if (socios.length > 0) {
//     cargarReporteSocios();
//   }
// }

// // Agregar socio
document.getElementById("btnAgregarSocio").addEventListener("click", async () => {
  const nombre = document.getElementById("nombreSocio").value.trim();
  if (!nombre) return alert("Ingrese un nombre");

  await fetch(`${API_URL}/socios`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre })
  });

  document.getElementById("nombreSocio").value = "";
  cargarReporteTotal();
  cargarReporteSocios();
});



// // ---------- Funciones de Pagos ----------
document.getElementById("btnPagoSocio").addEventListener("click", async () => {
  const socio_id = document.getElementById("idSocioPago").value;
  const monto = document.getElementById("montoPago").value;
  const mes =  document.getElementById("mesPago").value;
  const anio = document.getElementById("anioPago").value;

  if (!mes || !anio || !monto) return alert("Seleccione monto válido, mes y año");

  await fetch(`${API_URL}/pagos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ socio_id, monto, mes, anio })  
  }).then(res => {
    if (!res.ok) {
      return res.json().then(err => alert(err.error));
    }else{
      alert("Pago registrado correctamente");
    }
  });

  document.getElementById("montoPago").value = "";
  document.getElementById("mesPago").value = "";
  document.getElementById("anioPago").value = "2025";
  cargarReporteTotal();
  cargarReporteSocios();

});

// // ---------- Reportes ----------
async function cargarReporteTotal() {
  const res = await fetch(`${API_URL}/reportes/total`);
  const data = await res.json();
  document.getElementById("totalCaja").textContent = `$${Math.round(data.total)}`;
}

const cargarModal = async (id,nombre) => {
  console.log(nombre);
  document.getElementById("idSocioPago").value = id;  
  document.getElementById("nombrePago").value = await nombre;
}

async function cargarReporteSocios() {
  const res = await fetch(`${API_URL}/reportes/socios`);
  const data = await res.json();

  const tbody = document.querySelector("#tablaReporte tbody");
  tbody.innerHTML = "";
  data.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
                    <td>${r.nombre}</td>
                    <td>$${Math.round(r.total_pagado)}</td>
                    <td>
                      <div class="row">
                      <div class="col-5">
                        <button type="button" id="btnRegistrarPago" class="btn btn-primary" data-bs-toggle="modal" onclick="cargarModal('${r.id}','${r.nombre}')" data-bs-target="#modalAddPay">
                          <i class="bi bi-credit-card-2-back-fill"></i>
                        </button>
                      </div>
                      <div class="col-5">
                        <button type="button" id="btnListarPago" class="btn btn-success" data-bs-toggle="modal" onclick="cargarPagosPorSocio('${r.id}','${r.nombre}')" data-bs-target="#modalListPay">
                          <i class="bi bi-card-checklist"></i>
                        </button>
                      </div>
                      </div>
                    </td>`;
    tbody.appendChild(tr);
  });
}


// ---------- Pagos por socio ----------
async function cargarPagosPorSocio(socio_id,nombre) {
  const res = await fetch(`${API_URL}/pagos/${socio_id}`);
  const pagos = await res.json();

  const lista = document.getElementById("listaPagos");

  document.getElementById("tituloListaPagos").textContent = `Listado de pagos de: ${nombre}`;
  lista.innerHTML = "";
  arrayMeses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  pagos.forEach(p => {
    const tr = document.createElement("tr");
    fecha = new Date(p.fecha).toLocaleDateString("es-ES");
    tr.innerHTML = `<td> $${Math.round(p.monto)}</td><td>${arrayMeses[p.mes+1]}<td>${p.anio}</td><td> ${fecha}</td>`;
    lista.appendChild(tr);
  });
}

// ---------- REPORTE MENSUAL ----------
let chartMensual = null;

document.getElementById("btnReporteMensual").addEventListener("click", () => {
  const anio = document.getElementById("anioMensual").value;
  cargarReporteMensual(anio);
});

async function cargarReporteMensual(anio) {
  const res = await fetch(`${API_URL}/reporte-mensual/${anio}`);
  const data = await res.json();

  // Llenar tabla
  const tbody = document.querySelector("#tablaReporteMensual tbody");
  tbody.innerHTML = "";
  data.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${r.mes}</td><td>$${r.total}</td>`;
    tbody.appendChild(tr);
  });

  // Crear gráfico
  const ctx = document.getElementById("graficoMensual").getContext("2d");
  if (chartMensual) chartMensual.destroy();

  chartMensual = new Chart(ctx, {
    type: "bar",
    data: {
      labels: data.map(r => r.mes),
      datasets: [{
        label: `Recaudación ${anio}`,
        data: data.map(r => r.total),
        backgroundColor: "#4CAF50"
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: `Recaudación mensual del ${anio}`
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { callback: v => `$${v}` }
        }
      }
    }
  });
}


// // Cambiar lista de pagos al cambiar socio
// document.getElementById("selectSocio").addEventListener("change", (e) => {
//   cargarPagosPorSocio(e.target.value);
// });

// // Inicial
// cargarSocios();
// cargarReporteTotal();

// ---------- SOCIOS ----------
// async function cargarSocios() {
//   const res = await fetch(`${API_URL}/socios`);
//   const socios = await res.json();

//   const select = document.getElementById("selectSocio");
//   select.innerHTML = "";
//   socios.forEach(s => {
//     const option = document.createElement("option");
//     option.value = s.id;
//     option.textContent = `${s.id} - ${s.nombre}`;
//     select.appendChild(option);
//   });

//   if (socios.length > 0) {
//     cargarReporteCuotas(socios[0].id);
//   }
// }

// document.getElementById("btnAgregarSocio").addEventListener("click", async () => {
//   const nombre = document.getElementById("nombreSocio").value.trim();
//   if (!nombre) return alert("Ingrese un nombre");

//   await fetch(`${API_URL}/socios`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ nombre })
//   });

//   document.getElementById("nombreSocio").value = "";
//   cargarSocios();
// });

// ---------- PAGOS ----------
// document.getElementById("btnRegistrarPago").addEventListener("click", async () => {
//   const socio_id = document.getElementById("selectSocio").value;
//   const monto = document.getElementById("montoPago").value;
//   const mes = document.getElementById("mesPago").value;
//   const anio = document.getElementById("anioPago").value;

//   if (!socio_id || !monto || !mes ) {
//     return alert("Complete todos los campos del pago");
//   }

//   const res = await fetch(`${API_URL}/pagos`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ socio_id, monto, mes, anio })
//   });

//   if (!res.ok) {
//     const error = await res.json();
//     alert(error.error);
//     return;
//   }

//   document.getElementById("montoPago").value = "";
//   document.getElementById("mesPago").value = "";
  
//   cargarReporteCuotas(socio_id, anio);
// });

// Cambiar socio → actualizar reporte
// document.getElementById("selectSocio").addEventListener("change", e => {
//   const socio_id = e.target.value;
//   const anio = document.getElementById("anioPago").value;
//   cargarReporteCuotas(socio_id, anio);
// });

// ---------- REPORTE DE CUOTAS ----------
// async function cargarReporteCuotas(socio_id, anio = new Date().getFullYear()) {
//   const res = await fetch(`${API_URL}/cuotas-pendientes/${socio_id}/${anio}`);
//   const data = await res.json();

//   const contenedor = document.getElementById("reporteCuotas");
//   contenedor.innerHTML = "";

//   const grid = document.createElement("div");
//   grid.className = "cuotas-grid";

//   data.forEach(cuota => {
//     const div = document.createElement("div");
//     div.className = `cuota ${cuota.pagado ? "pagada" : "pendiente"}`;
//     div.textContent = cuota.mes.substring(0, 3); // Ene, Feb, ...
//     grid.appendChild(div);
//   });

//   contenedor.appendChild(grid);
// }

// ---------- REPORTE GENERAL ANUAL ----------
// document.getElementById("btnReporteAnual").addEventListener("click", () => {
//   const anio = document.getElementById("anioReporte").value;
//   cargarReporteAnual(anio);
// });

// async function cargarReporteAnual(anio) {
//   const res = await fetch(`${API_URL}/reporte-anual/${anio}`);
//   const data = await res.json();

//   const tbody = document.querySelector("#tablaReporteAnual tbody");
//   tbody.innerHTML = "";

//   data.forEach(r => {
//     const tr = document.createElement("tr");
//     tr.innerHTML = `
//       <td>${r.nombre}</td>
//       <td>${r.pagados}</td>
//       <td>${r.pendientes}</td>
//       <td class="${r.estado === "Al día" ? "al-dia" : "pendiente"}">${r.estado}</td>
//     `;
//     tbody.appendChild(tr);
//   });
// }

// Inicial
// cargarSocios();
cargarReporteTotal();
cargarReporteSocios();