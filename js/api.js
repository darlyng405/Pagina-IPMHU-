// js/api.js
const API_BASE = 'https://backend-ipmhu.onrender.com/api';
let AUTH_TOKEN  = null;
let _onUnauthorized = null;

export function setToken(token) { AUTH_TOKEN = token; }

/** Registra un callback para cuando el token expire (F-UX-02) */
export function onUnauthorized(fn) { _onUnauthorized = fn; }

/**
 * authFetch
 * - Inyecta JWT
 * - Adjunta _status a la respuesta
 * - F-UX-02: si recibe 401 llama a _onUnauthorized (logout automático)
 * - F-ARC-03: eliminado normalizeKeys — el backend ya devuelve camelCase
 */
async function authFetch(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...(AUTH_TOKEN && { Authorization: `Bearer ${AUTH_TOKEN}` }),
        ...options.headers,
    };
    try {
        const res  = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
        const data = await res.json();
        data._status = res.status;

        // F-UX-02: token expirado → logout automático
        if (res.status === 401 && _onUnauthorized) {
            _onUnauthorized();
            return null;
        }

        return data;
    } catch (err) {
        console.error(`Error en ${endpoint}:`, err);
        return null;
    }
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export async function login(usuario, password) {
    return await authFetch('/login', { method: 'POST', body: JSON.stringify({ usuario, password }) });
}

export async function cambiarPassword(passwordActual, passwordNueva) {
    return await authFetch('/cambiarPassword', {
        method: 'POST',
        body: JSON.stringify({ password_actual: passwordActual, password_nueva: passwordNueva }),
    });
}

// ── Docente ───────────────────────────────────────────────────────────────────
export async function getAlumnos(cursoId) {
    return await authFetch(`/getAlumnos?curso=${cursoId}`);
}
export async function guardarAsistencia(datos) {
    return await authFetch('/guardarAsistencia', { method: 'POST', body: JSON.stringify({ datos }) });
}
export async function guardarMasivo(datos) {
    return await authFetch('/guardarMasivo', { method: 'POST', body: JSON.stringify({ datos }) });
}
export async function getExcusas(cursoId) {
    return await authFetch(`/getExcusas?curso=${cursoId}`);
}
export async function guardarReporte(datos) {
    return await authFetch('/guardarReporte', { method: 'POST', body: JSON.stringify({ datos }) });
}
export async function guardarTarea(datos) {
    return await authFetch('/guardarTarea', { method: 'POST', body: JSON.stringify({ datos }) });
}
export async function getTareasDocente(cursoId) {
    return await authFetch(`/getTareasDocente?curso=${cursoId}`);
}
export async function manageTarea(id, tipo) {
    return await authFetch('/manageTarea', { method: 'POST', body: JSON.stringify({ id, tipo }) });
}
export async function getHistorial(curso, mes, anio) {
    return await authFetch(`/getHistorial?curso=${curso}&mes=${mes}&anio=${anio}`);
}
export async function getReporteNotas(curso, periodo, filtro = '') {
    return await authFetch(`/getReporteNotas?curso=${curso}&periodo=${encodeURIComponent(periodo)}&filtro=${encodeURIComponent(filtro)}`);
}

// ── Estudiante ────────────────────────────────────────────────────────────────
export async function getStudentGradesDetail() { return await authFetch('/getStudentGradesDetail'); }
export async function getStudentGradesP()      { return await authFetch('/getStudentGradesP'); }
export async function getStudentGradesRA()     { return await authFetch('/getStudentGradesRA'); }
export async function getStudentAttendance()   { return await authFetch('/getStudentAttendance'); }
export async function getStudentExcuses()      { return await authFetch('/getStudentExcuses'); }
export async function getTareasEstudiante()    { return await authFetch('/getTareasEstudiante'); }
export async function getStudentReports()      { return await authFetch('/getStudentReports'); }

// ── Orientación ───────────────────────────────────────────────────────────────
export async function buscarEstudiante(id) { return await authFetch(`/buscarEstudiante?id=${id}`); }
export async function guardarExcusa(payload) {
    return await authFetch('/excusa', { method: 'POST', body: JSON.stringify(payload) });
}
export async function guardarPase(payload) {
    return await authFetch('/pase', { method: 'POST', body: JSON.stringify(payload) });
}
// payload esperado: { tipo, idEstudiante, motivo, autorizadoPor, cedulaRetira, nombreRetira }

// ── Horario / Auditoría ───────────────────────────────────────────────────────
export async function getHorario(id, tipo) {
    return await authFetch(`/getHorario?id=${encodeURIComponent(id)}&tipo=${tipo}`);
}
export async function getAuditoriaAsistencia() { return await authFetch('/getAuditoriaAsistencia'); }
