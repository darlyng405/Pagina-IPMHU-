// js/app.js — Orquestación: conecta store ↔ api ↔ ui
// Sin window.app, sin onclick inline, sin estado global mutable directo.
import { store } from './store.js';
import * as api  from './api.js';
import * as ui   from './ui.js';

// ── Exponer filtrarTabla para los onchange de los filtros de tabla ─────────────
// Es el único helper que vive en window porque lo usan selects generados dinámicamente.
// Todo lo demás usa addEventListener.
window.ui = { filtrarTabla: ui.filtrarTabla };

// ── Suscripciones al store ────────────────────────────────────────────────────
// Cuando el token cambia, sincronizamos api.js automáticamente.
store.on('token', (token) => api.setToken(token));

// Cuando el rol cambia, re-renderizamos el sidebar.
store.on('role', (role) => { if (role) renderSidebar(); });

// ── Inicialización ────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-login')
        .addEventListener('click', handleLogin);

    document.getElementById('logout-btn')
        .addEventListener('click', logout);

    document.getElementById('menu-btn')
        .addEventListener('click', toggleMenu);

    document.getElementById('sidebar-overlay')
        .addEventListener('click', toggleMenu);

    document.getElementById('login-pass')
        .addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });

    // Logout automático si el token expira (401)
    api.onUnauthorized(() => {
        logout();
        document.getElementById('login-msg').innerText = 'Tu sesión expiró. Vuelve a ingresar.';
    });
});

// ── AUTH ──────────────────────────────────────────────────────────────────────
async function handleLogin() {
    const u   = document.getElementById('login-user').value.trim();
    const p   = document.getElementById('login-pass').value;
    const msg = document.getElementById('login-msg');
    const btn = document.getElementById('btn-login');

    if (!u || !p) { msg.innerText = 'Ingrese usuario y contraseña'; return; }
    msg.innerText = 'Verificando...';
    btn.disabled  = true;

    const data = await api.login(u, p);

    if (data?._status === 429) {
        let restantes = data.retryafter ?? 900;
        const iv = setInterval(() => {
            restantes--;
            msg.innerText = `Demasiados intentos. Reintentá en ${Math.ceil(restantes / 60)} min. (${restantes}s)`;
            if (restantes <= 0) {
                clearInterval(iv);
                btn.disabled  = false;
                msg.innerText = 'Podés intentar de nuevo.';
            }
        }, 1000);
        msg.innerText = `Demasiados intentos. Reintentá en ${Math.ceil(restantes / 60)} min. (${restantes}s)`;
        return;
    }

    btn.disabled = false;

    if (!data?.success) { msg.innerText = data?.msg || 'Error de conexión'; return; }

    // Guardar en store — los suscriptores reaccionan automáticamente
    store.set('user',  data.user);
    store.set('token', data.token);
    store.set('role',  data.user.rol);

    setupUI();
}

function setupUI() {
    const user = store.get('user');
    const role = store.get('role');

    document.getElementById('login-overlay').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    document.getElementById('user-display').innerText = user.nombreCompleto || user.nombre || '';
    document.getElementById('role-display').innerText  = role;

    // Vista inicial por rol
    if      (role === 'Admin')        loadAdminView('usuarios');
    else if (role === 'Docente')      loadDocenteView('asistencia');
    else if (role === 'Orientacion')  loadOrientacionView('bus');
    else if (role === 'Estudiante')   loadStudentView('perfil');
    else if (role === 'Coordinacion') loadCoordinacionView('horarios');
}

function logout() {
    store.reset(); // dispara token → api.setToken(null) automáticamente
    document.getElementById('login-overlay').classList.remove('hidden');
    document.getElementById('app').classList.add('hidden');
    document.getElementById('login-user').value    = '';
    document.getElementById('login-pass').value    = '';
    document.getElementById('login-msg').innerText = '';
}

// ── MENÚ ──────────────────────────────────────────────────────────────────────
function toggleMenu() {
    document.getElementById('sidebar').classList.toggle('active');
    document.getElementById('sidebar-overlay').classList.toggle('active');
}

function closeMobileMenu() {
    document.getElementById('sidebar').classList.remove('active');
    document.getElementById('sidebar-overlay').classList.remove('active');
}

// ── SIDEBAR ───────────────────────────────────────────────────────────────────
const NAV_ITEMS = {
    Admin: [
        ['usuarios',      'Gestión de Usuarios'],
        ['asistencia',    'Asistencia'],
        ['calificaciones','Calificaciones'],
        ['reportes',      'Reportar Falta'],
        ['excusas',       'Excusas'],
        ['listados',      'Listados'],
        ['tareas',        'Blackboard (Tareas)'],
        ['historial',     'Historial Asistencia'],
        ['reporteNotas',  'Reporte de Notas'],
        ['bus',           'Buscador y Reportes'],
        ['pas',           'Pases de Salida'],
        ['exc',           'Registrar Excusa'],
        ['horarios',      'Consultar Horarios'],
        ['auditoria',     'Auditoría de Asistencia'],
        ['perfil',        'Mi Perfil'],
    ],
    Docente: [
        ['asistencia',    'Asistencia'],
        ['calificaciones','Calificaciones'],
        ['reportes',      'Reportar Falta'],
        ['excusas',       'Excusas'],
        ['listados',      'Listados'],
        ['tareas',        'Blackboard (Tareas)'],
        ['historial',     'Historial Asistencia'],
        ['reporteNotas',  'Reporte de Notas'],
        ['perfil',        'Mi Perfil'],
        ['horario',       'Mi Horario'],
    ],
    Orientacion: [
        ['bus',     'Buscador y Reportes'],
        ['pas',     'Pases de Salida'],
        ['exc',     'Registrar Excusa'],
        ['horario', 'Consultar Horario'],
        ['per',     'Mi Perfil'],
    ],
    Coordinacion: [
        ['horarios',  'Consultar Horarios'],
        ['auditoria', 'Auditoría de Asistencia'],
        ['perfil',    'Mi Perfil'],
    ],
    Estudiante: [
        ['perfil',         'Mi Perfil'],
        ['tareas',         'Mis Tareas'],
        ['reportes',       'Reportes Conducta'],
        ['asistencia',     'Asistencia'],
        ['calificaciones', 'Calificaciones'],
        ['rendimiento',    'Rendimiento (RA)'],
        ['periodos',       'Periodos (P)'],
        ['excusas',        'Excusas'],
        ['horario',        'Mi Horario'],
    ],
};

function renderSidebar() {
    const role  = store.get('role');
    const nav   = document.getElementById('sidebar-nav');
    const items = NAV_ITEMS[role] || [];

    // Sin onclick inline — addEventListener por cada botón
    nav.innerHTML = items
        .map(([view, label]) => `<button class="nav-btn" data-view="${view}">${label}</button>`)
        .join('');

    nav.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            navigate(btn.dataset.view);
            closeMobileMenu();
        });
    });
}

function setActiveNav(view) {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });
}

function navigate(view) {
    const role = store.get('role');

    if (role === 'Admin') {
        if (view === 'usuarios') loadAdminView(view);
        else if (view === 'perfil') loadAdminView(view);
        else if (['asistencia','calificaciones','reportes','excusas','listados','tareas','historial','reporteNotas'].includes(view)) loadDocenteView(view);
        else if (['bus','pas','exc'].includes(view)) loadOrientacionView(view);
        else if (['horarios','auditoria'].includes(view)) loadCoordinacionView(view);
    }
    else if (role === 'Docente')      loadDocenteView(view);
    else if (role === 'Orientacion')  loadOrientacionView(view);
    else if (role === 'Coordinacion') loadCoordinacionView(view);
    else if (role === 'Estudiante')   loadStudentView(view);
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
// Agrega un listener a un elemento del DOM de forma segura (si existe).
function on(id, event, fn) {
    document.getElementById(id)?.addEventListener(event, fn);
}

// ── DOCENTE ───────────────────────────────────────────────────────────────────
async function loadDocenteView(view) {
    setActiveNav(view);
    const content = document.getElementById('content-area');
    content.innerHTML = '<p>Cargando...</p>';

    const user = store.get('user');
    const cursosOpts = (user.cursos?.length)
        ? user.cursos.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('')
        : '';

    if (view === 'asistencia') {
        const hoy = new Date().toISOString().split('T')[0];
        content.innerHTML = `
            <div class="card">
                <h3>Pase de Lista Diario</h3>
                <div class="grid">
                    <select id="d-curso">
                        <option value="">-- Seleccione Curso --</option>${cursosOpts}
                    </select>
                    <div>
                        <label style="display:block;font-size:0.8rem;margin-bottom:5px">Fecha</label>
                        <input type="date" id="d-fecha" value="${hoy}">
                    </div>
                </div>
                <div id="d-area" style="margin-top:20px;"></div>
            </div>`;
        on('d-curso', 'change', e => docenteCargarAlumnos(e.target.value, 'asist'));

    } else if (view === 'calificaciones') {
        content.innerHTML = `
            <div class="card">
                <h3>Registro de Calificaciones</h3>
                <select id="d-curso">
                    <option value="">-- Seleccione Curso --</option>${cursosOpts}
                </select>
                <div id="d-area" style="margin-top:20px;"></div>
            </div>`;
        on('d-curso', 'change', e => docenteCargarAlumnos(e.target.value, 'notas'));

    } else if (view === 'reportes') {
        content.innerHTML = `
            <div class="card" style="border-left:5px solid var(--danger)">
                <h3 style="color:var(--danger)">Reporte de Conducta</h3>
                <select id="d-curso">
                    <option value="">-- Seleccione Curso --</option>${cursosOpts}
                </select>
                <div id="d-area" style="margin-top:20px;"></div>
            </div>`;
        on('d-curso', 'change', e => docenteCargarAlumnos(e.target.value, 'repo'));

    } else if (view === 'excusas') {
        content.innerHTML = `
            <div class="card">
                <h3>Excusas y Justificaciones</h3>
                <select id="d-curso-exc">
                    <option value="">-- Seleccione Curso --</option>${cursosOpts}
                </select>
                <div id="d-area" style="margin-top:20px;"></div>
            </div>`;
        on('d-curso-exc', 'change', e => docenteCargarExcusas(e.target.value));

    } else if (view === 'listados') {
        content.innerHTML = `
            <div class="card">
                <h3>Listados Oficiales</h3>
                <select id="d-curso-list">
                    <option value="">-- Seleccione Curso --</option>${cursosOpts}
                </select>
                <div id="d-area" style="margin-top:20px;"></div>
            </div>`;
        on('d-curso-list', 'change', e => docenteCargarAlumnos(e.target.value, 'lista'));

    } else if (view === 'historial') {
        const meses     = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
        const mesActual = new Date().getMonth();
        content.innerHTML = `
            <div class="card">
                <h3>Historial Mensual de Asistencia</h3>
                <div class="grid">
                    <select id="h-curso"><option value="">-- Curso --</option>${cursosOpts}</select>
                    <select id="h-mes">${meses.map((m, i) => `<option value="${i}"${i === mesActual ? ' selected' : ''}>${m}</option>`).join('')}</select>
                    <input type="number" id="h-anio" value="${new Date().getFullYear()}" placeholder="Año">
                </div>
                <button id="btn-historial" class="btn-primary">GENERAR REPORTE</button>
                <div id="d-area" style="margin-top:20px;overflow-x:auto;"></div>
            </div>`;
        on('btn-historial', 'click', docenteGenerarHistorial);

    } else if (view === 'reporteNotas') {
        content.innerHTML = `
            <div class="card">
                <h3>Consulta de Calificaciones</h3>
                <div class="grid">
                    <select id="rn-curso"><option value="">-- Curso --</option>${cursosOpts}</select>
                    <input id="rn-periodo" placeholder="Periodo (Ej: P1)">
                    <input id="rn-filtro" placeholder="Filtrar Actividad (Opcional)">
                </div>
                <button id="btn-reporte-notas" class="btn-primary">CONSULTAR</button>
                <div id="d-area" style="margin-top:20px;overflow-x:auto;"></div>
            </div>`;
        on('btn-reporte-notas', 'click', docenteGenerarReporteNotas);

    } else if (view === 'tareas') {
        content.innerHTML = `
            <div class="card">
                <h3>Blackboard — Asignar Tarea</h3>
                <select id="d-curso">
                    <option value="">-- Seleccione Curso --</option>${cursosOpts}
                </select>
                <input id="t-titulo" placeholder="Título de la Tarea">
                <textarea id="t-desc" placeholder="Descripción..." rows="3"></textarea>
                <div class="grid">
                    <div><label>Fecha Límite</label><input type="date" id="t-fecha"></div>
                    <div style="display:flex;align-items:center;gap:10px;">
                        <input type="checkbox" id="t-check" style="width:auto;margin:0">
                        <label style="margin:0">Completada en Aula</label>
                    </div>
                </div>
                <button id="btn-publicar-tarea" class="btn-primary">PUBLICAR TAREA</button>
                <div id="t-lista" style="margin-top:30px;border-top:1px solid #eee;padding-top:20px;"></div>
            </div>`;
        on('d-curso',           'change', e => docenteCargarTareas(e.target.value));
        on('btn-publicar-tarea','click',  () => docenteGuardar('tarea', document.getElementById('d-curso').value));

    } else if (view === 'perfil') {
        content.innerHTML = ui.renderPerfil(store.get('user'));

    } else if (view === 'horario') {
        content.innerHTML = `<div class="card"><h3>Mi Horario</h3><div id="d-horario">Cargando...</div></div>`;
        const res = await api.getHorario(store.get('user').id, 'docente');
        const div = document.getElementById('d-horario');
        if (res?.success && res.data.length) div.innerHTML = ui.renderHorarioTable(res.data);
        else div.innerHTML = 'No hay horario disponible.';
    }
}

async function docenteCargarAlumnos(idCurso, modo) {
    if (!idCurso) return;
    const div = document.getElementById('d-area');
    div.innerHTML = 'Cargando lista...';
    const data = await api.getAlumnos(idCurso);

    if (!data || !Array.isArray(data) || data.length === 0) {
        div.innerHTML = '<p>No hay alumnos en este curso.</p>';
        return;
    }

    if (modo === 'asist') {
        div.innerHTML = ui.renderTablaAsistencia(data);
        const btn = document.createElement('button');
        btn.className   = 'btn-primary';
        btn.style.marginTop = '20px';
        btn.innerText   = 'GUARDAR';
        btn.addEventListener('click', () => docenteGuardar('asistencia', idCurso));
        div.appendChild(btn);

    } else if (modo === 'notas') {
        div.innerHTML = `
            <div class="grid" style="margin-bottom:15px;align-items:end;">
                <div><label>Actividad</label><input id="d-act" placeholder="Ej: Examen Parcial" style="margin-bottom:0"></div>
                <div><label>Puntos Máx.</label><input id="d-max" type="number" placeholder="100" style="margin-bottom:0"></div>
                <div><label>Periodo / RA</label><input id="d-corte" placeholder="Ej: P1, RA1" style="margin-bottom:0"></div>
            </div>
            ${ui.renderTablaNotas(data)}`;
        const btn = document.createElement('button');
        btn.className   = 'btn-primary';
        btn.style.marginTop = '20px';
        btn.innerText   = 'GUARDAR NOTAS';
        btn.addEventListener('click', () => docenteGuardar('notas', idCurso));
        div.appendChild(btn);

    } else if (modo === 'repo') {
        div.innerHTML = `
            <label>Estudiante</label>
            <select id="d-est">${data.map(a => `<option value="${a.id}">${a.nombre}</option>`).join('')}</select>
            <label>Tipo</label>
            <select id="d-tipo"><option>Leve</option><option>Grave</option></select>
            <label>Descripción</label>
            <textarea id="d-desc" rows="3"></textarea>`;
        const btn = document.createElement('button');
        btn.className = 'btn-danger';
        btn.innerText = 'ENVIAR REPORTE';
        btn.addEventListener('click', () => docenteGuardar('reporte', idCurso));
        div.appendChild(btn);

    } else if (modo === 'lista') {
        div.innerHTML = ui.renderListado(data);
    }
}

async function docenteGuardar(tipo, idCurso) {
    const user         = store.get('user');
    const cursoObj     = user.cursos?.find(c => c.id == idCurso);
    const nombreAsig   = cursoObj?.modulo || cursoObj?.materia || '';

    if (tipo === 'asistencia') {
        const fecha   = document.getElementById('d-fecha').value;
        const payload = [];
        document.querySelectorAll('.d-row').forEach(r => {
            payload.push({ idEstudiante: r.dataset.id, idCurso, materia: nombreAsig, estado: r.querySelector('.d-val').value, fecha });
        });
        const res = await api.guardarAsistencia(payload);
        res?.success ? ui.toast('Asistencia guardada') : ui.toast(res?.msg || 'Error al guardar', 'error');

    } else if (tipo === 'notas') {
        const act   = document.getElementById('d-act').value;
        const max   = document.getElementById('d-max').value;
        const corte = document.getElementById('d-corte').value;
        if (!act || !max || !corte) { ui.toast('Complete: Actividad, Puntos Máx. y Periodo/RA', 'error'); return; }
        const payload = [];
        document.querySelectorAll('.d-row').forEach(r => {
            const val = r.querySelector('.d-val').value;
            if (val) payload.push({ idEstudiante: r.dataset.id, idCurso, modulo: nombreAsig, actividad: act, nota: val, maximo: max, periodo: corte });
        });
        if (!payload.length) { ui.toast('No hay notas ingresadas', 'error'); return; }
        const res = await api.guardarMasivo(payload);
        res?.success ? ui.toast('Notas guardadas') : ui.toast(res?.msg || 'Error al guardar', 'error');

    } else if (tipo === 'reporte') {
        const d = {
            idEstudiante: document.getElementById('d-est').value,
            idCurso,
            tipo:         document.getElementById('d-tipo').value,
            descripcion:  document.getElementById('d-desc').value,
        };
        const res = await api.guardarReporte({ datos: d });
        res?.success ? ui.toast('Reporte enviado') : ui.toast('Error al enviar', 'error');

    } else if (tipo === 'tarea') {
        if (!idCurso) { ui.toast('Seleccione un curso', 'error'); return; }
        const payload = {
            idCurso,
            titulo:      document.getElementById('t-titulo').value,
            descripcion: document.getElementById('t-desc').value,
            fecha:       document.getElementById('t-fecha').value,
            completada:  document.getElementById('t-check').checked,
        };
        const res = await api.guardarTarea(payload);
        if (res?.success) { ui.toast('Tarea publicada'); loadDocenteView('tareas'); }
        else ui.toast('Error al publicar', 'error');
    }
}

async function docenteCargarTareas(idCurso) {
    if (!idCurso) return;
    const div = document.getElementById('t-lista');
    div.innerHTML = 'Cargando tareas...';
    const res = await api.getTareasDocente(idCurso);
    if (!res?.success || !res.data.length) {
        div.innerHTML = "<p style='color:var(--text-light)'>No hay tareas para este curso.</p>";
        return;
    }
    div.innerHTML = `
        <h4>Tareas Publicadas</h4>
        <table class="web-table" id="tbl-tareas">
            <thead><tr><th>Título</th><th>Fecha</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>${res.data.map(t => `
                <tr>
                    <td>${t.titulo}</td>
                    <td>${new Date(t.fecha).toLocaleDateString()}</td>
                    <td>${t.completada ? '<span style="color:var(--success)">Completada</span>' : '<span style="color:orange">Pendiente</span>'}</td>
                    <td style="display:flex;gap:6px;">
                        <button data-id="${t.id}" data-accion="toggle" style="width:auto;padding:5px 10px;font-size:0.8rem;">${t.completada ? 'Reabrir' : 'Completar'}</button>
                        <button data-id="${t.id}" data-accion="delete" style="width:auto;padding:5px 10px;font-size:0.8rem;background:var(--danger);color:white;">Eliminar</button>
                    </td>
                </tr>`).join('')}
            </tbody>
        </table>`;

    // Un solo listener delegado para toda la tabla
    document.getElementById('tbl-tareas').addEventListener('click', async (e) => {
        const btn = e.target.closest('button[data-accion]');
        if (!btn) return;
        const { id, accion } = btn.dataset;
        if (!confirm(accion === 'delete' ? '¿Eliminar esta tarea?' : '¿Cambiar estado?')) return;
        await api.manageTarea(id, accion);
        docenteCargarTareas(idCurso);
    });
}

async function docenteCargarExcusas(idCurso) {
    if (!idCurso) return;
    const div = document.getElementById('d-area');
    div.innerHTML = 'Buscando excusas...';
    const res = await api.getExcusas(idCurso);
    if (!res?.success || !res.data?.length) {
        div.innerHTML = "<p style='color:var(--text-light)'>No hay excusas para este curso.</p>";
        return;
    }
    div.innerHTML = ui.renderExcusas(res.data);
}

async function docenteGenerarHistorial() {
    const curso = document.getElementById('h-curso').value;
    const mes   = document.getElementById('h-mes').value;
    const anio  = document.getElementById('h-anio').value;
    const div   = document.getElementById('d-area');
    if (!curso) { ui.toast('Seleccione un curso', 'error'); return; }
    div.innerHTML = 'Generando reporte...';
    const res = await api.getHistorial(curso, mes, anio);
    if (!res?.success || !res.data.length) { div.innerHTML = 'No hay datos para este periodo.'; return; }
    const diasDelMes = new Date(anio, parseInt(mes) + 1, 0).getDate();
    div.innerHTML = ui.renderHistorial(res.data, diasDelMes);
}

async function docenteGenerarReporteNotas() {
    const curso   = document.getElementById('rn-curso').value;
    const periodo = document.getElementById('rn-periodo').value;
    const filtro  = document.getElementById('rn-filtro').value;
    const div     = document.getElementById('d-area');
    if (!curso || !periodo) { ui.toast('Seleccione curso y escriba un Periodo/RA', 'error'); return; }
    div.innerHTML = 'Consultando...';
    const res = await api.getReporteNotas(curso, periodo, filtro);
    if (!res?.success || !res.data.length) { div.innerHTML = 'No se encontraron calificaciones.'; return; }
    const estudiantes = {};
    const columnas    = new Set();
    res.data.forEach(r => {
        if (!estudiantes[r.idEstudiante]) estudiantes[r.idEstudiante] = { nombre: r.nombre, notas: {} };
        columnas.add(r.actividad);
        estudiantes[r.idEstudiante].notas[r.actividad] = r.nota;
    });
    const user          = store.get('user');
    const cursoObj      = user.cursos?.find(c => c.id == curso);
    const materiaNombre = cursoObj?.modulo || cursoObj?.materia || '';
    div.innerHTML = ui.renderReporteNotas(estudiantes, Array.from(columnas).sort(), materiaNombre);
}

// ── COORDINACIÓN ──────────────────────────────────────────────────────────────
async function loadCoordinacionView(view) {
    setActiveNav(view);
    const content = document.getElementById('content-area');

    if (view === 'horarios') {
        content.innerHTML = `
            <div class="card">
                <h3>Consultar Horarios</h3>
                <div class="grid">
                    <div>
                        <label>Por Docente (ID)</label>
                        <div style="display:flex;gap:8px;">
                            <input id="c-doc-id" placeholder="Ej: DOC-001" style="margin:0">
                            <button id="btn-hor-doc" class="btn-primary" style="width:auto;">VER</button>
                        </div>
                    </div>
                    <div>
                        <label>Por Curso (ID)</label>
                        <div style="display:flex;gap:8px;">
                            <input id="c-cur-id" placeholder="Ej: 4A-INF" style="margin:0">
                            <button id="btn-hor-cur" class="btn-primary" style="width:auto;">VER</button>
                        </div>
                    </div>
                </div>
                <div id="c-hor-res" style="margin-top:20px;"></div>
            </div>`;
        on('btn-hor-doc', 'click', () => coordinacionVerHorario('docente'));
        on('btn-hor-cur', 'click', () => coordinacionVerHorario('curso'));

    } else if (view === 'auditoria') {
        content.innerHTML = `
            <div class="card">
                <h3>Auditoría de Asistencia</h3>
                <button id="btn-auditoria" class="btn-primary">EJECUTAR AUDITORÍA</button>
                <div id="c-res" style="margin-top:20px;"></div>
            </div>`;
        on('btn-auditoria', 'click', coordinacionAuditar);

    } else if (view === 'perfil') {
        content.innerHTML = ui.renderPerfil(store.get('user'));
    }
}

async function coordinacionVerHorario(tipo) {
    const id  = document.getElementById(tipo === 'docente' ? 'c-doc-id' : 'c-cur-id').value;
    const div = document.getElementById('c-hor-res');
    if (!id) { ui.toast('Ingrese un ID', 'error'); return; }
    div.innerHTML = 'Cargando...';
    const res = await api.getHorario(id, tipo);
    if (res?.success && res.data.length) div.innerHTML = ui.renderHorarioTable(res.data);
    else div.innerHTML = 'No se encontró horario.';
}

async function coordinacionAuditar() {
    const div = document.getElementById('c-res');
    div.innerHTML = 'Analizando...';
    const res = await api.getAuditoriaAsistencia();
    if (!res?.success) { div.innerHTML = 'Error al realizar auditoría.'; return; }
    if (!res.data.length) {
        div.innerHTML = `<div style="padding:15px;background:#d4edda;color:#155724;border-radius:8px;">✅ Todos los docentes han pasado lista hoy.</div>`;
        return;
    }
    let h = `<h4 style="color:var(--accent)">Alertas (${res.data.length})</h4>
        <table class="web-table"><thead><tr><th>Docente</th><th>Curso</th><th>Hora</th><th>Estado</th></tr></thead><tbody>`;
    res.data.forEach(r => h += `<tr><td>${r.docente}</td><td>${r.curso}</td><td>${r.hora}</td><td style="color:red;font-weight:bold">Pendiente</td></tr>`);
    div.innerHTML = h + '</tbody></table>';
}

// ── ORIENTACIÓN ───────────────────────────────────────────────────────────────
function loadOrientacionView(view) {
    setActiveNav(view);
    const content = document.getElementById('content-area');

    if (view === 'bus') {
        content.innerHTML = `
            <div class="card">
                <h3>Consulta Disciplinaria</h3>
                <div style="display:flex;gap:10px;">
                    <input type="text" id="o-bus-id" placeholder="ID del Estudiante..." style="margin:0">
                    <button id="btn-buscar" class="btn-primary" style="width:150px;">CONSULTAR</button>
                </div>
            </div>
            <div id="o-res" class="hidden"></div>`;
        on('btn-buscar', 'click', orientacionBuscar);
        on('o-bus-id',   'keydown', e => { if (e.key === 'Enter') orientacionBuscar(); });

    } else if (view === 'pas') {
        content.innerHTML = `
            <div class="card">
                <h3>Pase de Salida</h3>
                <div class="grid">
                    <div><label>ID Estudiante</label><input id="p-id"></div>
                    <div><label>N° Pase</label><input id="p-pds" readonly></div>
                </div>
                <div class="grid">
                    <div><label>Nombre</label><input id="p-nom" readonly></div>
                    <div><label>Curso</label><input id="p-cur" readonly></div>
                </div>
                <label>Nombre de quien retira</label><input id="p-retira">
                <label>Cédula / Pasaporte de quien retira</label><input id="p-cedula" placeholder="Ej: 402-1234567-8">
                <label>Motivo</label><textarea id="p-motivo"></textarea>
                <button id="btn-pase" class="btn-primary">GENERAR PDF</button>
            </div>`;
        on('p-id',     'change', orientacionDatosPase);
        on('btn-pase', 'click',  orientacionGenerarPase);

    } else if (view === 'exc') {
        content.innerHTML = `
            <div class="card">
                <h3>Registrar Excusa</h3>
                <label>ID Estudiante</label><input id="e-id">
                <div class="grid">
                    <div><label>Desde</label><input type="date" id="e-ini"></div>
                    <div><label>Hasta</label><input type="date" id="e-fin"></div>
                </div>
                <label>Motivo</label><textarea id="e-mot"></textarea>
                <button id="btn-excusa" class="btn-primary">GUARDAR</button>
            </div>`;
        on('btn-excusa', 'click', orientacionGuardarExcusa);

    } else if (view === 'horario') {
        content.innerHTML = `
            <div class="card">
                <h3>Consultar Horario de Curso</h3>
                <div style="display:flex;gap:10px;margin-bottom:20px;">
                    <input id="o-hor-id" placeholder="ID del Curso (Ej: 4A-INF)" style="margin:0">
                    <button id="btn-hor-ori" class="btn-primary" style="width:auto;">BUSCAR</button>
                </div>
                <div id="o-hor-res"></div>
            </div>`;
        on('btn-hor-ori', 'click', orientacionBuscarHorario);

    } else if (view === 'per') {
        content.innerHTML = ui.renderPerfil(store.get('user'));
    }
}

async function orientacionBuscar() {
    const id  = document.getElementById('o-bus-id').value.trim();
    const div = document.getElementById('o-res');
    if (!id) { ui.toast('Ingrese un ID', 'error'); return; }
    const res = await api.buscarEstudiante(id);

    if (!res?.success) {
        ui.toast(res?._status === 404 ? 'Estudiante no encontrado' : 'Error al buscar', 'error');
        return;
    }

    const d = res.data;
    div.classList.remove('hidden');
    div.innerHTML = `
        <div class="card">
            <h3>${d.nombre}</h3>
            <p>Curso: <strong>${d.curso}</strong> | Reportes: <strong>${d.totalReportes}</strong></p>
            ${d.tieneExcusa ? `<div style="background:#fff3cd;padding:10px;border-radius:8px;color:#856404;">📋 Excusa activa: ${d.detalleExcusa}</div>` : ''}
            <div style="margin-top:15px;display:flex;gap:8px;flex-wrap:wrap;">
                <button data-notas="getStudentGradesDetail" class="btn-primary" style="width:auto;padding:8px 12px;font-size:0.8rem;">Notas Detalle</button>
                <button data-notas="getStudentGradesP"      class="btn-primary" style="width:auto;padding:8px 12px;font-size:0.8rem;">Notas P</button>
                <button data-notas="getStudentGradesRA"     class="btn-primary" style="width:auto;padding:8px 12px;font-size:0.8rem;">Notas RA</button>
            </div>
            <div id="o-notas-area" style="margin-top:15px;"></div>
        </div>
        <div class="card">
            <h3>Historial de Reportes</h3>
            <table class="web-table"><thead><tr><th>Fecha</th><th>Falta</th><th>Docente</th></tr></thead><tbody>
            ${d.detalleReportes.map(r => `<tr><td>${new Date(r.fecha).toLocaleDateString()}</td><td>${r.falta}</td><td>${r.docente}</td></tr>`).join('')}
            </tbody></table>
        </div>`;

    div.querySelectorAll('[data-notas]').forEach(btn => {
        btn.addEventListener('click', () => orientacionVerNotas(btn.dataset.notas));
    });
}

async function orientacionVerNotas(endpoint) {
    const div   = document.getElementById('o-notas-area');
    div.innerHTML = 'Cargando notas...';
    const fnMap = {
        getStudentGradesDetail: api.getStudentGradesDetail,
        getStudentGradesP:      api.getStudentGradesP,
        getStudentGradesRA:     api.getStudentGradesRA,
    };
    const res = await fnMap[endpoint]?.();
    if (res?.success && res.data.length) {
        const keys = Object.keys(res.data[0]);
        let h = `<table class="web-table"><thead><tr>${keys.map(k => `<th>${k}</th>`).join('')}</tr></thead><tbody>`;
        res.data.forEach(r => h += `<tr>${keys.map(k => `<td>${r[k]}</td>`).join('')}</tr>`);
        div.innerHTML = h + '</tbody></table>';
    } else {
        div.innerHTML = 'No hay calificaciones registradas.';
    }
}

async function orientacionDatosPase() {
    const id  = document.getElementById('p-id').value;
    const res = await api.buscarEstudiante(id);
    if (res?.success) {
        document.getElementById('p-pds').value = Date.now();
        document.getElementById('p-nom').value = res.data.nombre;
        document.getElementById('p-cur').value = res.data.curso;
    }
}

async function orientacionGenerarPase() {
    const retira   = document.getElementById('p-retira').value.trim();
    const cedula   = document.getElementById('p-cedula').value.trim();
    const motivo   = document.getElementById('p-motivo').value.trim();
    const numPase  = document.getElementById('p-pds').value;
    const nombre   = document.getElementById('p-nom').value;
    const curso    = document.getElementById('p-cur').value;
    const idEst    = document.getElementById('p-id').value.trim();

    if (!idEst)    { ui.toast('Ingrese el ID del estudiante', 'error'); return; }
    if (!retira)   { ui.toast('Ingrese el nombre de quien retira', 'error'); return; }
    if (!cedula)   { ui.toast('Ingrese la cédula/pasaporte de quien retira', 'error'); return; }
    if (!motivo)   { ui.toast('Ingrese el motivo', 'error'); return; }

    const { jsPDF } = window.jspdf;
    const doc   = new jsPDF({ unit: 'mm', format: 'a4' });
    const user  = store.get('user');
    const fecha = new Date().toLocaleDateString('es-DO', { year: 'numeric', month: 'long', day: 'numeric' });
    const hora  = new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' });

    const W = 210; // ancho A4
    const M = 20;  // margen

    // ── Borde exterior ────────────────────────────────────────────────────────
    doc.setDrawColor(0, 48, 135);
    doc.setLineWidth(0.8);
    doc.rect(M - 5, 10, W - (M - 5) * 2, 267);

    // ── Encabezado ────────────────────────────────────────────────────────────
    doc.setFillColor(0, 48, 135);
    doc.rect(M - 5, 10, W - (M - 5) * 2, 22, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('INSTITUTO POLITÉCNICO MONSEÑOR HUGO URIBE', W / 2, 19, { align: 'center' });
    doc.setFontSize(11);
    doc.text('DEPARTAMENTO DE ORIENTACIÓN', W / 2, 26, { align: 'center' });

    // ── Título ────────────────────────────────────────────────────────────────
    doc.setTextColor(206, 17, 38);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('PASE DE SALIDA', W / 2, 42, { align: 'center' });

    // ── Línea separadora ──────────────────────────────────────────────────────
    doc.setDrawColor(206, 17, 38);
    doc.setLineWidth(0.5);
    doc.line(M, 45, W - M, 45);

    // ── Info del pase ─────────────────────────────────────────────────────────
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`N° ${numPase}`, M, 51);
    doc.text(`Fecha: ${fecha}  Hora: ${hora}`, W - M, 51, { align: 'right' });

    // ── Tabla de datos ────────────────────────────────────────────────────────
    const campos = [
        ['Estudiante',              nombre],
        ['Curso',                   curso],
        ['Nombre de quien retira',  retira],
        ['Cédula / Pasaporte',      cedula],
        ['Motivo',                  motivo],
        ['Autorizado por',          user.nombreCompleto || user.nombre],
    ];

    let y = 60;
    doc.setLineWidth(0.3);
    campos.forEach(([label, valor], i) => {
        const bg = i % 2 === 0 ? [245, 247, 252] : [255, 255, 255];
        doc.setFillColor(...bg);
        doc.rect(M, y, W - M * 2, 10, 'F');
        doc.setDrawColor(220, 220, 220);
        doc.rect(M, y, W - M * 2, 10);

        doc.setTextColor(0, 48, 135);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(label + ':', M + 3, y + 6.5);

        doc.setTextColor(50, 50, 50);
        doc.setFont('helvetica', 'normal');
        doc.text(valor || '—', M + 55, y + 6.5);

        y += 10;
    });

    // ── Firmas ────────────────────────────────────────────────────────────────
    y += 20;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4);
    doc.line(M,          y, M + 60,      y);
    doc.line(W - M - 60, y, W - M,       y);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text('Firma — Orientación',       M,          y + 5);
    doc.text('Firma — Quien retira', W - M - 60, y + 5);

    // ── Pie ───────────────────────────────────────────────────────────────────
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Documento generado por SIA-IPMHU', W / 2, 272, { align: 'center' });

    // ── Guardar PDF ───────────────────────────────────────────────────────────
    doc.save(`pase-${idEst}-${numPase}.pdf`);

    // ── Guardar en BD ─────────────────────────────────────────────────────────
    const res = await api.guardarPase({
        tipo:          'pase',
        idEstudiante:  idEst,
        motivo,
        autorizadoPor: user.nombreCompleto || user.nombre,
        cedulaRetira:  cedula,
        nombreRetira:  retira,
    });

    res?.success ? ui.toast('Pase generado y guardado') : ui.toast('PDF generado pero error al guardar en BD', 'error');
}

async function orientacionBuscarHorario() {
    const id  = document.getElementById('o-hor-id').value;
    const div = document.getElementById('o-hor-res');
    div.innerHTML = 'Cargando...';
    const res = await api.getHorario(id, 'curso');
    if (res?.success && res.data.length) div.innerHTML = ui.renderHorarioTable(res.data);
    else div.innerHTML = '<p>No se encontró horario para ese ID.</p>';
}

async function orientacionGuardarExcusa() {
    const fInicio = document.getElementById('e-ini').value;
    const fFin    = document.getElementById('e-fin').value;
    if (new Date(fInicio) > new Date(fFin)) {
        ui.toast('La fecha de inicio no puede ser mayor a la fecha fin', 'error');
        return;
    }
    const user = store.get('user');
    const res  = await api.guardarExcusa({
        tipo:          'excusa',
        idEstudiante:  document.getElementById('e-id').value,
        fInicio, fFin,
        motivo:        document.getElementById('e-mot').value,
        autorizadoPor: user.nombreCompleto || user.nombre,
    });
    res?.success ? ui.toast('Excusa guardada') : ui.toast('Error al guardar', 'error');
}

// ── ESTUDIANTE ────────────────────────────────────────────────────────────────
async function loadStudentView(view) {
    setActiveNav(view);
    const content = document.getElementById('content-area');

    if (view === 'perfil') {
        content.innerHTML = ui.renderPerfil(store.get('user'));

    } else if (view === 'reportes') {
        await studentRender(api.getStudentReports, content, data => {
            if (!data.length) return '<p>Sin reportes de conducta.</p>';
            let h = `<table class="web-table"><thead><tr><th>Fecha</th><th>Tipo</th><th>Docente</th></tr></thead><tbody>`;
            data.forEach(r => h += `<tr><td>${new Date(r.fecha).toLocaleDateString()}</td><td>${r.tipo}</td><td>${r.docente}</td></tr>`);
            return h + '</tbody></table>';
        });

    } else if (view === 'asistencia') {
        await studentRender(api.getStudentAttendance, content, data => {
            const materias = [...new Set(data.map(d => d.materia))];
            let h = `<div class="filter-bar">
                <select onchange="window.ui.filtrarTabla('t-asist',1,this.value)">
                    <option value="">Todas las Materias</option>
                    ${materias.map(m => `<option>${m}</option>`).join('')}
                </select></div>`;
            h += `<table class="web-table" id="t-asist"><thead><tr><th>Fecha</th><th>Materia</th><th>Estado</th></tr></thead><tbody>`;
            data.forEach(r => h += `<tr><td>${new Date(r.fecha).toLocaleDateString()}</td><td>${r.materia}</td><td>${r.estado}</td></tr>`);
            return h + '</tbody></table>';
        });

    } else if (view === 'calificaciones') {
        await studentRender(api.getStudentGradesDetail, content, data => {
            const mods = [...new Set(data.map(d => d.modulo))];
            const pers = [...new Set(data.map(d => d.periodo))];
            let h = `<div class="filter-bar">
                <select onchange="window.ui.filtrarTabla('t-cal',0,this.value)"><option value="">Todos los Módulos</option>${mods.map(m => `<option>${m}</option>`).join('')}</select>
                <select onchange="window.ui.filtrarTabla('t-cal',1,this.value)"><option value="">Todos los Periodos</option>${pers.map(p => `<option>${p}</option>`).join('')}</select>
                <input placeholder="Filtrar Actividad..." onkeyup="window.ui.filtrarTabla('t-cal',2,this.value)">
            </div>`;
            h += `<table class="web-table" id="t-cal"><thead><tr><th>Materia</th><th>Periodo</th><th>Actividad</th><th>Nota</th></tr></thead><tbody>`;
            data.forEach(r => h += `<tr><td>${r.modulo}</td><td>${r.periodo}</td><td>${r.actividad}</td><td>${r.nota}</td></tr>`);
            return h + '</tbody></table>';
        });

    } else if (view === 'rendimiento') {
        await studentRender(api.getStudentGradesRA, content, data => {
            const mods = [...new Set(data.map(d => d.modulo))];
            let h = `<div class="filter-bar"><select onchange="window.ui.filtrarTabla('t-ra',0,this.value)">
                <option value="">Todos los Módulos</option>${mods.map(m => `<option>${m}</option>`).join('')}
            </select></div>`;
            h += `<table class="web-table" id="t-ra"><thead><tr><th>Módulo</th><th>RA</th><th>Nota</th></tr></thead><tbody>`;
            data.forEach(r => h += `<tr><td>${r.modulo}</td><td>${r.ra}</td><td>${r.notaFinal}</td></tr>`);
            return h + '</tbody></table>';
        });

    } else if (view === 'periodos') {
        await studentRender(api.getStudentGradesP, content, data => {
            let h = `<table class="web-table"><thead><tr><th>Materia</th><th>P1</th><th>P2</th><th>P3</th><th>P4</th><th>Final</th></tr></thead><tbody>`;
            data.forEach(r => h += `<tr><td>${r.materia}</td><td>${r.p1 ?? '-'}</td><td>${r.p2 ?? '-'}</td><td>${r.p3 ?? '-'}</td><td>${r.p4 ?? '-'}</td><td>${r.pFinal ?? '-'}</td></tr>`);
            return h + '</tbody></table>';
        });

    } else if (view === 'excusas') {
        await studentRender(api.getStudentExcuses, content, data =>
            ui.renderExcusas(data.map(e => ({
                nombre: '',
                desde:  e.fechaInicio || e.fecha_inicio,
                hasta:  e.fechaFin    || e.fecha_fin,
                motivo: e.motivo,
            })))
        );

    } else if (view === 'tareas') {
        await studentRender(api.getTareasEstudiante, content, data => ui.renderTareas(data));

    } else if (view === 'horario') {
        content.innerHTML = `<div class="card"><h3>Horario de Clases</h3><div id="s-horario">Cargando...</div></div>`;
        const user = store.get('user');
        const res  = await api.getHorario(user.cursoId || user.cursoid, 'curso');
        const div  = document.getElementById('s-horario');
        if (res?.success && res.data.length) div.innerHTML = ui.renderHorarioTable(res.data);
        else div.innerHTML = 'No hay horario disponible.';
    }
}

// ── ADMIN ─────────────────────────────────────────────────────────────────────
let _adminPagina  = 1;
let _adminBuscar  = '';
let _adminRol     = '';
let _adminCursos  = [];

async function loadAdminView(view) {
    setActiveNav(view);
    const content = document.getElementById('content-area');

    if (view === 'usuarios') {
        content.innerHTML = `
            <div class="card">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:10px;">
                    <h3 style="margin:0">Gestión de Usuarios</h3>
                    <button id="btn-nuevo-usuario" class="btn-primary" style="width:auto;padding:10px 20px;">+ Nuevo Usuario</button>
                </div>
                <div class="filter-bar">
                    <input id="adm-buscar" placeholder="Buscar por nombre o ID..." style="margin:0">
                    <select id="adm-rol" style="margin:0;width:auto;">
                        <option value="">Todos los roles</option>
                        <option>Docente</option>
                        <option>Estudiante</option>
                        <option>Orientacion</option>
                        <option>Coordinacion</option>
                        <option>Admin</option>
                    </select>
                    <button id="btn-adm-buscar" class="btn-primary" style="width:auto;padding:10px 16px;">BUSCAR</button>
                </div>
                <div id="adm-tabla"></div>
                <div id="adm-paginacion" style="display:flex;gap:8px;justify-content:center;margin-top:15px;"></div>
            </div>
            <div id="adm-modal" class="hidden"></div>`;

        on('btn-nuevo-usuario', 'click', () => adminAbrirModal());
        on('btn-adm-buscar',    'click', () => {
            _adminBuscar = document.getElementById('adm-buscar').value;
            _adminRol    = document.getElementById('adm-rol').value;
            _adminPagina = 1;
            adminCargarTabla();
        });
        on('adm-buscar', 'keydown', e => {
            if (e.key === 'Enter') document.getElementById('btn-adm-buscar').click();
        });

        // Cargar cursos para los formularios
        const cursosRes = await api.adminGetCursos();
        if (cursosRes?.success) _adminCursos = cursosRes.data;

        adminCargarTabla();

    } else if (view === 'perfil') {
        content.innerHTML = ui.renderPerfil(store.get('user'));
    }
}

async function adminCargarTabla() {
    const div = document.getElementById('adm-tabla');
    div.innerHTML = 'Cargando...';

    const res = await api.adminGetUsuarios({
        buscar:    _adminBuscar,
        rol:       _adminRol,
        pagina:    _adminPagina,
        porPagina: 20,
    });

    if (!res?.success) { div.innerHTML = '<p>Error al cargar usuarios.</p>'; return; }

    if (!res.data.length) { div.innerHTML = '<p style="color:var(--text-light)">No se encontraron usuarios.</p>'; return; }

    let h = `<table class="web-table" id="tbl-usuarios">
        <thead><tr>
            <th>ID</th><th>Nombre</th><th>Rol</th><th>Curso</th><th>Estado</th><th>Acciones</th>
        </tr></thead><tbody>
        ${res.data.map(u => `
            <tr data-id="${u.id}">
                <td><code style="font-size:0.8rem">${u.id}</code></td>
                <td>${u.nombre}</td>
                <td><span style="background:#e8f0fe;color:var(--primary);padding:3px 8px;border-radius:12px;font-size:0.8rem;font-weight:600">${u.rol}</span></td>
                <td>${u.curso || '—'}</td>
                <td>${u.activo !== false
                    ? '<span style="color:var(--success);font-weight:600">Activo</span>'
                    : '<span style="color:var(--danger);font-weight:600">Inactivo</span>'}</td>
                <td style="display:flex;gap:6px;flex-wrap:wrap;">
                    <button data-accion="editar"     data-id="${u.id}" style="width:auto;padding:5px 10px;font-size:0.8rem;">Editar</button>
                    <button data-accion="toggle"     data-id="${u.id}" style="width:auto;padding:5px 10px;font-size:0.8rem;background:${u.activo !== false ? 'orange' : 'var(--success)'};color:white;">${u.activo !== false ? 'Desactivar' : 'Activar'}</button>
                    <button data-accion="eliminar"   data-id="${u.id}" style="width:auto;padding:5px 10px;font-size:0.8rem;background:var(--danger);color:white;">Eliminar</button>
                </td>
            </tr>`).join('')}
        </tbody></table>`;

    div.innerHTML = h;

    // Delegación de eventos en la tabla
    document.getElementById('tbl-usuarios').addEventListener('click', async (e) => {
        const btn = e.target.closest('button[data-accion]');
        if (!btn) return;
        const { accion, id } = btn.dataset;

        if (accion === 'editar') {
            adminAbrirModal(id);
        } else if (accion === 'toggle') {
            const user = res.data.find(u => u.id === id);
            const accionTexto = user?.activo !== false ? 'desactivar' : 'activar';
            if (!confirm(`¿Seguro que quieres ${accionTexto} a ${user?.nombre}?`)) return;
            const r = await api.adminToggleActivo(id);
            r?.success ? (ui.toast(r.msg), adminCargarTabla()) : ui.toast(r?.msg || 'Error', 'error');
        } else if (accion === 'eliminar') {
            const user = res.data.find(u => u.id === id);
            if (!confirm(`¿Seguro que quieres ELIMINAR permanentemente a ${user?.nombre}? Esta acción no se puede deshacer.`)) return;
            const r = await api.adminEliminarUsuario(id);
            r?.success ? (ui.toast('Usuario eliminado'), adminCargarTabla()) : ui.toast(r?.msg || 'Error', 'error');
        }
    });

    // Paginación
    const pag = document.getElementById('adm-paginacion');
    pag.innerHTML = '';
    if (res.paginas > 1) {
        for (let i = 1; i <= res.paginas; i++) {
            const btn = document.createElement('button');
            btn.innerText  = i;
            btn.style.cssText = `width:auto;padding:6px 12px;font-size:0.85rem;${i === _adminPagina ? 'background:var(--primary);color:white;' : 'background:#f0f4ff;color:var(--primary);'}`;
            btn.addEventListener('click', () => { _adminPagina = i; adminCargarTabla(); });
            pag.appendChild(btn);
        }
    }
}

async function adminAbrirModal(id = null) {
    const modal  = document.getElementById('adm-modal');
    const titulo = id ? 'Editar Usuario' : 'Nuevo Usuario';
    let datos    = { id: '', nombre: '', rol: 'Docente', cursoId: '', cedula: '', telefono: '', email: '' };

    if (id) {
        const res = await api.adminGetUsuario(id);
        if (!res?.success) { ui.toast('Error al cargar usuario', 'error'); return; }
        datos = res.data;
    }

    const cursosOpts = _adminCursos.map(c =>
        `<option value="${c.id}" ${datos.cursoId === c.id ? 'selected' : ''}>${c.nombre}</option>`
    ).join('');

    modal.classList.remove('hidden');
    modal.innerHTML = `
        <div style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px;">
            <div style="background:white;border-radius:12px;padding:30px;width:100%;max-width:500px;max-height:90vh;overflow-y:auto;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
                    <h3 style="margin:0;color:var(--primary)">${titulo}</h3>
                    <button id="btn-cerrar-modal" style="width:auto;padding:5px 12px;background:transparent;color:var(--text-light);border:1px solid var(--border);">✕</button>
                </div>
                <label>ID de Usuario ${id ? '(no editable)' : '(obligatorio)'}</label>
                <input id="m-id" value="${datos.id}" ${id ? 'readonly style="background:#f5f5f5"' : ''}>
                <label>Nombre Completo</label>
                <input id="m-nombre" value="${datos.nombre}">
                <label>Rol</label>
                <select id="m-rol">
                    ${['Docente','Estudiante','Orientacion','Coordinacion','Admin'].map(r =>
                        `<option value="${r}" ${datos.rol === r ? 'selected' : ''}>${r}</option>`
                    ).join('')}
                </select>
                <label>Curso (solo para Estudiantes y Docentes)</label>
                <select id="m-curso">
                    <option value="">— Sin curso —</option>${cursosOpts}
                </select>
                <label>Cédula</label>
                <input id="m-cedula" value="${datos.cedula || ''}">
                <label>Teléfono</label>
                <input id="m-telefono" value="${datos.telefono || ''}">
                <label>Email</label>
                <input id="m-email" value="${datos.email || ''}">
                <label>${id ? 'Nueva Contraseña (dejar vacío para no cambiar)' : 'Contraseña (obligatoria)'}</label>
                <input id="m-password" type="password" placeholder="${id ? 'Nueva contraseña...' : 'Mínimo 8 caracteres'}">
                <div style="display:flex;gap:10px;margin-top:10px;">
                    <button id="btn-guardar-usuario" class="btn-primary">GUARDAR</button>
                    <button id="btn-cancelar-modal" style="background:transparent;color:var(--text-light);border:1px solid var(--border);">Cancelar</button>
                </div>
            </div>
        </div>`;

    on('btn-cerrar-modal',  'click', () => modal.classList.add('hidden'));
    on('btn-cancelar-modal','click', () => modal.classList.add('hidden'));
    on('btn-guardar-usuario','click', () => adminGuardarUsuario(id));
}

async function adminGuardarUsuario(id = null) {
    const payload = {
        id:       document.getElementById('m-id').value.trim(),
        nombre:   document.getElementById('m-nombre').value.trim(),
        rol:      document.getElementById('m-rol').value,
        cursoId:  document.getElementById('m-curso').value || null,
        cedula:   document.getElementById('m-cedula').value.trim() || null,
        telefono: document.getElementById('m-telefono').value.trim() || null,
        email:    document.getElementById('m-email').value.trim() || null,
        password: document.getElementById('m-password').value || null,
    };

    if (!payload.nombre) { ui.toast('El nombre es obligatorio', 'error'); return; }
    if (!id && !payload.password) { ui.toast('La contraseña es obligatoria para usuarios nuevos', 'error'); return; }

    const res = id
        ? await api.adminEditarUsuario(id, payload)
        : await api.adminCrearUsuario(payload);

    if (res?.success) {
        ui.toast(res.msg);
        document.getElementById('adm-modal').classList.add('hidden');
        adminCargarTabla();
    } else {
        ui.toast(res?.msg || 'Error al guardar', 'error');
    }
}

async function studentRender(apiFn, container, renderFn) {
    container.innerHTML = '<p>Cargando...</p>';
    const data = await apiFn();
    if (data?.success) {
        container.innerHTML = `<div class="card">${renderFn(data.data)}</div>`;
    } else {
        container.innerHTML = '<p>Error al cargar datos.</p>';
    }
}
