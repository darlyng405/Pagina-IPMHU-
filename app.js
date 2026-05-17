// app.js — Estado global, eventos y coordinación
import * as api from './api.js';
import * as ui from './ui.js';

// Estado global
let CURRENT_USER = null;
let CURRENT_ROLE = null;
let AUTH_TOKEN = null;

// ==================== INICIALIZACIÓN ====================
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("btn-login").addEventListener("click", handleLogin);
    document.getElementById("logout-btn").addEventListener("click", logout);
    document.getElementById("menu-btn").addEventListener("click", toggleMenu);
    document.getElementById("sidebar-overlay").addEventListener("click", toggleMenu);
});

// ==================== LOGIN ====================
async function handleLogin() {
    const u = document.getElementById('login-user').value;
    const p = document.getElementById('login-pass').value;
    const msg = document.getElementById('login-msg');

    if (!u || !p) {
        msg.innerText = "Ingrese usuario y contraseña";
        return;
    }
    msg.innerText = "Verificando...";

    const data = await api.login(u, p);

    // Rate limit alcanzado: mostrar cuenta regresiva
    if (data?._status === 429) {
        const segundos = data.retryafter ?? 900; // retryafter viene normalizado a minúsculas
        let restantes = segundos;
        const btnLogin = document.getElementById('btn-login');
        btnLogin.disabled = true;
        const intervalo = setInterval(() => {
            restantes--;
            const min = Math.ceil(restantes / 60);
            msg.innerText = `Demasiados intentos. Intentá de nuevo en ${min} minuto(s). (${restantes}s)`;
            if (restantes <= 0) {
                clearInterval(intervalo);
                btnLogin.disabled = false;
                msg.innerText = "Podés intentar de nuevo.";
            }
        }, 1000);
        msg.innerText = `Demasiados intentos. Intentá de nuevo en ${Math.ceil(segundos / 60)} minuto(s). (${segundos}s)`;
        return;
    }

    if (!data || !data.success) {
        msg.innerText = data?.msg || "Error de conexión";
        return;
    }

    CURRENT_USER = data.user;
    CURRENT_ROLE = data.user.rol;
    AUTH_TOKEN = data.token;
    api.setToken(AUTH_TOKEN);
    setupUI();
}

function setupUI() {
    document.getElementById('login-overlay').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    document.getElementById('user-display').innerText = CURRENT_USER.nombre || CURRENT_USER.nombreCompleto;
    document.getElementById('role-display').innerText = CURRENT_ROLE;
    renderSidebar();
    // Cargar vista inicial según rol
    if (CURRENT_ROLE === 'Docente') loadDocenteView('asistencia');
    else if (CURRENT_ROLE === 'Orientacion') loadOrientacionView('bus');
    else if (CURRENT_ROLE === 'Estudiante') loadStudentView('perfil');
    else if (CURRENT_ROLE === 'Coordinacion') loadCoordinacionView('horarios');
}

function logout() {
    CURRENT_USER = null;
    CURRENT_ROLE = null;
    AUTH_TOKEN = null;
    api.setToken(null);
    document.getElementById('login-overlay').classList.remove('hidden');
    document.getElementById('app').classList.add('hidden');
}

function toggleMenu() {
    document.getElementById('sidebar').classList.toggle('active');
    document.getElementById('sidebar-overlay').classList.toggle('active');
}

// ==================== SIDEBAR ====================
function renderSidebar() {
    const nav = document.getElementById('sidebar-nav');
    let html = '';
    if (CURRENT_ROLE === 'Docente') {
        html += btn('asistencia','Asistencia');
        html += btn('calificaciones','Calificaciones');
        html += btn('reportes','Reportar Falta');
        html += btn('excusas','Excusas');
        html += btn('listados','Listados');
        html += btn('tareas','Blackboard (Tareas)');
        html += btn('historial','Historial Asistencia');
        html += btn('reporteNotas','Reporte de Notas');
        html += btn('perfil','Mi Perfil');
        html += btn('horario','Mi Horario');
    } else if (CURRENT_ROLE === 'Orientacion') {
        html += btn('bus','Buscador y Reportes');
        html += btn('pas','Pases de Salida');
        html += btn('exc','Registrar Excusa');
        html += btn('horario','Consultar Horario');
        html += btn('per','Mi Perfil');
    } else if (CURRENT_ROLE === 'Coordinacion') {
        html += btn('horarios','Consultar Horarios');
        html += btn('auditoria','Auditoría de Asistencia');
        html += btn('perfil','Mi Perfil');
    } else if (CURRENT_ROLE === 'Estudiante') {
        html += btn('perfil','Mi Perfil');
        html += btn('tareas','Mis Tareas');
        html += btn('reportes','Reportes Conducta');
        html += btn('asistencia','Asistencia');
        html += btn('calificaciones','Calificaciones');
        html += btn('rendimiento','Rendimiento (RA)');
        html += btn('periodos','Periodos (P)');
        html += btn('excusas','Excusas');
        html += btn('horario','Mi Horario');
    }
    nav.innerHTML = html;
}

function btn(view, text) {
    const roleFunc = CURRENT_ROLE === 'Docente' ? 'loadDocenteView' :
                    CURRENT_ROLE === 'Orientacion' ? 'loadOrientacionView' :
                    CURRENT_ROLE === 'Coordinacion' ? 'loadCoordinacionView' : 'loadStudentView';
    return `<button class="nav-btn" onclick="${roleFunc}('${view}')">${text}</button>`;
}

// ==================== DOCENTE ====================
async function loadDocenteView(view) {
    const content = document.getElementById('content-area');
    content.innerHTML = '<p>Cargando...</p>';
    const cursosOpts = (CURRENT_USER.cursos && CURRENT_USER.cursos.length)
        ? CURRENT_USER.cursos.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('')
        : '';

    if (view === 'asistencia') {
        const hoy = new Date().toISOString().split('T')[0];
        content.innerHTML = `
            <div class="card">
                <h3>Pase de Lista Diario</h3>
                <div class="grid">
                    <select id="d-curso" onchange="window.app.docenteCargarAlumnos(this.value, 'asist')">
                        <option value="">-- Seleccione Curso --</option>${cursosOpts}
                    </select>
                    <div><label style="margin-bottom:5px; display:block; font-size:0.8rem">Fecha de Registro</label><input type="date" id="d-fecha" value="${hoy}"></div>
                </div>
                <div id="d-area" style="margin-top:20px;"></div>
            </div>`;
    } else if (view === 'calificaciones') {
        content.innerHTML = `
            <div class="card">
                <h3>Registro de Calificaciones</h3>
                <select id="d-curso" onchange="window.app.docenteCargarAlumnos(this.value, 'notas')">
                    <option value="">-- Seleccione Curso --</option>${cursosOpts}
                </select>
                <div id="d-area" style="margin-top:20px;"></div>
            </div>`;
    } else if (view === 'reportes') {
        content.innerHTML = `
            <div class="card" style="border-left:5px solid var(--danger)">
                <h3 style="color:var(--danger)">Reporte de Conducta</h3>
                <select id="d-curso" onchange="window.app.docenteCargarAlumnos(this.value, 'repo')">
                    <option value="">-- Seleccione Curso --</option>${cursosOpts}
                </select>
                <div id="d-area" style="margin-top:20px;"></div>
            </div>`;
    } else if (view === 'excusas') {
        content.innerHTML = `
            <div class="card">
                <h3>Excusas y Justificaciones</h3>
                <select onchange="window.app.docenteCargarExcusas(this.value)">
                    <option value="">-- Seleccione Curso --</option>${cursosOpts}
                </select>
                <div id="d-area" style="margin-top:20px;"></div>
            </div>`;
    } else if (view === 'listados') {
        content.innerHTML = `
            <div class="card">
                <h3>Listados Oficiales</h3>
                <select onchange="window.app.docenteCargarAlumnos(this.value, 'lista')">
                    <option value="">-- Seleccione Curso --</option>${cursosOpts}
                </select>
                <div id="d-area" style="margin-top:20px;"></div>
            </div>`;
    } else if (view === 'historial') {
        const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
        const mesActual = new Date().getMonth();
        content.innerHTML = `
            <div class="card">
                <h3>Historial Mensual de Asistencia</h3>
                <div class="grid">
                    <select id="h-curso"><option value="">-- Curso --</option>${cursosOpts}</select>
                    <select id="h-mes">${meses.map((m,i)=>`<option value="${i}" ${i===mesActual?'selected':''}>${m}</option>`).join('')}</select>
                    <input type="number" id="h-anio" value="${new Date().getFullYear()}" placeholder="Año">
                </div>
                <button class="btn-primary" onclick="window.app.docenteGenerarHistorial()">GENERAR REPORTE</button>
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
                <button class="btn-primary" onclick="window.app.docenteGenerarReporteNotas()">CONSULTAR</button>
                <div id="d-area" style="margin-top:20px; overflow-x:auto;"></div>
            </div>`;
    } else if (view === 'tareas') {
        content.innerHTML = `
            <div class="card">
                <h3>Blackboard - Asignar Tarea</h3>
                <select id="d-curso" onchange="window.app.docenteCargarTareas(this.value)">
                    <option value="">-- Seleccione Curso --</option>${cursosOpts}
                </select>
                <input id="t-titulo" placeholder="Título de la Tarea">
                <textarea id="t-desc" placeholder="Descripción detallada..." rows="3"></textarea>
                <div class="grid">
                    <div><label>Fecha Límite</label><input type="date" id="t-fecha"></div>
                    <div style="display:flex; align-items:center;"><input type="checkbox" id="t-check" style="width:auto; margin:0 10px 0 0;"> <label style="margin:0">Completada en Aula</label></div>
                </div>
                <button class="btn-primary" onclick="window.app.docenteGuardar('tarea', document.getElementById('d-curso').value)">PUBLICAR TAREA</button>
                <div id="t-lista" style="margin-top:30px; border-top:1px solid #eee; padding-top:20px;"></div>
            </div>`;
    } else if (view === 'perfil') {
        content.innerHTML = ui.renderPerfil(CURRENT_USER);
    } else if (view === 'horario') {
        content.innerHTML = `<div class="card"><h3>Mi Horario Docente</h3><div id="d-horario">Cargando...</div></div>`;
        const res = await api.getHorario(CURRENT_USER.id, 'docente');
        const div = document.getElementById('d-horario');
        if (res && res.success && res.data.length) div.innerHTML = ui.renderHorarioTable(res.data);
        else div.innerHTML = "No hay horario disponible.";
    }
}

// Funciones auxiliares de docente
window.app.docenteCargarAlumnos = async function(idCurso, modo) {
    if (!idCurso) return;
    const div = document.getElementById('d-area');
    div.innerHTML = "Cargando lista...";
    const data = await api.getAlumnos(idCurso);
    if (!data || data.length === 0) return div.innerHTML = "No hay alumnos.";

    if (modo === 'asist') {
        div.innerHTML = ui.renderTablaAsistencia(data) + `<button class="btn-primary" onclick="window.app.docenteGuardar('asistencia', '${idCurso}')" style="margin-top:20px">GUARDAR</button>`;
    } else if (modo === 'notas') {
        div.innerHTML = `
            <div class="grid" style="margin-bottom:15px; align-items:end;">
                <div><label>Actividad</label><input id="d-act" placeholder="Ej: Examen Parcial" style="margin-bottom:0"></div>
                <div><label>Puntos Máx</label><input id="d-max" type="number" placeholder="100" style="margin-bottom:0"></div>
                <div><label>Periodo / RA</label><input id="d-corte" placeholder="Ej: P1, P2, RA1..." style="margin-bottom:0"></div>
            </div>
            ${ui.renderTablaNotas(data)}
            <div style="display:flex; gap:10px; margin-top:20px;">
                <button class="btn-primary" onclick="window.app.docenteGuardar('notas', '${idCurso}')">GUARDAR NOTAS</button>
            </div>`;
    } else if (modo === 'repo') {
        div.innerHTML = `
            <label>Estudiante</label><select id="d-est">${data.map(a=>`<option value="${a.id}">${a.nombre}</option>`)}</select>
            <label>Tipo</label><select id="d-tipo"><option>Leve</option><option>Grave</option></select>
            <label>Descripción</label><textarea id="d-desc"></textarea>
            <button class="btn-danger" onclick="window.app.docenteGuardar('reporte', '${idCurso}')">ENVIAR</button>`;
    } else if (modo === 'lista') {
        div.innerHTML = ui.renderListado(data);
    }
};

window.app.docenteGuardar = async function(tipo, idCurso) {
    let payload = [];
    const cursoObj = CURRENT_USER.cursos?.find(c => c.id == idCurso);
    const nombreAsignatura = cursoObj ? (cursoObj.modulo || cursoObj.materia || '') : '';

    if (tipo === 'asistencia') {
        const fecha = document.getElementById('d-fecha').value;
        document.querySelectorAll('.d-row').forEach(r => {
            payload.push({
                idEstudiante: r.dataset.id, idCurso: idCurso, materia: nombreAsignatura,
                estado: r.querySelector('.d-val').value, docente: CURRENT_USER.nombre, nombreEstudiante: r.dataset.name,
                fecha: fecha
            });
        });
        await api.guardarAsistencia(payload);
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
        await api.guardarMasivo(payload);
        alert("Notas Guardadas");
    } else if (tipo === 'reporte') {
        const d = {
            idEstudiante: document.getElementById('d-est').value, idCurso: idCurso,
            tipo: document.getElementById('d-tipo').value, descripcion: document.getElementById('d-desc').value,
            docente: CURRENT_USER.nombre
        };
        await api.guardarReporte(d);
        alert("Reporte Enviado");
    } else if (tipo === 'tarea') {
        if (!idCurso) return alert("Seleccione un curso");
        const payloadTarea = {
            idCurso, titulo: document.getElementById('t-titulo').value,
            descripcion: document.getElementById('t-desc').value, fecha: document.getElementById('t-fecha').value,
            completada: document.getElementById('t-check').checked, docente: CURRENT_USER.nombre
        };
        await api.guardarTarea(payloadTarea);
        alert("Tarea Publicada");
        loadDocenteView('tareas');
    }
};

window.app.docenteCargarTareas = async function(idCurso) {
    if (!idCurso) return;
    const div = document.getElementById('t-lista');
    div.innerHTML = "Cargando tareas publicadas...";
    const res = await api.getTareasDocente(idCurso);
    if (res && res.success && res.data.length) {
        let h = `<h4>Tareas Publicadas</h4><table class="web-table"><thead><tr><th>Título</th><th>Fecha</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>`;
        res.data.forEach(t => {
            h += `<tr>
                    <td>${t.titulo}</td>
                    <td>${new Date(t.fecha).toLocaleDateString()}</td>
                    <td>${t.completada ? '<span style="color:green">Completada</span>' : '<span style="color:orange">Pendiente</span>'}</td>
                    <td>
                        <button onclick="window.app.docenteTareaAccion('${t.id}', 'toggle')" style="padding:5px 10px; font-size:0.8rem; width:auto; margin-right:5px; cursor:pointer;">${t.completada ? 'Reabrir' : 'Completar'}</button>
                        <button onclick="window.app.docenteTareaAccion('${t.id}', 'delete')" style="padding:5px 10px; font-size:0.8rem; width:auto; background:var(--danger); color:white; cursor:pointer;">Eliminar</button>
                    </td>
                </tr>`;
        });
        div.innerHTML = h + "</tbody></table>";
    } else {
        div.innerHTML = "<p style='color:#666'>No hay tareas registradas para este curso.</p>";
    }
};

window.app.docenteTareaAccion = async function(id, tipo) {
    if (!confirm(tipo === 'delete' ? "¿Eliminar esta tarea?" : "¿Cambiar estado de la tarea?")) return;
    await api.manageTarea(id, tipo);
    const idCurso = document.getElementById('d-curso').value;
    if (idCurso) window.app.docenteCargarTareas(idCurso);
};

window.app.docenteCargarExcusas = async function(idCurso) {
    if (!idCurso) return;
    const div = document.getElementById('d-area');
    div.innerHTML = "Buscando excusas...";
    const res = await api.getExcusas(idCurso);
    if (!res || !res.success || !res.data || res.data.length === 0) {
        div.innerHTML = "<p style='color:var(--text-light)'>No hay excusas registradas para este curso.</p>";
        return;
    }
    div.innerHTML = ui.renderExcusas(res.data);
};

window.app.docenteGenerarHistorial = async function() {
    const curso = document.getElementById('h-curso').value;
    const mes = document.getElementById('h-mes').value;
    const anio = document.getElementById('h-anio').value;
    const div = document.getElementById('d-area');
    if (!curso) return alert("Seleccione un curso");
    div.innerHTML = "Generando reporte...";
    const res = await api.getHistorial(curso, mes, anio);
    if (!res || !res.success || !res.data.length) return div.innerHTML = "No hay datos para este periodo.";
    const diasDelMes = new Date(anio, parseInt(mes)+1, 0).getDate();
    div.innerHTML = ui.renderHistorial(res.data, diasDelMes);
};

window.app.docenteGenerarReporteNotas = async function() {
    const curso = document.getElementById('rn-curso').value;
    const periodo = document.getElementById('rn-periodo').value;
    const filtro = document.getElementById('rn-filtro').value;
    const div = document.getElementById('d-area');
    if (!curso || !periodo) return alert("Debe seleccionar un curso y escribir un Periodo/RA.");
    div.innerHTML = "Consultando calificaciones...";
    const res = await api.getReporteNotas(curso, periodo, filtro);
    if (!res || !res.success || !res.data.length) return div.innerHTML = "No se encontraron calificaciones.";
    let estudiantes = {};
    let columnas = new Set();
    res.data.forEach(r => {
        if (!estudiantes[r.id_estudiante]) estudiantes[r.id_estudiante] = { nombre: r.nombre, notas: {} };
        columnas.add(r.actividad);
        estudiantes[r.id_estudiante].notas[r.actividad] = r.nota;
    });
    const cursoObj = CURRENT_USER.cursos?.find(c => c.id == curso);
    const materiaNombre = cursoObj ? (cursoObj.modulo || cursoObj.materia) : "";
    div.innerHTML = ui.renderReporteNotas(estudiantes, Array.from(columnas).sort(), materiaNombre);
};

// ==================== COORDINACIÓN ====================
async function loadCoordinacionView(view) {
    const content = document.getElementById('content-area');
    if (view === 'horarios') {
        content.innerHTML = `
            <div class="card">
                <h3>Consultar Horarios</h3>
                <div class="grid">
                    <div><label>Buscar Docente (ID)</label><div style="display:flex; gap:5px;">
                        <input id="c-doc-id" placeholder="Ej: 1"><button class="btn-primary" style="width:auto;" onclick="window.app.coordinacionVerHorario('docente')">VER</button>
                    </div></div>
                    <div><label>Buscar Curso (ID)</label><div style="display:flex; gap:5px;">
                        <input id="c-cur-id" placeholder="Ej: 1"><button class="btn-primary" style="width:auto;" onclick="window.app.coordinacionVerHorario('curso')">VER</button>
                    </div></div>
                </div>
                <div id="c-hor-res" style="margin-top:20px;"></div>
            </div>`;
    } else if (view === 'auditoria') {
        content.innerHTML = `
            <div class="card">
                <h3>Auditoría de Asistencia (Tiempo Real)</h3>
                <button class="btn-primary" onclick="window.app.coordinacionAuditar()">EJECUTAR AUDITORÍA AHORA</button>
                <div id="c-res" style="margin-top:20px;"></div>
            </div>`;
    } else if (view === 'perfil') {
        content.innerHTML = ui.renderPerfil(CURRENT_USER);
    }
}

window.app.coordinacionVerHorario = async function(tipo) {
    const id = tipo === 'docente' ? document.getElementById('c-doc-id').value : document.getElementById('c-cur-id').value;
    const div = document.getElementById('c-hor-res');
    if (!id) return alert("Ingrese un ID");
    div.innerHTML = "Cargando...";
    const res = await api.getHorario(id, tipo);
    if (res && res.success && res.data.length) div.innerHTML = ui.renderHorarioTable(res.data);
    else div.innerHTML = "No se encontró horario.";
};

window.app.coordinacionAuditar = async function() {
    const div = document.getElementById('c-res');
    div.innerHTML = "Analizando horarios y registros de hoy...";
    const res = await api.getAuditoriaAsistencia();
    if (!res || !res.success) return div.innerHTML = "Error al realizar auditoría.";
    if (res.data.length === 0) return div.innerHTML = `<div style="padding:15px; background:#d4edda; color:#155724; border-radius:8px;">✅ Todo en orden. Todos los docentes programados han pasado lista hoy.</div>`;
    let h = `<h4 style="color:var(--accent)">Alertas de Incumplimiento (${res.data.length})</h4>
            <table class="web-table"><thead><tr><th>Docente</th><th>Curso</th><th>Hora / Bloque</th><th>Estado</th></tr></thead><tbody>`;
    res.data.forEach(r => h += `<tr><td>${r.docente}</td><td>${r.curso}</td><td>${r.hora}</td><td style="color:red; font-weight:bold">Pendiente</td></tr>`);
    div.innerHTML = h + "</tbody></table>";
};

// ==================== ORIENTACIÓN ====================
function loadOrientacionView(view) {
    const content = document.getElementById('content-area');
    if (view === 'bus') {
        content.innerHTML = `
            <div class="card">
                <h3>Consulta Disciplinaria</h3>
                <div style="display:flex; gap:10px;">
                    <input type="text" id="o-bus-id" placeholder="ID del Estudiante..." style="margin:0;">
                    <button class="btn-primary" onclick="window.app.orientacionBuscar()" style="width:150px;">CONSULTAR</button>
                </div>
            </div>
            <div id="o-res" class="hidden"></div>`;
    } else if (view === 'pas') {
        content.innerHTML = `
            <div class="card">
                <h3>Pase de Salida</h3>
                <div class="grid"><div><label>ID Estudiante</label><input id="p-id" onchange="window.app.orientacionDatosPase()"></div>
                <div><label>ID Pase</label><input id="p-pds" readonly></div></div>
                <div class="grid"><div><label>Nombre</label><input id="p-nom" readonly></div>
                <div><label>Curso</label><input id="p-cur" readonly></div></div>
                <label>Retira</label><input id="p-retira"><label>Motivo</label><textarea id="p-motivo"></textarea>
                <div class="grid"><div><label>Foto Persona</label><input type="file" id="p-f1"></div>
                <div><label>Foto ID</label><input type="file" id="p-f2"></div></div>
                <button class="btn-primary" onclick="window.app.orientacionGenerarPase()">GENERAR PDF</button>
            </div>`;
    } else if (view === 'exc') {
        content.innerHTML = `
            <div class="card">
                <h3>Registrar Excusa</h3>
                <label>ID Estudiante</label><input id="e-id">
                <div class="grid"><div><label>Desde</label><input type="date" id="e-ini"></div>
                <div><label>Hasta</label><input type="date" id="e-fin"></div></div>
                <label>Motivo</label><textarea id="e-mot"></textarea>
                <button class="btn-primary" onclick="window.app.orientacionGuardarExcusa()">GUARDAR</button>
            </div>`;
    } else if (view === 'horario') {
        content.innerHTML = `
            <div class="card">
                <h3>Consultar Horario de Curso</h3>
                <div style="display:flex; gap:10px; margin-bottom:20px;">
                    <input id="o-hor-id" placeholder="ID del Curso (Ej: 1)">
                    <button class="btn-primary" onclick="window.app.orientacionBuscarHorario()" style="width:auto;">BUSCAR</button>
                </div>
                <div id="o-hor-res"></div>
            </div>`;
    } else if (view === 'per') {
        content.innerHTML = ui.renderPerfil(CURRENT_USER);
    }
}

window.app.orientacionBuscar = async function() {
    const id = document.getElementById('o-bus-id').value;
    const res = await api.buscarEstudiante(id);
 const div = document.getElementById('o-res');
    if (res && res.success) {
        div.classList.remove('hidden');
        const d = res.data;
        let h = `<div class="card">
            <h3>${d.nombre}</h3>
            <p>Curso: ${d.curso} | Reportes: ${d.totalreportes}</p>
            <p><strong>Padre:</strong> ${d.padre || 'N/A'} (${d.telP || 'N/A'}) | <strong>Madre:</strong> ${d.madre || 'N/A'} (${d.telM || 'N/A'})</p>
            ${d.tieneexcusa ? `<div style="background:#fff3cd; padding:10px; border-radius:8px; color:#856404;">Excusa: ${d.detalleexcusa}</div>` : ''}
            <div style="margin-top:15px; display:flex; gap:10px;">
                <button class="btn-primary" style="font-size:0.8rem; padding:8px;" onclick="window.app.orientacionVerNotas('${id}', 'getStudentGradesDetail', 'Detalle')">Notas Detalle</button>
                <button class="btn-primary" style="font-size:0.8rem; padding:8px;" onclick="window.app.orientacionVerNotas('${id}', 'getStudentGradesP', 'Periodos')">Notas P</button>
                <button class="btn-primary" style="font-size:0.8rem; padding:8px;" onclick="window.app.orientacionVerNotas('${id}', 'getStudentGradesRA', 'RA')">Notas RA</button>
            </div>
            <div id="o-notas-area" style="margin-top:15px;"></div>
        </div>
        <div class="card"><h3>Historial</h3><table class="web-table"><tr><th>Fecha</th><th>Falta</th><th>Docente</th></tr>`;
        d.detallereportes.forEach(r => h += `<tr><td>${new Date(r.fecha).toLocaleDateString()}</td><td>${r.falta}</td><td>${r.docente}</td></tr>`);
        h += `</table></div>`;
        div.innerHTML = h;
    } else alert("No encontrado");
};

window.app.orientacionVerNotas = async function(id, endpoint, titulo) {
    const div = document.getElementById('o-notas-area');
    div.innerHTML = "Cargando notas...";
    let res;
    if (endpoint === 'getStudentGradesDetail') res = await api.getStudentGradesDetail(id);
    else if (endpoint === 'getStudentGradesP') res = await api.getStudentGradesP(id);
    else res = await api.getStudentGradesRA(id);
    if (res && res.success && res.data.length > 0) {
        let keys = Object.keys(res.data[0]);
        let h = `<h4 style="margin-bottom:5px; color:var(--secondary)">${titulo}</h4><table class="web-table"><thead><tr>${keys.map(k=>`<th>${k}</th>`).join('')}</tr></thead><tbody>`;
        res.data.forEach(r => h += `<tr>${keys.map(k=>`<td>${r[k]}</td>`).join('')}</tr>`);
        div.innerHTML = h + "</tbody></table>";
    } else div.innerHTML = "No hay calificaciones registradas.";
};

window.app.orientacionDatosPase = async function() {
    const id = document.getElementById('p-id').value;
    const res = await api.buscarEstudiante(id);
    if (res && res.success) {
        document.getElementById('p-pds').value = Date.now();
        document.getElementById('p-nom').value = res.data.nombre;
        document.getElementById('p-cur').value = res.data.curso;
    }
};

window.app.orientacionGenerarPase = async function() {
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
    await api.guardarPase(payload);
};

window.app.orientacionBuscarHorario = async function() {
    const id = document.getElementById('o-hor-id').value;
    const div = document.getElementById('o-hor-res');
    div.innerHTML = "Cargando...";
    const res = await api.getHorario(id, 'curso');
    if (res && res.success && res.data.length) div.innerHTML = ui.renderHorarioTable(res.data);
    else div.innerHTML = "<p>No se encontró horario para ese ID de curso.</p>";
};

window.app.orientacionGuardarExcusa = async function() {
    const payload = {
        tipo: "excusa", idEstudiante: document.getElementById('e-id').value,
        fInicio: document.getElementById('e-ini').value, fFin: document.getElementById('e-fin').value,
        motivo: document.getElementById('e-mot').value, autorizadoPor: CURRENT_USER.nombre
    };
    await api.guardarExcusa(payload);
    alert("Excusa Guardada");
};

// ==================== ESTUDIANTE ====================
async function loadStudentView(view) {
    const content = document.getElementById('content-area');
    if (view === 'perfil') {
        content.innerHTML = ui.renderPerfil(CURRENT_USER);
    } else if (view === 'reportes') {
        studentFetchAndRender('getStudentReports', content, data => {
            if (!data.length) return '<p>Sin reportes.</p>';
            let h = `<table class="web-table"><thead><tr><th>Fecha</th><th>Tipo</th><th>Docente</th></tr></thead><tbody>`;
            data.forEach(r => h += `<tr><td>${new Date(r.fecha).toLocaleDateString()}</td><td>${r.tipo}</td><td>${r.docente}</td></tr>`);
            return h + '</tbody></table>';
        });
    } else if (view === 'asistencia') {
        studentFetchAndRender('getStudentAttendance', content, data => {
            const materias = [...new Set(data.map(d => d.materia))];
            let h = `<div class="filter-bar"><select onchange="ui.filtrarTabla('t-asist', 1, this.value)"><option value="">Todas las Materias</option>${materias.map(m=>`<option>${m}</option>`).join('')}</select></div>`;
            h += `<table class="web-table" id="t-asist"><thead><tr><th>Fecha</th><th>Materia</th><th>Estado</th></tr></thead><tbody>`;
            data.forEach(r => h += `<tr><td>${new Date(r.fecha).toLocaleDateString()}</td><td>${r.materia}</td><td>${r.estado}</td></tr>`);
            return h + '</tbody></table>';
        });
    } else if (view === 'calificaciones') {
        studentFetchAndRender('getStudentGradesDetail', content, data => {
            const mods = [...new Set(data.map(d => d.modulo))];
            const pers = [...new Set(data.map(d => d.periodo))];
            let h = `<div class="filter-bar">
                <select onchange="ui.filtrarTabla('t-cal', 0, this.value)"><option value="">Todos los Módulos</option>${mods.map(m=>`<option>${m}</option>`).join('')}</select>
                <select onchange="ui.filtrarTabla('t-cal', 1, this.value)"><option value="">Todos los Periodos</option>${pers.map(p=>`<option>${p}</option>`).join('')}</select>
                <input placeholder="Filtrar Actividad..." onkeyup="ui.filtrarTabla('t-cal', 2, this.value)">
            </div>`;
            h += `<table class="web-table" id="t-cal"><thead><tr><th>Materia</th><th>P</th><th>Actividad</th><th>Nota</th></tr></thead><tbody>`;
            data.forEach(r => h += `<tr><td>${r.modulo}</td><td>${r.periodo}</td><td>${r.actividad}</td><td>${r.nota}</td></tr>`);
            return h + '</tbody></table>';
        });
    } else if (view === 'rendimiento') {
        studentFetchAndRender('getStudentGradesRA', content, data => {
            const mods = [...new Set(data.map(d => d.modulo))];
            let h = `<div class="filter-bar"><select onchange="ui.filtrarTabla('t-ra', 0, this.value)"><option value="">Todos los Módulos</option>${mods.map(m=>`<option>${m}</option>`).join('')}</select></div>`;
            h += `<table class="web-table" id="t-ra"><thead><tr><th>Módulo</th><th>RA</th><th>Nota</th></tr></thead><tbody>`;
            data.forEach(r => h += `<tr><td>${r.modulo}</td><td>${r.ra}</td><td>${r.nota_final}</td></tr>`);
            return h + '</tbody></table>';
        });
    } else if (view === 'periodos') {
        studentFetchAndRender('getStudentGradesP', content, data => {
            let h = `<table class="web-table"><thead><tr><th>Materia</th><th>P1</th><th>P2</th><th>P3</th><th>P4</th><th>Final</th></tr></thead><tbody>`;
            data.forEach(r => h += `<tr><td>${r.materia}</td><td>${r.p1}</td><td>${r.p2}</td><td>${r.p3}</td><td>${r.p4}</td><td>${r.p_final}</td></tr>`);
            return h + '</tbody></table>';
        });
    } else if (view === 'excusas') {
        studentFetchAndRender('getStudentExcuses', content, data => {
            return ui.renderExcusas(data.map(e => ({
                nombre: e.nombre || '', // no aplica, se omite
                desde: e.fecha_inicio,
                hasta: e.fecha_fin,
                motivo: e.motivo
            })));
        });
    } else if (view === 'tareas') {
        studentFetchAndRender('getTareasEstudiante', content, data => ui.renderTareas(data));
    } else if (view === 'horario') {
        content.innerHTML = `<div class="card"><h3>Horario de Clases (${CURRENT_USER.curso})</h3><div id="s-horario">Cargando...</div></div>`;
        const res = await api.getHorario(CURRENT_USER.cursoId, 'curso');
        const div = document.getElementById('s-horario');
        if (res && res.success && res.data.length) div.innerHTML = ui.renderHorarioTable(res.data);
        else div.innerHTML = "No hay horario disponible.";
    }
}

async function studentFetchAndRender(action, container, renderFn) {
    container.innerHTML = 'Cargando...';
    let data;
    switch (action) {
        case 'getStudentReports': data = await api.getStudentReports(CURRENT_USER.idSistema); break;
        case 'getStudentAttendance': data = await api.getStudentAttendance(CURRENT_USER.idSistema); break;
        case 'getStudentGradesDetail': data = await api.getStudentGradesDetail(CURRENT_USER.idSistema); break;
        case 'getStudentGradesP': data = await api.getStudentGradesP(CURRENT_USER.idSistema); break;
        case 'getStudentGradesRA': data = await api.getStudentGradesRA(CURRENT_USER.idSistema); break;
        case 'getStudentExcuses': data = await api.getStudentExcuses(CURRENT_USER.idSistema); break;
        case 'getTareasEstudiante': data = await api.getTareasEstudiante(CURRENT_USER.idSistema); break;
        default: data = null;
    }
    if (data && data.success) container.innerHTML = `<div class="card">${renderFn(data.data)}</div>`;
    else container.innerHTML = '<p>Error al cargar datos.</p>';
}

// Exponer app globalmente para los onclick inline
window.app = {
    docenteCargarAlumnos,
    docenteGuardar,
    docenteCargarTareas,
    docenteTareaAccion,
    docenteCargarExcusas,
    docenteGenerarHistorial,
    docenteGenerarReporteNotas,
    coordinacionVerHorario,
    coordinacionAuditar,
    orientacionBuscar,
    orientacionDatosPase,
    orientacionGenerarPase,
    orientacionBuscarHorario,
    orientacionGuardarExcusa,
    orientacionVerNotas
};