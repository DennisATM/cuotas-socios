// 🔹 Cambia esta URL por la de tu API en Render
const API_URL = "https://cuotas-socios.onrender.com";

document.getElementById('btnRepoAnual').addEventListener("click", async ()=>{
  anio=document.getElementById('anioMensual').value;
  document.getElementById('tituloListaPagosAnual').innerHTML=`Reporte Anual por socio/mes del año ${anio}`;

  fetch(`${API_URL}/reporte-pagos/${anio}`)
    .then(res => res.json())
    .then(data => {
      let totalMes = Array(12).fill(0);
      let totalGeneral = 0;
      let html = "";
    
      data.forEach(row => {
        html += `<tr>
                <td scope="col-2" class="text-primary bg-light">${row.socio}</td>`;
                  for (let i = 0; i < 12; i++) {
                    const mesValue = Object.values(row)[i + 1] || 0;
                    totalMes[i] += Number(mesValue);

                    html += `<td>${Math.round(mesValue)}</td>`;
                  }
                  html += `<td class="fw-bold">${Math.round(row.total_socio)}</td>`;
                  totalGeneral += Number(row.total_socio);
                  html += `</tr>`;
                });

      // Fila de totales
      html += `
        <td class="fw-bold text-danger">Total Mes</td>`;
    
      totalMes.forEach(t => {
        html += `<td class="fw-bold text-danger">${t}</td>`;
      });
      html += `<td class="fw-bold text-danger">${totalGeneral}</td>`;

      document.getElementById("reporte").innerHTML = html;

      // imprimirPdf(data, anio, totalMes, totalGeneral);
      document.getElementById('dataObject').value = JSON.stringify(data);
      document.getElementById('anio').value = anio;
      document.getElementById('totalMes').value = totalMes;
      document.getElementById('totalGeneral').value = totalGeneral;
    
    });
    
  });

document.getElementById('btnPdf').addEventListener("click", () =>{
  imprimirPdf();
})

const imprimirPdf =  async () =>{
  
  // --- Aquí empieza la generación del PDF ---
  let data = JSON.parse(document.getElementById('dataObject').value);
  let anio = document.getElementById('anio').value;
  let pagoMes = document.getElementById('totalMes').value;
  let totalMes = pagoMes.split(',');

  let totalGeneral = document.getElementById('totalGeneral').value;

  console.log(data);
  console.log(totalMes[0]);
  console.log(totalGeneral)

  // Crear instancia de jsPDF
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Definir columnas: Socio + 12 meses + Total
  const columns = [
    { header: 'Socio', dataKey: 'socio' },
    { header: 'Ene', dataKey: '1' },
    { header: 'Feb', dataKey: '2' },
    { header: 'Mar', dataKey: '3' },
    { header: 'Abr', dataKey: '4' },
    { header: 'May', dataKey: '5' },
    { header: 'Jun', dataKey: '6' },
    { header: 'Jul', dataKey: '7' },
    { header: 'Ago', dataKey: '8' },
    { header: 'Sep', dataKey: '9' },
    { header: 'Oct', dataKey: '10' },
    { header: 'Nov', dataKey: '11' },
    { header: 'Dic', dataKey: '12' },
    { header: 'Total', dataKey: 'total_socio' },
  ];

  // Preparar datos para jsPDF autoTable
  const rows = data.map(row => {
    let obj = { socio: row.socio };
    for (let i = 1; i <= 12; i++) {
      obj[i] = Math.round(row[`mes${i}`]) || Math.round(Object.values(row)[i]) || 0;
    }
    obj.total_socio = Math.round(row.total_socio);
    return obj;
  });

  // Agregar fila total mes al final
  let totalRow = { socio: "Total Mes" };
  for (let i = 0; i < 12; i++) {
    totalRow[i + 1] = totalMes[i];
  }
  
  totalRow.total_socio = totalGeneral;

  // Agregar título
  doc.setFontSize(14);
  doc.text(`Reporte Anual por socio/mes del año ${anio}`, 14, 20);

  // Crear tabla
  doc.autoTable({
    startY: 30,
    columns: columns,
    body: rows,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [22, 160, 133] }, // verde azulado
    footStyles: { fillColor: [231, 76, 60] },  // rojo para totales
    foot: [totalRow],
    columnStyles: {
    socio: { halign: 'left' }, // primera columna texto
    1: { halign: 'right' },
    2: { halign: 'right' },
    3: { halign: 'right' },
    4: { halign: 'right' },
    5: { halign: 'right' },
    6: { halign: 'right' },
    7: { halign: 'right' },
    8: { halign: 'right' },
    9: { halign: 'right' },
    10: { halign: 'right' },
    11: { halign: 'right' },
    12: { halign: 'right' },
    total_socio: { halign: 'right', fontStyle: 'bold'},
  }
  });

  // Descargar PDF
  doc.save(`reporte_pagos_${anio}.pdf`);

};

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
  cargarReporteTotal();
  cargarReporteSocios();
});

// ---------- Funciones de Pagos ----------
document.getElementById("btnPagoSocio").addEventListener("click", async () => {
  const socio_id = document.getElementById("idSocioPago").value;
  const monto = document.getElementById("montoPago").value;
  const mes =  document.getElementById("mesPago").value;
  const anio = document.getElementById("anioPago").value;

  if (!mes || !anio || !monto) return alert("Seleccione monto válido, mes y año");

  if(Number(anio)<2020 || Number(anio)>2030) return alert("El año ingresado no es válido, debe ser un número entre 2020 y 2030");

  if(Number(monto)<0 || isNaN(Number(monto))) return alert('El monto debe ser un número mayor que cero');
  
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

document.getElementById("btnActualizarPagoSocio").addEventListener("click", async () => {
  
  const id = document.getElementById('editIdPago').value;
  const socio_id = document.getElementById("editIdSocioPago").value;
  const monto = document.getElementById("editMontoPago").value;
  const mes =  document.getElementById("editMesPago").value;
  const anio = document.getElementById("editAnioPago").value;
  
  if(Number(anio)<2020 || Number(anio)>2030) return alert('Entrada de año no válida, debe estár entre 2020 y 2030');
  
  if(Number(monto) < 0 || isNaN(Number(monto))) return alert('El monto debe ser un número positivo');

  await fetch(`${API_URL}/pagos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ socio_id, monto, mes, anio })  
  }).then(res => {
    if (!res.ok) {
      return res.json().then(err => alert(err.error));
    }else{
      alert("Pago actualizado correctamente");
    }
  });

  document.getElementById("editMontoPago").value = "";
  document.getElementById("editMesPago").value = "";
  document.getElementById("editAnioPago").value = "2025";
  cargarReporteTotal();
  cargarReporteSocios();

})

const abrirModalEditarCuota = async (id, socio_id, mes, anio, cuota) => {
  console.log(await id, socio_id, mes, anio, cuota);
  document.getElementById('editIdSocioPago').value = socio_id;
  document.getElementById('editIdPago').value = id;
  document.getElementById('editMontoPago').value = cuota;
  document.getElementById('editMesPago').value = mes;
  document.getElementById('editAnioPago').value = anio;
}

// ---------- Reportes ----------
async function cargarReporteTotal() {
  const res = await fetch(`${API_URL}/reportes/total`);
  const data = await res.json();
  document.getElementById("totalCaja").textContent = `$${Math.round(data.total)}`;
}

const cargarModal = async (id,nombre) => {
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
      cargarReporteTotal(); // refrescar lista
      cargarReporteSocios();
  } else {
    alert(data.error || "Error al eliminar socio");
      cargarReporteTotal();
      cargarReporteSocios();
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
    tr.innerHTML = `
                    <td> $${Math.round(p.monto)}</td>
                    <td>${arrayMeses[p.mes-1]}</td>
                    <td>${p.anio}</td>
                    <td> ${fecha}</td>
                    <td> 
                      <button id="btnEditarCuota" data-bs-toggle="modal" data-bs-target="#modalEditPay" onclick="abrirModalEditarCuota(${p.id}, ${p.socio_id}, ${p.mes},${p.anio}, ${p.monto})" type="button" class="btn btn-warning m-0 p-1">
                        <i class="bi bi-pencil-fill"></i>
                      </button>
                    </td>
                    <td>
                      <button id="btnEditarCuota" data-bs-toggle="modal" data-bs-target="#modalDeletePay" onclick="eliminarPago(${p.id})" type="button" class="btn btn-danger m-0 p-1">
                        <i class="bi bi-trash"></i>
                      </button>
                    </td>
                    `;
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

// Exportar reporte mensual a PDF
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

// Cargar reportes al inicio
cargarReporteTotal();
cargarReporteSocios();