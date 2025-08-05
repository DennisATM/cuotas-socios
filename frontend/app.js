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
                      <div class="row justify-content-around">
                      <div class="col-4">
                        <button type="button" id="btnRegistrarPago" class="btn btn-primary p-1 m-0" data-bs-toggle="modal" onclick="cargarModal('${r.id}','${r.nombre}')" data-bs-target="#modalAddPay">
                          <i class="bi bi-credit-card-2-back-fill"></i>
                        </button>
                      </div>
                      <div class="col-4">
                        <button type="button" id="btnListarPago" class="btn btn-success p-1 m-0" data-bs-toggle="modal" onclick="cargarPagosPorSocio('${r.id}','${r.nombre}')" data-bs-target="#modalListPay">
                          <i class="bi bi-card-checklist"></i>
                        </button>
                      </div>
                      <div class="col-4">
                        <button type="button" class="btn btn-danger p-1 m-0" onclick="eliminarSocio('${r.id}')">
                          <i class="bi bi-trash-fill"></i>
                      </button>
                      </div>
                    </td>`;
    tbody.appendChild(tr);
  });
}

// Función para eliminar socio
const eliminarSocio = async (id) => {
  if (!confirm("¿Seguro que deseas eliminar este socio y todos sus pagos?")) return;

  const res = await fetch(`${API_URL}/socios/${id}`, { method: "DELETE" });
  const data = await res.json();

  if (res.ok) {
    alert(data.mensaje);
    cargarSocios(); // refrescar lista
  } else {
    alert(data.error || "Error al eliminar socio");
  }
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
  if (!anio) return alert("Ingrese un año válido");
  document.getElementById("btnExportarPDF").disabled = false;
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

document.getElementById("btnExportarPDF").addEventListener("click", async () => {
  
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const anio = document.getElementById("anioMensual").value;
  doc.setFontSize(10);
  doc.text(`Reporte mensual de recaudación - ${anio}`, 10, 15);

  document.getElementById("btnExportarPDF").disabled = true;
  // Capturar tabla
  const tabla = document.getElementById("tablaReporteMensual");
  
  const canvasTabla = await html2canvas(tabla);
  const imgTabla = canvasTabla.toDataURL("image/png");

  doc.addImage(imgTabla, "PNG", 10, 25, 40, 80); // ancho automático

  // Capturar gráfico
  const grafico = document.getElementById("graficoMensual");
  const canvasGrafico = await html2canvas(grafico);
  const imgGrafico = canvasGrafico.toDataURL("image/png");

  // doc.addPage();
  doc.text("Gráfico de recaudación mensual", 90, 15);
  doc.addImage(imgGrafico, "PNG", 80, 25, 80, 40);

  // Descargar
  doc.save(`reporte_mensual_${anio}.pdf`);
  
});


cargarReporteTotal();
cargarReporteSocios();