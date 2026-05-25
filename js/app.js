// js/app.js — Orquestador principal: auth, router, sidebar.
// Toda la lógica de vistas vive en los módulos de rol correspondientes.
import { store }                           from './store.js';
import * as api                            from './api.js';
import * as ui                             from './ui.js';
import { loadDocenteView }                 from './docenteView.js';
import { loadStudentView }                 from './estudianteView.js';
import { loadOrientacionView }             from './orientacionView.js';
import { loadCoordinacionView }            from './coordinacionView.js';
import { loadAdminView }                   from './adminView.js';

// ── Exponer filtrarTabla para los onchange de filtros generados dinámicamente ──
window.ui = { filtrarTabla: ui.filtrarTabla };

// ── Suscripciones al store ────────────────────────────────────────────────────
store.on('token', (token) => api.setToken(token));
store.on('role',  (role)  => { if (role) renderSidebar(); });

// ── Inicialización ────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-login').addEventListener('click', handleLogin);
    document.getElementById('logout-btn').addEventListener('click', logout);
    document.getElementById('menu-btn').addEventListener('click', toggleMenu);
    document.getElementById('sidebar-overlay').addEventListener('click', toggleMenu);
    document.getElementById('login-pass').addEventListener('keydown', e => {
        if (e.key === 'Enter') handleLogin();
    });

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
    document.getElementById('role-display').innerText = role;

    if      (role === 'Admin')        navigate('usuarios');
    else if (role === 'Docente')      navigate('asistencia');
    else if (role === 'Orientacion')  navigate('bus');
    else if (role === 'Estudiante')   navigate('perfil');
    else if (role === 'Coordinacion') navigate('horarios');
}

function logout() {
    store.reset();
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

// ── HELPERS ───────────────────────────────────────────────────────────────────
function on(id, event, fn) {
    document.getElementById(id)?.addEventListener(event, fn);
}

// Contexto compartido que se pasa a los módulos de vista
const ctx = () => ({ setActiveNav, on });

// ── ROUTER ────────────────────────────────────────────────────────────────────
function navigate(view) {
    const role = store.get('role');

    if (role === 'Admin') {
        if (['usuarios', 'perfil'].includes(view))                                              loadAdminView(view, ctx());
        else if (['asistencia','calificaciones','reportes','excusas','listados','tareas','historial','reporteNotas'].includes(view)) loadDocenteView(view, ctx());
        else if (['bus','pas','exc'].includes(view))                                            loadOrientacionView(view, ctx());
        else if (['horarios','auditoria'].includes(view))                                       loadCoordinacionView(view, ctx());
    }
    else if (role === 'Docente')      loadDocenteView(view, ctx());
    else if (role === 'Orientacion')  loadOrientacionView(view, ctx());
    else if (role === 'Coordinacion') loadCoordinacionView(view, ctx());
    else if (role === 'Estudiante')   loadStudentView(view, ctx());
}
