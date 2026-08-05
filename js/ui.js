// ui.js — Construye HTML a partir de datos limpios (sin fetch, sin lógica de negocio)

/**
 - Escapa caracteres HTML especiales para prevenir XSS.
 - Usar siempre que se inyecten datos del backend en innerHTML.
 */
export function s(val) {
    if (val === null || val === undefined) return '';
    return String(val)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export function toast(message, type = 'success') {
    const existing = document.getElementById('global-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'global-toast';
    toast.textContent = message;
    toast.style.position = 'fixed';
    toast.style.right = '20px';
    toast.style.bottom = '20px';
    toast.style.zIndex = '9999';
    toast.style.padding = '12px 16px';
    toast.style.borderRadius = '10px';
    toast.style.color = '#fff';
    toast.style.background = type === 'error' ? '#b42318' : '#0f766e';
    toast.style.boxShadow = '0 10px 30px rgba(0,0,0,.25)';
    toast.style.maxWidth = '360px';
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 2600);
}

// PERFIL REUTILIZABLE
export function renderPerfil(usuario) {
    if (!usuario) return '<div class="card"><h3>Mi Perfil</h3><p>No hay datos de usuario disponibles.</p></div>';

    const rol = usuario.rol;
    const nombre = usuario.nombreCompleto || usuario.nombre_completo || usuario.nombre || '';
    const idSistema = usuario.idSistema || usuario.id_sistema || usuario.id || '';
    const curso = usuario.curso || usuario.cursoNombre || '';
    const cedula = usuario.cedula || '';
    const telefono = usuario.telefono || '';
    const email = usuario.email || '';
    const direccion = usuario.direccion || '';
    const fechaIngreso = usuario.fecha_ingreso ? new Date(usuario.fecha_ingreso).toLocaleDateString() : '';
    const padre = usuario.nombrePadre || usuario.nombre_padre || '';
    const telPadre = usuario.telPadre || usuario.tel_padre || '';
    const madre = usuario.nombreMadre || usuario.nombre_madre || '';
    const telMadre = usuario.telMadre || usuario.tel_madre || '';

    if (rol === 'Estudiante') {
        return `
            <div class="card">
                <h3>Mi Perfil</h3>
                <div class="grid">
                    <div><label>Nombre</label><input value="${s(nombre)}" readonly></div>
                    <div><label>Curso</label><input value="${s(curso)}" readonly></div>
                    <div><label>ID</label><input value="${s(idSistema)}" readonly></div>
                </div>
                <div class="grid">
                    <div><label>Padre</label><input value="${s(padre ? `${padre} (${telPadre || 'S/N'})` : '')}" readonly></div>
                    <div><label>Madre</label><input value="${s(madre ? `${madre} (${telMadre || 'S/N'})` : '')}" readonly></div>
                </div>
            </div>`;
    } else {
        return `
            <div class="card">
                <h3>Mi Perfil</h3>
                <div class="grid">
                    <div><label>Nombre</label><input value="${s(nombre)}" readonly></div>
                    <div><label>Cédula</label><input value="${s(cedula)}" readonly></div>
                    <div><label>Teléfono</label><input value="${s(telefono)}" readonly></div>
                    <div><label>Email</label><input value="${s(email)}" readonly></div>
                    <div><label>Dirección</label><input value="${s(direccion)}" readonly></div>
                    <div><label>Fecha Ingreso</label><input value="${s(fechaIngreso)}" readonly></div>
                </div>
            </div>`;
    }
}

// TABLAS DE ASISTENCIA / NOTAS 
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

// TAREAS 
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

// HORARIO
export function renderHorarioTable(data) {
    let h = `<table class="web-table"><thead><tr><th>Hora</th><th>Lunes</th><th>Martes</th><th>Miércoles</th><th>Jueves</th><th>Viernes</th></tr></thead><tbody>`;
    data.forEach(r => {
        h += `<tr><td>${s(r.hora)}</td><td>${s(r.lunes)}</td><td>${s(r.martes)}</td><td>${s(r.miercoles)}</td><td>${s(r.jueves)}</td><td>${s(r.viernes)}</td></tr>`;
    });
    return h + '</tbody></table>';
}

// EXCUSAS (DOCENTE / ORIENTACIÓN) 
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

// LISTADOS (IMPRIMIR) 
export function renderListado(alumnos) {
    return `<button onclick="window.print()" class="btn-primary no-print" style="margin-bottom:15px">IMPRIMIR</button>
        <table class="hoja-cuadriculada"><thead><tr><th>#</th><th>Nombre</th><th>Firma</th></tr></thead><tbody>
        ${alumnos.map((a,i) => `<tr><td>${i+1}</td><td>${s(a.nombre)}</td><td></td></tr>`).join('')}
        </tbody></table>`;
}

// HISTORIAL DE ASISTENCIA 
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

// REPORTE DE NOTAS 
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

// FILTROS DE TABLA 
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
