// script.js - Versión corregida y completa
const API = "https://backend-ipmhu.onrender.com/api";  // Cambia si el backend usa otro puerto o dominio
let CURRENT_USER = null;
let CURRENT_ROLE = null;
let AUTH_TOKEN = null;

// Helper para peticiones autenticadas (opcional, pero lo usaremos para enviar el token)
async function authFetch(url, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...(AUTH_TOKEN && { 'Authorization': `Bearer ${AUTH_TOKEN}` }),
        ...options.headers
    };
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

// --- LOGIN LOGIC ---
async function handleLogin() {
    console.log("Login ejecutado");
    const u = document.getElementById('login-user').value;
    const p = document.getElementById('login-pass').value;
    const msg = document.getElementById('login-msg');

    if (!u || !p) {
        msg.innerText = "Ingrese usuario y contraseña";
        return;
    }
    msg.innerText = "Verificando...";

    try {
        const res = await fetch(`${API}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ usuario: u, password: p })
        });
        const data = await res.json();

        if (data.success) {
            CURRENT_USER = data.user;
            CURRENT_ROLE = data.user.Rol;
            AUTH_TOKEN = data.token;
            setupUI();
        } else {
            msg.innerText = "Credenciales incorrectas";
        }
    } catch (err) {
        msg.innerText = "Error de conexión con el servidor";
        console.error(err);
    }
}

function setupUI() {
    document.getElementById('login-overlay').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    document.getElementById('user-display').innerText = CURRENT_USER.nombre || CURRENT_USER.Nombre_Completo;
    document.getElementById('role-display').innerText = CURRENT_ROLE;
    renderSidebar();
    if (CURRENT_ROLE === 'Docente') loadDocenteView('asistencia');
    else if (CURRENT_ROLE === 'Orientacion') loadOrientacionView('bus');
    else if (CURRENT_ROLE === 'Estudiante') loadStudentView('perfil');
    else if (CURRENT_ROLE === 'Coordinacion') loadCoordinacionView('horarios');
}

function toggleMenu() {
    document.getElementById('sidebar').classList.toggle('active');
    document.getElementById('sidebar-overlay').classList.toggle('active');
}

// --- SIDEBAR RENDERER ---
function renderSidebar() {
    const nav = document.getElementById('sidebar-nav');
    let html = '';
    
    if (CURRENT_ROLE === 'Docente') {
        html += `<button class="nav-btn" onclick="loadDocenteView('asistencia')">Asistencia</button>`;
        html += `<button class="nav-btn" onclick="loadDocenteView('calificaciones')">Calificaciones</button>`;
        html += `<button class="nav-btn" onclick="loadDocenteView('reportes')">Reportar Falta</button>`;
        html += `<button class="nav-btn" onclick="loadDocenteView('excusas')">Excusas</button>`;
        html += `<button class="nav-btn" onclick="loadDocenteView('listados')">Listados</button>`;
        html += `<button class="nav-btn" onclick="loadDocenteView('tareas')">Blackboard (Tareas)</button>`;
        html += `<button class="nav-btn" onclick="loadDocenteView('historial')">Historial Asistencia</button>`;
        html += `<button class="nav-btn" onclick="loadDocenteView('reporteNotas')">Reporte de Notas</button>`;
        html += `<button class="nav-btn" onclick="loadDocenteView('perfil')">Mi Perfil</button>`;
        html += `<button class="nav-btn" onclick="loadDocenteView('horario')">Mi Horario</button>`;
    } else if (CURRENT_ROLE === 'Orientacion') {
        html += `<button class="nav-btn" onclick="loadOrientacionView('bus')">Buscador y Reportes</button>`;
        html += `<button class="nav-btn" onclick="loadOrientacionView('pas')">Pases de Salida</button>`;
        html += `<button class="nav-btn" onclick="loadOrientacionView('exc')">Registrar Excusa</button>`;
        html += `<button class="nav-btn" onclick="loadOrientacionView('horario')">Consultar Horario</button>`;
        html += `<button class="nav-btn" onclick="loadOrientacionView('per')">Mi Perfil</button>`;
    } else if (CURRENT_ROLE === 'Coordinacion') {
        html += `<button class="nav-btn" onclick="loadCoordinacionView('horarios')">Consultar Horarios</button>`;
        html += `<button class="nav-btn" onclick="loadCoordinacionView('auditoria')">Auditoría de Asistencia</button>`;
        html += `<button class="nav-btn" onclick="loadCoordinacionView('perfil')">Mi Perfil</button>`;
    } else if (CURRENT_ROLE === 'Estudiante') {
        html += `<button class="nav-btn" onclick="loadStudentView('perfil')">Mi Perfil</button>`;
        html += `<button class="nav-btn" onclick="loadStudentView('tareas')">Mis Tareas</button>`;
        html += `<button class="nav-btn" onclick="loadStudentView('reportes')">Reportes Conducta</button>`;
        html += `<button class="nav-btn" onclick="loadStudentView('asistencia')">Asistencia</button>`;
        html += `<button class="nav-btn" onclick="loadStudentView('calificaciones')">Calificaciones</button>`;
        html += `<button class="nav-btn" onclick="loadStudentView('rendimiento')">Rendimiento (RA)</button>`;
        html += `<button class="nav-btn" onclick="loadStudentView('periodos')">Periodos (P)</button>`;
        html += `<button class="nav-btn" onclick="loadStudentView('excusas')">Excusas</button>`;
        html += `<button class="nav-btn" onclick="loadStudentView('horario')">Mi Horario</button>`;
    }
    nav.innerHTML = html;
}

// ==========================================
// LÓGICA DOCENTE (corregida)
// ==========================================
async function loadDocenteView(view) {
    const content = document.getElementById('content-area');
    content.innerHTML = '<p>Cargando...</p>';
    
    const cursosOpts = (CURRENT_USER.cursos && CURRENT_USER.cursos.length) 
        ? CURRENT_USER.cursos.map(c => `<option value="${c.ID}">${c.Nombre}</option>`).join('') 
        : '';
    
    if (view === 'asistencia') {
        const hoy = new Date().toISOString().split('T')[0];
        content.innerHTML = `
            <div class="card">
                <h3>Pase de Lista Diario</h3>
                <div class="grid">
                    <select id="d-curso" onchange="docenteCargarAlumnos(this.value, 'asist')">
                        <option value="">-- Seleccione Curso --</option>
                        ${cursosOpts}
                    </select>
                    <div><label style="margin-bottom:5px; display:block; font-size:0.8rem">Fecha de Registro</label><input type="date" id="d-fecha" value="${hoy}"></div>
                </div>
                <div id="d-area" style="margin-top:20px;"></div>
            </div>`;
    } else if (view === 'calificaciones') {
        content.innerHTML = `
            <div class="card">
                <h3>Registro de Calificaciones</h3>
                <select id="d-curso" onchange="docenteCargarAlumnos(this.value, 'notas')">
                    <option value="">-- Seleccione Curso --</option>
                    ${cursosOpts}
                </select>
                <div id="d-area" style="margin-top:20px;"></div>
            </div>`;
    } else if (view === 'reportes') {
        content.innerHTML = `
            <div class="card" style="border-left:5px solid var(--danger)">
                <h3 style="color:var(--danger)">Reporte de Conducta</h3>
                <select id="d-curso" onchange="docenteCargarAlumnos(this.value, 'repo')">
                    <option value="">-- Seleccione Curso --</option>
                    ${cursosOpts}
                </select>
                <div id="d-area" style="margin-top:20px;"></div>
            </div>`;
    } else if (view === 'excusas') {
        content.innerHTML = `
            <div class="card">
                <h3>Excusas y Justificaciones</h3>
                <select onchange="docenteCargarExcusas(this.value)">
                    <option value="">-- Seleccione Curso --</option>
                    ${cursosOpts}
                </select>
                <div id="d-area" style="margin-top:20px;"></div>
            </div>`;
    } else if (view === 'listados') {
        content.innerHTML = `
            <div class="card">
                <h3>Listados Oficiales</h3>
                <select onchange="docenteCargarAlumnos(this.value, 'lista')">
                    <option value="">-- Seleccione Curso --</option>
                    ${cursosOpts}
                </select>
                <div id="d-area" style="margin-top:20px;"></div>
            </div>`;
    } else if (view === 'historial') {
        const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        const mesActual = new Date().getMonth();
        content.innerHTML = `
            <div class="card">
                <h3>Historial Mensual de Asistencia</h3>
                <div class="grid">
                    <select id="h-curso"><option value="">-- Curso --</option>${cursosOpts}</select>
                    <select id="h-mes">${meses.map((m,i)=>`<option value="${i}" ${i===mesActual?'selected':''}>${m}</option>`).join('')}</select>
                    <input type="number" id="h-anio" value="${new Date().getFullYear()}" placeholder="Año">
                </div>
                <button class="btn-primary" onclick="docenteGenerarHistorial()">GENERAR REPORTE</button>
                <div id="d-area" style="margin-top:20px; overflow-x:auto;"></div>
            </div>`;
    } else if (view === 'reporteNotas') {
        content.innerHTML = `
            <div class="card">
                <h3>Consulta de Calificaciones (Reporte)</h3>
                <div class="grid">
                    <select id="rn-curso"><option value="">-- Curso --</option>${cursosOpts}</select>
                    <input id="rn-periodo" placeholder="Periodo/RA (Ej: P1)">
                    <input id="rn-filtro" placeholder="Filtrar Actividad (Opcional)">
                </div>
                <button class="btn-primary" onclick="docenteGenerarReporteNotas()">CONSULTAR</button>
                <div id="d-area" style="margin-top:20px; overflow-x:auto;"></div>
            </div>`;
    } else if (view === 'tareas') {
        content.innerHTML = `
            <div class="card">
                <h3>Blackboard - Asignar Tarea</h3>
                <select id="d-curso" onchange="docenteCargarTareas(this.value)">
                    <option value="">-- Seleccione Curso --</option>
                    ${cursosOpts}
                </select>
                <input id="t-titulo" placeholder="Título de la Tarea">
                <textarea id="t-desc" placeholder="Descripción detallada..." rows="3"></textarea>
                <div class="grid">
                    <div><label>Fecha Límite</label><input type="date" id="t-fecha"></div>
                    <div style="display:flex; align-items:center;"><input type="checkbox" id="t-check" style="width:auto; margin:0 10px 0 0;"> <label style="margin:0">Completada en Aula</label></div>
                </div>
                <button class="btn-primary" onclick="docenteGuardar('tarea', document.getElementById('d-curso').value)">PUBLICAR TAREA</button>
                <div id="t-lista" style="margin-top:30px; border-top:1px solid #eee; padding-top:20px;"></div>
            </div>`;
    } else if (view === 'perfil') {
        content.innerHTML = `
            <div class="card">
                <h3>Mi Perfil Docente</h3>
                <div class="grid">
                    <div><label>Nombre</label><input value="${CURRENT_USER.Nombre_Completo || ''}" readonly></div>
                    <div><label>Cédula</label><input value="${CURRENT_USER.Cedula || ''}" readonly></div>
                    <div><label>Teléfono</label><input value="${CURRENT_USER.Telefono || ''}" readonly></div>
                    <div><label>Email</label><input value="${CURRENT_USER.Email || ''}" readonly></div>
                    <div><label>Dirección</label><input value="${CURRENT_USER.Direccion || ''}" readonly></div>
                    <div><label>Fecha Ingreso</label><input value="${CURRENT_USER.Fecha_Ingreso ? new Date(CURRENT_USER.Fecha_Ingreso).toLocaleDateString() : ''}" readonly></div>
                </div>
            </div>`;
    } else if (view === 'horario') {
        content.innerHTML = `<div class="card"><h3>Mi Horario Docente</h3><div id="d-horario">Cargando...</div></div>`;
        const res = await authFetch(`${API}/getHorario?id=${CURRENT_USER.id}&tipo=docente`);
        const div = document.getElementById('d-horario');
        if (res.success && res.data.length) div.innerHTML = renderHorarioTable(res.data);
        else div.innerHTML = "No hay horario disponible.";
    }
}

async function docenteCargarAlumnos(idCurso, modo) {
    if (!idCurso) return;
    const div = document.getElementById('d-area');
    div.innerHTML = "Cargando lista...";
    
    const res = await authFetch(`${API}/getAlumnos?curso=${idCurso}`);
    if (!res || res.length === 0) return div.innerHTML = "No hay alumnos.";

    if (modo === 'asist') {
        let html = `<table class="web-table"><thead><tr><th>Estudiante</th><th>Asistencia</th></tr></thead><tbody>`;
        res.forEach(a => {
            html += `<tr class="d-row" data-id="${a.ID}" data-name="${a.nombre}">
                        <td>${a.nombre}</td>
                        <td><select class="d-val"><option value="P">Presente</option><option value="A">Ausente</option><option value="E">Excusa</option></select></td>
                    </tr>`;
        });
        html += `</tbody></table><button class="btn-primary" onclick="docenteGuardar('asistencia', '${idCurso}')" style="margin-top:20px">GUARDAR</button>`;
        div.innerHTML = html;
    } else if (modo === 'notas') {
        let html = `
            <div class="grid" style="margin-bottom:15px; align-items:end;">
                <div><label>Actividad</label><input id="d-act" placeholder="Ej: Examen Parcial" style="margin-bottom:0"></div>
                <div><label>Puntos Máx</label><input id="d-max" type="number" placeholder="100" style="margin-bottom:0"></div>
                <div><label>Periodo / RA</label><input id="d-corte" placeholder="Ej: P1, P2, RA1..." style="margin-bottom:0"></div>
            </div>
            <table class="web-table"><thead><tr><th>Estudiante</th><th>Nota</th></tr></thead><tbody>`;
        res.forEach(a => {
            html += `<tr class="d-row" data-id="${a.ID}"><td>${a.nombre}</td><td><input type="number" class="d-val"></td></tr>`;
        });
        html += `</tbody></table>
            <div style="display:flex; gap:10px; margin-top:20px;">
                <button class="btn-primary" onclick="docenteGuardar('notas', '${idCurso}')">GUARDAR NOTAS</button>
            </div>`;
        div.innerHTML = html;
    } else if (modo === 'repo') {
        div.innerHTML = `
            <label>Estudiante</label><select id="d-est">${res.map(a=>`<option value="${a.ID}">${a.nombre}</option>`)}</select>
            <label>Tipo</label><select id="d-tipo"><option>Leve</option><option>Grave</option></select>
            <label>Descripción</label><textarea id="d-desc"></textarea>
            <button class="btn-danger" onclick="docenteGuardar('reporte', '${idCurso}')">ENVIAR</button>`;
    } else if (modo === 'lista') {
        div.innerHTML = `<button onclick="window.print()" class="btn-primary no-print" style="margin-bottom:15px">IMPRIMIR</button>
            <table class="hoja-cuadriculada"><thead><tr><th>#</th><th>Nombre</th><th>Firma</th></tr></thead><tbody>
            ${res.map((a,i)=>`<tr><td>${i+1}</td><td>${a.nombre}</td><td></td></tr>`).join('')}
            </tbody></table>`;
    }
}

async function docenteCargarTareas(idCurso) {
    if (!idCurso) return;
    const div = document.getElementById('t-lista');
    div.innerHTML = "Cargando tareas publicadas...";
    const res = await authFetch(`${API}/getTareasDocente?curso=${idCurso}`);
    if (res.success && res.data.length) {
        let h = `<h4>Tareas Publicadas</h4><table class="web-table"><thead><tr><th>Título</th><th>Fecha</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>`;
        res.data.forEach(t => {
            h += `<tr>
                    <td>${t.Titulo}</td>
                    <td>${new Date(t.fecha).toLocaleDateString()}</td>
                    <td>${t.Completada ? '<span style="color:green">Completada</span>' : '<span style="color:orange">Pendiente</span>'}</td>
                    <td>
                        <button onclick="docenteTareaAccion('${t.ID}', 'toggle')" style="padding:5px 10px; font-size:0.8rem; width:auto; margin-right:5px; cursor:pointer;">${t.Completada ? 'Reabrir' : 'Completar'}</button>
                        <button onclick="docenteTareaAccion('${t.ID}', 'delete')" style="padding:5px 10px; font-size:0.8rem; width:auto; background:var(--danger); color:white; cursor:pointer;">Eliminar</button>
                    </td>
                </tr>`;
        });
        div.innerHTML = h + "</tbody></table>";
    } else {
        div.innerHTML = "<p style='color:#666'>No hay tareas registradas para este curso.</p>";
    }
}

async function docenteGuardar(tipo, idCurso) {
    let payload = [];
    const cursoObj = CURRENT_USER.cursos?.find(c => c.ID == idCurso);
    const nombreAsignatura = cursoObj ? (cursoObj.Modulo || cursoObj.Materia || '') : '';
    
    if (tipo === 'asistencia') {
        const fecha = document.getElementById('d-fecha').value;
        document.querySelectorAll('.d-row').forEach(r => {
            payload.push({
                idEstudiante: r.dataset.id, idCurso: idCurso, materia: nombreAsignatura,
                estado: r.querySelector('.d-val').value, docente: CURRENT_USER.nombre, nombreEstudiante: r.dataset.name,
                fecha: fecha
            });
        });
        await authFetch(`${API}/guardarAsistencia`, { method: 'POST', body: JSON.stringify({ datos: payload }) });
        alert("Asistencia Guardada");
    } else if (tipo === 'notas') {
        const act = document.getElementById('d-act').value;
        const max = document.getElementById('d-max').value;
        const corte = document.getElementById('d-corte').value;
        if (!act || !max || !corte) return alert("Complete todos los campos (Actividad, Puntos y Periodo/RA).");
        document.querySelectorAll('.d-row').forEach(r => {
            const val = r.querySelector('.d-val').value;
            if (val) {
                payload.push({ 
                    idEstudiante: r.dataset.id, idCurso: idCurso, modulo: nombreAsignatura,
                    actividad: act, nota: val, maximo: max, periodo: corte
                });
            }
        });
        await authFetch(`${API}/guardarMasivo`, { method: 'POST', body: JSON.stringify({ datos: payload }) });
        alert("Notas Guardadas");
    } else if (tipo === 'reporte') {
        const d = { 
            idEstudiante: document.getElementById('d-est').value, idCurso: idCurso,
            tipo: document.getElementById('d-tipo').value, descripcion: document.getElementById('d-desc').value,
            docente: CURRENT_USER.nombre 
        };
        await authFetch(`${API}/guardarReporte`, { method: 'POST', body: JSON.stringify({ datos: d }) });
        alert("Reporte Enviado");
    } else if (tipo === 'tarea') {
        if (!idCurso) return alert("Seleccione un curso");
        const payloadTarea = {
            idCurso: idCurso, titulo: document.getElementById('t-titulo').value,
            descripcion: document.getElementById('t-desc').value, fecha: document.getElementById('t-fecha').value,
            completada: document.getElementById('t-check').checked, docente: CURRENT_USER.nombre
        };
        await authFetch(`${API}/guardarTarea`, { method: 'POST', body: JSON.stringify({ datos: payloadTarea }) });
        alert("Tarea Publicada");
        loadDocenteView('tareas');
    }
}

async function docenteTareaAccion(id, tipo) {
    if (!confirm(tipo === 'delete' ? "¿Eliminar esta tarea?" : "¿Cambiar estado de la tarea?")) return;
    await authFetch(`${API}/manageTarea`, { method: 'POST', body: JSON.stringify({ id, tipo }) });
    docenteCargarTareas(document.getElementById('d-curso').value);
}

async function docenteCargarExcusas(idCurso) {
    if (!idCurso) return;
    const div = document.getElementById('d-area');
    div.innerHTML = "Buscando excusas...";
    const res = await authFetch(`${API}/getExcusas?curso=${idCurso}`);
    if (!res.success || !res.excusas || res.excusas.length === 0) {
        div.innerHTML = "<p style='color:var(--text-light)'>No hay excusas registradas para este curso.</p>";
        return;
    }
    const hoy = new Date(); hoy.setHours(0,0,0,0);
    const activas = [], inactivas = [];
    res.excusas.forEach(e => {
        const fin = new Date(e.hasta);
        fin.setHours(0,0,0,0);
        if (fin >= hoy) activas.push(e);
        else inactivas.push(e);
    });
    let h = `<h4 style="color:var(--success); border-bottom:2px solid var(--success); padding-bottom:5px;">Activas (${activas.length})</h4>`;
    if (activas.length) {
        h += `<table class="web-table"><thead><tr><th>Estudiante</th><th>Desde</th><th>Hasta</th><th>Motivo</th></tr></thead><tbody>`;
        activas.forEach(e => h += `<tr><td>${e.nombre}</td><td>${new Date(e.desde).toLocaleDateString()}</td><td>${new Date(e.hasta).toLocaleDateString()}</td><td>${e.motivo}</td></tr>`);
        h += `</tbody></table>`;
    } else h += `<p style="color:var(--text-light); margin-bottom:20px;">No hay excusas activas.</p>`;
    h += `<h4 style="color:var(--text-light); margin-top:30px; border-bottom:2px solid var(--border); padding-bottom:5px;">Historial (${inactivas.length})</h4>`;
    if (inactivas.length) {
        h += `<table class="web-table" style="opacity:0.7"><thead><tr><th>Estudiante</th><th>Desde</th><th>Hasta</th><th>Motivo</th></tr></thead><tbody>`;
        inactivas.forEach(e => h += `<tr><td>${e.nombre}</td><td>${new Date(e.desde).toLocaleDateString()}</td><td>${new Date(e.hasta).toLocaleDateString()}</td><td>${e.motivo}</td></tr>`);
        h += `</tbody></table>`;
    } else h += `<p style="color:var(--text-light)">No hay historial.</p>`;
    div.innerHTML = h;
}

async function docenteGenerarHistorial() {
    const curso = document.getElementById('h-curso').value;
    const mes = document.getElementById('h-mes').value;
    const anio = document.getElementById('h-anio').value;
    const div = document.getElementById('d-area');
    if (!curso) return alert("Seleccione un curso");
    div.innerHTML = "Generando reporte...";
    const res = await authFetch(`${API}/getHistorial?curso=${curso}&mes=${mes}&anio=${anio}`);
    if (!res.success || !res.registros.length) return div.innerHTML = "No hay datos para este periodo.";
    const dias = new Date(anio, parseInt(mes)+1, 0).getDate();
    let reporte = {};
    res.registros.forEach(r => {
        if (!reporte[r.ID_Estudiante]) reporte[r.ID_Estudiante] = { nombre: r.nombre, dias: {} };
        reporte[r.ID_Estudiante].dias[r.dia] = r.Estado;
    });
    let h = `<table class="hoja-cuadriculada" style="font-size:0.8rem"><thead><tr>
                <th>No.</th><th style="min-width:200px">Estudiante</th>
                ${Array.from({length:dias},(_,i)=>`<th class="col-dia">${i+1}</th>`).join('')}
            </tr></thead><tbody>`;
    Object.values(reporte).forEach((est, i) => {
        h += `<tr><td>${i+1}</td><td>${est.nombre}</td>`;
        for (let d=1; d<=dias; d++) {
            const st = est.dias[d] || '';
            const color = st==='P'?'green':(st==='A'?'red':(st==='E'?'orange':''));
            h += `<td class="col-dia" style="color:${color}; font-weight:bold">${st}</td>`;
        }
        h += `</tr>`;
    });
    div.innerHTML = h + "</tbody></table>";
}

async function docenteGenerarReporteNotas() {
    const curso = document.getElementById('rn-curso').value;
    const periodo = document.getElementById('rn-periodo').value;
    const filtro = document.getElementById('rn-filtro').value;
    const div = document.getElementById('d-area');
    if (!curso || !periodo) return alert("Debe seleccionar un curso y escribir un Periodo/RA.");
    div.innerHTML = "Consultando calificaciones...";
    const cursoObj = CURRENT_USER.cursos?.find(c => c.ID == curso);
    const materiaNombre = cursoObj ? (cursoObj.Modulo || cursoObj.Materia) : "";
    const res = await authFetch(`${API}/getReporteNotas?curso=${curso}&periodo=${encodeURIComponent(periodo)}&filtro=${encodeURIComponent(filtro)}`);
    if (!res.success || !res.data.length) return div.innerHTML = "No se encontraron calificaciones.";
    let estudiantes = {};
    let columnas = new Set();
    res.data.forEach(r => {
        if (!estudiantes[r.ID_Estudiante]) estudiantes[r.ID_Estudiante] = { nombre: r.nombre, notas: {} };
        columnas.add(r.Actividad);
        estudiantes[r.ID_Estudiante].notas[r.Actividad] = r.Nota;
    });
    const colsArray = Array.from(columnas).sort();
    let h = `<div style="text-align:right; margin-bottom:10px;"><button class="btn-primary" onclick="window.print()" style="width:auto;">IMPRIMIR</button></div>
            <table class="hoja-cuadriculada"><thead><tr>
                <th>NO.</th><th>NOMBRE_ESTUDIANTE</th>
                ${colsArray.map(c => `<th>${c.toUpperCase()}</th>`).join('')}
                <th>MATERIA/MODULO</th>
            </tr></thead><tbody>`;
    const sortedStudents = Object.values(estudiantes).sort((a, b) => a.nombre.localeCompare(b.nombre));
    sortedStudents.forEach((est, i) => {
        h += `<tr><td>${i+1}</td><td>${est.nombre}</td>`;
        colsArray.forEach(c => { h += `<td style="text-align:center">${est.notas[c] || '-'}</td>`; });
        h += `<td style="text-align:center">${materiaNombre}</td></tr>`;
    });
    div.innerHTML = h + "</tbody></table>";
}

// ==========================================
// LÓGICA COORDINACIÓN (unificada)
// ==========================================
function loadCoordinacionView(view) {
    const content = document.getElementById('content-area');
    if (view === 'horarios') {
        content.innerHTML = `
            <div class="card">
                <h3>Consultar Horarios</h3>
                <div class="grid">
                    <div><label>Buscar Docente (ID)</label><div style="display:flex; gap:5px;">
                        <input id="c-doc-id" placeholder="Ej: 1"><button class="btn-primary" style="width:auto;" onclick="coordinacionVerHorario('docente')">VER</button>
                    </div></div>
                    <div><label>Buscar Curso (ID)</label><div style="display:flex; gap:5px;">
                        <input id="c-cur-id" placeholder="Ej: 1"><button class="btn-primary" style="width:auto;" onclick="coordinacionVerHorario('curso')">VER</button>
                    </div></div>
                </div>
                <div id="c-hor-res" style="margin-top:20px;"></div>
            </div>`;
    } else if (view === 'auditoria') {
        content.innerHTML = `
            <div class="card">
                <h3>Auditoría de Asistencia (Tiempo Real)</h3>
                <button class="btn-primary" onclick="coordinacionAuditar()">EJECUTAR AUDITORÍA AHORA</button>
                <div id="c-res" style="margin-top:20px;"></div>
            </div>`;
    } else if (view === 'perfil') {
        content.innerHTML = `
            <div class="card">
                <h3>Mi Perfil</h3>
                <div class="grid">
                    <div><label>Nombre</label><input value="${CURRENT_USER.Nombre_Completo || ''}" readonly></div>
                    <div><label>ID</label><input value="${CURRENT_USER.id || ''}" readonly></div>
                    <div><label>Rol</label><input value="${CURRENT_USER.Rol || ''}" readonly></div>
                    <div><label>Cédula</label><input value="${CURRENT_USER.Cedula || ''}" readonly></div>
                    <div><label>Teléfono</label><input value="${CURRENT_USER.Telefono || ''}" readonly></div>
                    <div><label>Email</label><input value="${CURRENT_USER.Email || ''}" readonly></div>
                    <div><label>Dirección</label><input value="${CURRENT_USER.Direccion || ''}" readonly></div>
                    <div><label>Fecha Ingreso</label><input value="${CURRENT_USER.Fecha_Ingreso ? new Date(CURRENT_USER.Fecha_Ingreso).toLocaleDateString() : ''}" readonly></div>
                </div>
            </div>`;
    }
}

async function coordinacionVerHorario(tipo) {
    const id = tipo === 'docente' ? document.getElementById('c-doc-id').value : document.getElementById('c-cur-id').value;
    const div = document.getElementById('c-hor-res');
    if (!id) return alert("Ingrese un ID");
    div.innerHTML = "Cargando...";
    const res = await authFetch(`${API}/getHorario?id=${encodeURIComponent(id)}&tipo=${tipo}`);
    if (res.success && res.data.length) div.innerHTML = renderHorarioTable(res.data);
    else div.innerHTML = "No se encontró horario.";
}

async function coordinacionAuditar() {
    const div = document.getElementById('c-res');
    div.innerHTML = "Analizando horarios y registros de hoy...";
    const res = await authFetch(`${API}/getAuditoriaAsistencia`);
    if (!res.success) return div.innerHTML = "Error al realizar auditoría.";
    if (res.data.length === 0) return div.innerHTML = `<div style="padding:15px; background:#d4edda; color:#155724; border-radius:8px;">✅ Todo en orden. Todos los docentes programados han pasado lista hoy.</div>`;
    let h = `<h4 style="color:var(--accent)">Alertas de Incumplimiento (${res.data.length})</h4>
            <table class="web-table"><thead><tr><th>Docente</th><th>Curso</th><th>Hora / Bloque</th><th>Estado</th></tr></thead><tbody>`;
    res.data.forEach(r => {
        h += `<tr><td>${r.docente}</td><td>${r.curso}</td><td>${r.hora}</td><td style="color:red; font-weight:bold">Pendiente</td></tr>`;
    });
    div.innerHTML = h + "</tbody></table>";
}

// ==========================================
// LÓGICA ORIENTACIÓN
// ==========================================
function loadOrientacionView(view) {
    const content = document.getElementById('content-area');
    if (view === 'bus') {
        content.innerHTML = `
            <div class="card">
                <h3>Consulta Disciplinaria</h3>
                <div style="display:flex; gap:10px;">
                    <input type="text" id="o-bus-id" placeholder="ID del Estudiante..." style="margin:0;">
                    <button class="btn-primary" onclick="orientacionBuscar()" style="width:150px;">CONSULTAR</button>
                </div>
            </div>
            <div id="o-res" class="hidden"></div>`;
    } else if (view === 'pas') {
        content.innerHTML = `
            <div class="card">
                <h3>Pase de Salida</h3>
                <div class="grid"><div><label>ID Estudiante</label><input id="p-id" onchange="orientacionDatosPase()"></div>
                <div><label>ID Pase</label><input id="p-pds" readonly></div></div>
                <div class="grid"><div><label>Nombre</label><input id="p-nom" readonly></div>
                <div><label>Curso</label><input id="p-cur" readonly></div></div>
                <label>Retira</label><input id="p-retira"><label>Motivo</label><textarea id="p-motivo"></textarea>
                <div class="grid"><div><label>Foto Persona</label><input type="file" id="p-f1"></div>
                <div><label>Foto ID</label><input type="file" id="p-f2"></div></div>
                <button class="btn-primary" onclick="orientacionGenerarPase()">GENERAR PDF</button>
            </div>`;
    } else if (view === 'exc') {
        content.innerHTML = `
            <div class="card">
                <h3>Registrar Excusa</h3>
                <label>ID Estudiante</label><input id="e-id">
                <div class="grid"><div><label>Desde</label><input type="date" id="e-ini"></div>
                <div><label>Hasta</label><input type="date" id="e-fin"></div></div>
                <label>Motivo</label><textarea id="e-mot"></textarea>
                <button class="btn-primary" onclick="orientacionGuardarExcusa()">GUARDAR</button>
            </div>`;
    } else if (view === 'horario') {
        content.innerHTML = `
            <div class="card">
                <h3>Consultar Horario de Curso</h3>
                <div style="display:flex; gap:10px; margin-bottom:20px;">
                    <input id="o-hor-id" placeholder="ID del Curso (Ej: 1)">
                    <button class="btn-primary" onclick="orientacionBuscarHorario()" style="width:auto;">BUSCAR</button>
                </div>
                <div id="o-hor-res"></div>
            </div>`;
    } else if (view === 'per') {
        content.innerHTML = `
            <div class="card">
                <h3>Mi Perfil</h3>
                <div class="grid">
                    <div><label>Nombre</label><input value="${CURRENT_USER.Nombre_Completo || ''}" readonly></div>
                    <div><label>Cédula</label><input value="${CURRENT_USER.Cedula || ''}" readonly></div>
                    <div><label>Teléfono</label><input value="${CURRENT_USER.Telefono || ''}" readonly></div>
                    <div><label>Email</label><input value="${CURRENT_USER.Email || ''}" readonly></div>
                    <div><label>Dirección</label><input value="${CURRENT_USER.Direccion || ''}" readonly></div>
                </div>
            </div>`;
    }
}

async function orientacionBuscar() {
    const id = document.getElementById('o-bus-id').value;
    const res = await authFetch(`${API}/buscarEstudiante?id=${id}`);
    const div = document.getElementById('o-res');
    if (res.success) {
        div.classList.remove('hidden');
        let h = `<div class="card">
            <h3>${res.data.nombre}</h3>
            <p>Curso: ${res.data.curso} | Reportes: ${res.data.totalReportes}</p>
            <p><strong>Padre:</strong> ${res.data.padre || 'N/A'} (${res.data.telP || 'N/A'}) | <strong>Madre:</strong> ${res.data.madre || 'N/A'} (${res.data.telM || 'N/A'})</p>
            ${res.data.tieneExcusa ? `<div style="background:#fff3cd; padding:10px; border-radius:8px; color:#856404;">Excusa: ${res.data.detalleExcusa}</div>` : ''}
            <div style="margin-top:15px; display:flex; gap:10px;">
                <button class="btn-primary" style="font-size:0.8rem; padding:8px;" onclick="orientacionVerNotas('${id}', 'getStudentGradesDetail', 'Detalle')">Notas Detalle</button>
                <button class="btn-primary" style="font-size:0.8rem; padding:8px;" onclick="orientacionVerNotas('${id}', 'getStudentGradesP', 'Periodos')">Notas P</button>
                <button class="btn-primary" style="font-size:0.8rem; padding:8px;" onclick="orientacionVerNotas('${id}', 'getStudentGradesRA', 'RA')">Notas RA</button>
            </div>
            <div id="o-notas-area" style="margin-top:15px;"></div>
        </div>
        <div class="card"><h3>Historial</h3><table class="web-table"><tr><th>Fecha</th><th>Falta</th><th>Docente</th></tr>`;
        res.data.detalleReportes.forEach(r => h += `<tr><td>${new Date(r.Fecha).toLocaleDateString()}</td><td>${r.falta}</td><td>${r.docente}</td></tr>`);
        h += `</table></div>`;
        div.innerHTML = h;
    } else alert("No encontrado");
}

async function orientacionVerNotas(id, action, titulo) {
    const div = document.getElementById('o-notas-area');
    div.innerHTML = "Cargando notas...";
    const res = await authFetch(`${API}/${action}?id=${id}`);
    if (res.success && res.data.length > 0) {
        let keys = Object.keys(res.data[0]);
        let h = `<h4 style="margin-bottom:5px; color:var(--secondary)">${titulo}</h4><table class="web-table"><thead><tr>${keys.map(k=>`<th>${k}</th>`).join('')}</tr></thead><tbody>`;
        res.data.forEach(r => h += `<tr>${keys.map(k=>`<td>${r[k]}</td>`).join('')}</tr>`);
        div.innerHTML = h + "</tbody></table>";
    } else div.innerHTML = "No hay calificaciones registradas.";
}

async function orientacionDatosPase() {
    const id = document.getElementById('p-id').value;
    const res = await authFetch(`${API}/buscarEstudiante?id=${id}`);
    if (res.success) {
        document.getElementById('p-pds').value = Date.now();
        document.getElementById('p-nom').value = res.data.nombre;
        document.getElementById('p-cur').value = res.data.curso;
    }
}

async function orientacionGenerarPase() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text(`PASE DE SALIDA: ${document.getElementById('p-pds').value}`, 20, 20);
    doc.text(`Estudiante: ${document.getElementById('p-nom').value}`, 20, 30);
    doc.text(`Retira: ${document.getElementById('p-retira').value}`, 20, 40);
    doc.save("pase.pdf");
    const payload = {
        tipo: "pase", idEstudiante: document.getElementById('p-id').value,
        motivo: document.getElementById('p-motivo').value, autorizadoPor: CURRENT_USER.nombre
    };
    await authFetch(`${API}/pase`, { method: 'POST', body: JSON.stringify(payload) });
}

async function orientacionBuscarHorario() {
    const id = document.getElementById('o-hor-id').value;
    const div = document.getElementById('o-hor-res');
    div.innerHTML = "Cargando...";
    const res = await authFetch(`${API}/getHorario?id=${encodeURIComponent(id)}&tipo=curso`);
    if (res.success && res.data.length) div.innerHTML = renderHorarioTable(res.data);
    else div.innerHTML = "<p>No se encontró horario para ese ID de curso.</p>";
}

async function orientacionGuardarExcusa() {
    const payload = {
        tipo: "excusa", idEstudiante: document.getElementById('e-id').value,
        fInicio: document.getElementById('e-ini').value, fFin: document.getElementById('e-fin').value,
        motivo: document.getElementById('e-mot').value, autorizadoPor: CURRENT_USER.nombre
    };
    await authFetch(`${API}/excusa`, { method: 'POST', body: JSON.stringify(payload) });
    alert("Excusa Guardada");
}

// ==========================================
// LÓGICA ESTUDIANTE
// ==========================================
async function loadStudentView(view) {
    const content = document.getElementById('content-area');
    const s = CURRENT_USER;
    if (view === 'perfil') {
        content.innerHTML = `
            <div class="card">
                <h3>Mi Perfil</h3>
                <div class="grid">
                    <div><label>Nombre</label><input value="${s.Nombre_Completo}" readonly></div>
                    <div><label>Curso</label><input value="${s.Curso}" readonly></div>
                    <div><label>ID</label><input value="${s.ID_Sistema}" readonly></div>
                </div>
                <div class="grid">
                    <div><label>Padre</label><input value="${s.Nombre_Padre || ''} (${s.Tel_Padre || 'S/N'})" readonly></div>
                    <div><label>Madre</label><input value="${s.Nombre_Madre || ''} (${s.Tel_Madre || 'S/N'})" readonly></div>
                </div>
            </div>`;
    } else if (view === 'reportes') {
        studentFetchAndRender('getStudentReports', content, (data) => {
            if (!data.length) return '<p>Sin reportes.</p>';
            let h = `<table class="web-table"><thead><tr><th>Fecha</th><th>Tipo</th><th>Docente</th></tr></thead><tbody>`;
            data.forEach(r => h += `<tr><td>${new Date(r.Fecha).toLocaleDateString()}</td><td>${r.Tipo}</td><td>${r.Docente}</td></tr>`);
            return h + '</tbody></table>';
        });
    } else if (view === 'asistencia') {
        studentFetchAndRender('getStudentAttendance', content, (data) => {
            const materias = [...new Set(data.map(d => d.Materia))];
            let h = `<div class="filter-bar"><select onchange="filtrarTabla('t-asist', 1, this.value)"><option value="">Todas las Materias</option>${materias.map(m=>`<option>${m}</option>`).join('')}</select></div>`;
            h += `<table class="web-table" id="t-asist"><thead><tr><th>Fecha</th><th>Materia</th><th>Estado</th></tr></thead><tbody>`;
            data.forEach(r => h += `<tr><td>${new Date(r.Fecha).toLocaleDateString()}</td><td>${r.Materia}</td><td>${r.Estado}</td></tr>`);
            return h + '</tbody></table>';
        });
    } else if (view === 'calificaciones') {
        studentFetchAndRender('getStudentGradesDetail', content, (data) => {
            const mods = [...new Set(data.map(d => d.Modulo))];
            const pers = [...new Set(data.map(d => d.Periodo))];
            let h = `<div class="filter-bar">
                <select onchange="filtrarTabla('t-cal', 0, this.value)"><option value="">Todos los Módulos</option>${mods.map(m=>`<option>${m}</option>`).join('')}</select>
                <select onchange="filtrarTabla('t-cal', 1, this.value)"><option value="">Todos los Periodos</option>${pers.map(p=>`<option>${p}</option>`).join('')}</select>
                <input placeholder="Filtrar Actividad..." onkeyup="filtrarTabla('t-cal', 2, this.value)">
            </div>`;
            h += `<table class="web-table" id="t-cal"><thead><tr><th>Materia</th><th>P</th><th>Actividad</th><th>Nota</th></tr></thead><tbody>`;
            data.forEach(r => h += `<tr><td>${r.Modulo}</td><td>${r.Periodo}</td><td>${r.Actividad}</td><td>${r.Nota}</td></tr>`);
            return h + '</tbody></table>';
        });
    } else if (view === 'rendimiento') {
        studentFetchAndRender('getStudentGradesRA', content, (data) => {
            const mods = [...new Set(data.map(d => d.Modulo))];
            let h = `<div class="filter-bar"><select onchange="filtrarTabla('t-ra', 0, this.value)"><option value="">Todos los Módulos</option>${mods.map(m=>`<option>${m}</option>`).join('')}</select></div>`;
            h += `<table class="web-table" id="t-ra"><thead><tr><th>Módulo</th><th>RA</th><th>Nota</th></tr></thead><tbody>`;
            data.forEach(r => h += `<tr><td>${r.Modulo}</td><td>${r.RA}</td><td>${r.Nota_Final}</td></tr>`);
            return h + '</tbody></table>';
        });
    } else if (view === 'periodos') {
        studentFetchAndRender('getStudentGradesP', content, (data) => {
            let h = `<table class="web-table"><thead><tr><th>Materia</th><th>P1</th><th>P2</th><th>P3</th><th>P4</th><th>Final</th></tr></thead><tbody>`;
            data.forEach(r => h += `<tr><td>${r.Materia}</td><td>${r.P1}</td><td>${r.P2}</td><td>${r.P3}</td><td>${r.P4}</td><td>${r.P_Final}</td></tr>`);
            return h + '</tbody></table>';
        });
    } else if (view === 'excusas') {
        studentFetchAndRender('getStudentExcuses', content, (data) => {
            if (!data || !data.length) return '<p>No hay excusas registradas.</p>';
            const hoy = new Date(); hoy.setHours(0,0,0,0);
            const activas = [], inactivas = [];
            data.forEach(r => {
                const fin = new Date(r.Fecha_Fin);
                fin.setHours(0,0,0,0);
                if (fin >= hoy) activas.push(r);
                else inactivas.push(r);
            });
            let h = `<h4 style="color:var(--success)">Activas</h4>`;
            if (activas.length) {
                h += `<table class="web-table"><thead><tr><th>Desde</th><th>Hasta</th><th>Motivo</th></tr></thead><tbody>`;
                activas.forEach(r => h += `<tr><td>${new Date(r.Fecha_Inicio).toLocaleDateString()}</td><td>${new Date(r.Fecha_Fin).toLocaleDateString()}</td><td>${r.Motivo}</td></tr>`);
                h += `</tbody></table>`;
            } else h += `<p>No tienes excusas activas.</p>`;
            h += `<h4 style="color:var(--text-light); margin-top:20px;">Historial</h4>`;
            if (inactivas.length) {
                h += `<table class="web-table" style="opacity:0.7"><thead><tr><th>Desde</th><th>Hasta</th><th>Motivo</th></tr></thead><tbody>`;
                inactivas.forEach(r => h += `<tr><td>${new Date(r.Fecha_Inicio).toLocaleDateString()}</td><td>${new Date(r.Fecha_Fin).toLocaleDateString()}</td><td>${r.Motivo}</td></tr>`);
                h += `</tbody></table>`;
            } else h += `<p>No hay historial.</p>`;
            return h;
        });
    } else if (view === 'tareas') {
        studentFetchAndRender('getTareasEstudiante', content, (data) => {
            if (!data.length) return '<p>No hay tareas asignadas.</p>';
            const hoy = new Date(); hoy.setHours(0,0,0,0);
            let pendientes = data.filter(t => !t.Completada && new Date(t.fecha) >= hoy);
            let historial = data.filter(t => t.Completada || new Date(t.fecha) < hoy);
            const renderTask = (t) => `
                <div class="task-card ${t.Completada ? 'completed' : ''}">
                    <div style="display:flex; justify-content:space-between;">
                        <h4 style="margin:0; color:var(--primary)">${t.Titulo}</h4>
                        <span style="font-size:0.8rem; color:var(--text-light)">${new Date(t.fecha).toLocaleDateString()}</span>
                    </div>
                    <p style="margin:5px 0; font-size:0.9rem;">${t.Descripcion}</p>
                    <small style="color:var(--secondary)">${t.materia} - ${t.docente}</small>
                    ${t.Completada ? '<br><small style="color:var(--success); font-weight:bold;">COMPLETADA EN AULA</small>' : ''}
                </div>`;
            return `
                <h3 style="color:var(--accent)">Pendientes</h3>
                ${pendientes.length ? pendientes.map(renderTask).join('') : '<p>No tienes tareas pendientes.</p>'}
                <h3 style="color:var(--text-light); margin-top:30px;">Historial / Completadas</h3>
                ${historial.length ? historial.map(renderTask).join('') : '<p>Sin historial.</p>'}
            `;
        });
    } else if (view === 'horario') {
        content.innerHTML = `<div class="card"><h3>Horario de Clases (${CURRENT_USER.Curso})</h3><div id="s-horario">Cargando...</div></div>`;
        const res = await authFetch(`${API}/getHorario?id=${CURRENT_USER.Curso_ID}&tipo=curso`);
        const div = document.getElementById('s-horario');
        if (res.success && res.data.length) div.innerHTML = renderHorarioTable(res.data);
        else div.innerHTML = "No hay horario disponible.";
    }
}

async function studentFetchAndRender(action, container, renderFn) {
    container.innerHTML = 'Cargando...';
    const res = await authFetch(`${API}/${action}?id=${CURRENT_USER.ID_Sistema}`);
    if (res.success) container.innerHTML = `<div class="card">${renderFn(res.data)}</div>`;
    else container.innerHTML = 'Error al cargar datos.';
}

function filtrarTabla(tableId, colIndex, val) {
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

function renderHorarioTable(data) {
    let h = `<table class="web-table"><thead><tr><th>Hora</th><th>Lunes</th><th>Martes</th><th>Miércoles</th><th>Jueves</th><th>Viernes</th></tr></thead><tbody>`;
    data.forEach(r => {
        h += `<tr><td>${r.hora}</td><td>${r.lunes}</td><td>${r.martes}</td><td>${r.miercoles}</td><td>${r.jueves}</td><td>${r.viernes}</td></tr>`;
    });
    return h + '</tbody></table>';
}

// Event listeners finales
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("btn-login").addEventListener("click", handleLogin);
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) logoutBtn.addEventListener("click", () => {
        CURRENT_USER = null;
        CURRENT_ROLE = null;
        AUTH_TOKEN = null;
        document.getElementById('login-overlay').classList.remove('hidden');
        document.getElementById('app').classList.add('hidden');
    });
    const menuBtn = document.getElementById("menu-btn");
    if (menuBtn) menuBtn.addEventListener("click", toggleMenu);
    const overlay = document.getElementById("sidebar-overlay");
    if (overlay) overlay.addEventListener("click", toggleMenu);
});

console.log("JS corregido y conectado correctamente");
