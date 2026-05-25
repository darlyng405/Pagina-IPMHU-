// ui.js — Construye HTML a partir de datos limpios (sin fetch, sin lógica de negocio)

/**
 * Escapa caracteres HTML especiales para prevenir XSS.
 */
function s(val) {
    if (val === null || val === undefined) return '';
    return String(val)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ==================== PERFIL REUTILIZABLE ====================
export function renderPerfil(usuario) {
    const rol = usuario.rol;
    if (rol === 'Estudiante') {
        return `
            <div class="card">
                <h3>Mi Perfil</h3>
                <div class="grid">
                    <div><label>Nombre</label><input value="${s(usuario.nombre_completo)}" readonly></div>
                    <div><label>Curso</label><input value="${s(usuario.curso)}" readonly></div>
                    <div><label>ID</label><input value="${s(usuario.id_sistema)}" readonly></div>
                </div>
                <div class="grid">
                    <div><label>Padre</label><input value="${s(usuario.nombre_padre)} (${s(usuario.tel_padre) || 'S/N'})" readonly></div>
                    <div><label>Madre</label><input value="${s(usuario.nombre_madre)} (${s(usuario.tel_madre) || 'S/N'})" readonly></div>
                </div>
            </div>`;
    } else {
        return `
            <div class="card">
                <h3>Mi Perfil</h3>
                <div class="grid">
                    <div><label>Nombre</label><input value="${s(usuario.nombre_completo)}" readonly></div>
                    <div><label>Cédula</label><input value="${s(usuario.cedula)}" readonly></div>
                    <div><label>Teléfono</label><input value="${s(usuario.telefono)}" readonly></div>
                    <div><label>Email</label><input value="${s(usuario.email)}" readonly></div>
                    <div><label>Dirección</label><input value="${s(usuario.direccion)}" readonly></div>
                    <div><label>Fecha Ingreso</label><input value="${usuario.fecha_ingreso ? new Date(usuario.fecha_ingreso).toLocaleDateString() : ''}" readonly></div>
                </div>
            </div>`;
    }
}

// ==================== TABLAS DE ASISTENCIA / NOTAS ====================
export function renderTablaAsistencia(alumnos) {
    let html = `<table class="web-table"><thead><tr><th>Estudiante</th><th>Asistencia</th></tr></thead><tbody>`;
    alumnos.forEach(a => {
        html += `<tr class="d-row" data-id="${s(a.id)}" data-name="${s(a.nombre)}">
                    <td>${s(a.nombre)}</td>
                    <td><select class="d-val"><option value="P">Presente</option><option value="A">Ausente</option><option value="E">Excusa</option></select></td>
                </tr>`;
    });
    html += `</tbody></table>`;
    return html;
}

export function renderTablaNotas(alumnos) {
    let html = `<table class="web-table"><thead><tr><th>Estudiante</th><th>Nota</th></tr></thead><tbody>`;
    alumnos.forEach(a => {
        html += `<tr class="d-row" data-id="${s(a.id)}"><td>${s(a.nombre)}</td><td><input type="number" class="d-val"></td></tr>`;
    });
    html += `</tbody></table>`;
    return html;
}

// ==================== TAREAS ====================
export function renderTareas(tareas) {
    if (!tareas.length) return '<p>No hay tareas asignadas.</p>';
    const hoy = new Date(); hoy.setHours(0,0,0,0);
    const pendientes = tareas.filter(t => !t.completada && new Date(t.fecha) >= hoy);
    const historial = tareas.filter(t => t.completada || new Date(t.fecha) < hoy);

    const renderCard = (t) => `
        <div class="task-card ${t.completada ? 'completed' : ''}">
            <div style="display:flex; justify-content:space-between;">
                <h4 style="margin:0; color:var(--primary)">${s(t.titulo)}</h4>
                <span style="font-size:0.8rem; color:var(--text-light)">${new Date(t.fecha).toLocaleDateString()}</span>
            </div>
            <p style="margin:5px 0; font-size:0.9rem;">${s(t.descripcion)}</p>
            <small style="color:var(--secondary)">${s(t.materia)} - ${s(t.docente)}</small>
            ${t.completada ? '<br><small style="color:var(--success); font-weight:bold;">COMPLETADA EN AULA</small>' : ''}
        </div>`;

    return `
        <h3 style="color:var(--accent)">Pendientes</h3>
        ${pendientes.length ? pendientes.map(renderCard).join('') : '<p>No tienes tareas pendientes.</p>'}
        <h3 style="color:var(--text-light); margin-top:30px;">Historial / Completadas</h3>
        ${historial.length ? historial.map(renderCard).join('') : '<p>Sin historial.</p>'}
    `;
}

// ==================== HORARIO ====================
export function renderHorarioTable(data) {
    let h = `<table class="web-table"><thead><tr><th>Hora</th><th>Lunes</th><th>Martes</th><th>Miércoles</th><th>Jueves</th><th>Viernes</th></tr></thead><tbody>`;
    data.forEach(r => {
        h += `<tr>
                <td>${s(r.hora)}</td>
                <td>${s(r.lunes)}</td>
                <td>${s(r.martes)}</td>
                <td>${s(r.miercoles)}</td>
                <td>${s(r.jueves)}</td>
                <td>${s(r.viernes)}</td>
              </tr>`;
    });
    return h + '</tbody></table>';
}

// ==================== EXCUSAS ====================
export function renderExcusas(excusas) {
    const hoy = new Date(); hoy.setHours(0,0,0,0);
    const activas = excusas.filter(e => new Date(e.hasta) >= hoy);
    const inactivas = excusas.filter(e => new Date(e.hasta) < hoy);

    let html = `<h4 style="color:var(--success); border-bottom:2px solid var(--success); padding-bottom:5px;">Activas (${activas.length})</h4>`;
    if (activas.length) {
        html += `<table class="web-table"><thead><tr><th>Estudiante</th><th>Desde</th><th>Hasta</th><th>Motivo</th></tr></thead><tbody>`;
        activas.forEach(e => html += `<tr><td>${s(e.nombre)}</td><td>${new Date(e.desde).toLocaleDateString()}</td><td>${new Date(e.hasta).toLocaleDateString()}</td><td>${s(e.motivo)}</td></tr>`);
        html += `</tbody></table>`;
    } else {
        html += `<p style="color:var(--text-light); margin-bottom:20px;">No hay excusas activas.</p>`;
    }
    html += `<h4 style="color:var(--text-light); margin-top:30px; border-bottom:2px solid var(--border); padding-bottom:5px;">Historial (${inactivas.length})</h4>`;
    if (inactivas.length) {
        html += `<table class="web-table" style="opacity:0.7"><thead><tr><th>Estudiante</th><th>Desde</th><th>Hasta</th><th>Motivo</th></tr></thead><tbody>`;
        inactivas.forEach(e => html += `<tr><td>${s(e.nombre)}</td><td>${new Date(e.desde).toLocaleDateString()}</td><td>${new Date(e.hasta).toLocaleDateString()}</td><td>${s(e.motivo)}</td></tr>`);
        html += `</tbody></table>`;
    } else {
        html += `<p style="color:var(--text-light)">No hay historial.</p>`;
    }
    return html;
}

// ==================== LISTADOS (IMPRIMIR) ====================
export function renderListado(alumnos) {
    return `<button onclick="window.print()" class="btn-primary no-print" style="margin-bottom:15px">IMPRIMIR</button>
        <table class="hoja-cuadriculada"><thead><tr><th>#</th><th>Nombre</th><th>Firma</th></tr></thead><tbody>
        ${alumnos.map((a,i) => `<tr><td>${i+1}</td><td>${s(a.nombre)}</td><td></td></tr>`).join('')}
        </tbody></table>`;
}

// ==================== HISTORIAL DE ASISTENCIA ====================
export function renderHistorial(datos, diasDelMes) {
    let reporte = {};
    datos.forEach(r => {
        if (!reporte[r.id_estudiante]) reporte[r.id_estudiante] = { nombre: r.nombre, dias: {} };
        reporte[r.id_estudiante].dias[r.dia] = r.estado;
    });
    let h = `<table class="hoja-cuadriculada" style="font-size:0.8rem"><thead><tr>
                <th>No.</th><th style="min-width:200px">Estudiante</th>
                ${Array.from({length: diasDelMes}, (_,i) => `<th class="col-dia">${i+1}</th>`).join('')}
             </tr></thead><tbody>`;
    Object.values(reporte).forEach((est, i) => {
        h += `<tr><td>${i+1}</td><td>${s(est.nombre)}</td>`;
        for (let d = 1; d <= diasDelMes; d++) {
            const st = est.dias[d] || '';
            const color = st === 'P' ? 'green' : (st === 'A' ? 'red' : (st === 'E' ? 'orange' : ''));
            h += `<td class="col-dia" style="color:${color}; font-weight:bold">${s(st)}</td>`;
        }
        h += `</tr>`;
    });
    h += `</tbody></table>`;
    return h;
}

// ==================== REPORTE DE NOTAS ====================
export function renderReporteNotas(estudiantes, colsArray, materiaNombre) {
    let h = `<div style="text-align:right; margin-bottom:10px;"><button class="btn-primary" onclick="window.print()" style="width:auto;">IMPRIMIR</button></div>
            <table class="hoja-cuadriculada"><thead><tr>
                <th>NO.</th><th>NOMBRE_ESTUDIANTE</th>
                ${colsArray.map(c => `<th>${s(c.toUpperCase())}</th>`).join('')}
                <th>MATERIA/MODULO</th>
             </tr></thead><tbody>`;
    const sortedStudents = Object.values(estudiantes).sort((a, b) => a.nombre.localeCompare(b.nombre));
    sortedStudents.forEach((est, i) => {
        h += `<tr><td>${i+1}</td><td>${s(est.nombre)}</td>`;
        colsArray.forEach(c => { h += `<td style="text-align:center">${s(est.notas[c] || '-')}</td>`; });
        h += `<td style="text-align:center">${s(materiaNombre)}</td></tr>`;
    });
    h += `</tbody></table>`;
    return h;
}

// ==================== FILTROS DE TABLA ====================
export function filtrarTabla(tableId, colIndex, val) {
    const filter = val.toUpperCase();
    const rows = document.getElementById(tableId).getElementsByTagName("tr");
    for (let i = 1; i < rows.length; i++) {
        const td = rows[i].getElementsByTagName("td")[colIndex];
        if (td) {
            const txt = td.textContent || td.innerText;
            rows[i].style.display = txt.toUpperCase().indexOf(filter) > -1 ? "" : "none";
        }
    }
}
