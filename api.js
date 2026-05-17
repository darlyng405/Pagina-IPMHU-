// js/api.js — Centraliza todas las peticiones HTTP al backend SIA-IPMHU
const API_BASE = 'https://backend-ipmhu.onrender.com/api';
let AUTH_TOKEN = null;

export function setToken(token) {
    AUTH_TOKEN = token;
}

/**
 * normalizeKeys
 * Convierte recursivamente todas las claves de un objeto a minúsculas.
 * Actúa como red de seguridad ante respuestas legacy — puede removerse
 * en v1.2 una vez confirmada la migración completa a camelCase.
 */
function normalizeKeys(obj) {
    if (Array.isArray(obj)) {
        return obj.map(normalizeKeys);
    } else if (obj !== null && typeof obj === 'object') {
        const newObj = {};
        for (const key of Object.keys(obj)) {
            newObj[key.toLowerCase()] = normalizeKeys(obj[key]);
        }
        return newObj;
    }
    return obj;
}

/**
 * authFetch
 * Envoltorio para fetch que inyecta el JWT y normaliza la respuesta.
 * Incluye el HTTP status en data._status para que el FE reaccione
 * a códigos específicos (429 rate limit, 401 expirado) sin romper
 * la interfaz existente.
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
        return normalizeKeys(data);
    } catch (err) {
        console.error(`Error en ${endpoint}:`, err);
        return null;
    }
}

// ==================== AUTENTICACIÓN ====================

export async function login(usuario, password) {
    return await authFetch('/login', {
        method: 'POST',
        body: JSON.stringify({ usuario, password }),
    });
}

/** El id del usuario lo toma el backend del token JWT — no se envía en el body. */
export async function cambiarPassword(passwordActual, passwordNueva) {
    return await authFetch('/cambiarPassword', {
        method: 'POST',
        body: JSON.stringify({ password_actual: passwordActual, password_nueva: passwordNueva }),
    });
}

// ==================== DOCENTE ====================

export async function getAlumnos(cursoId) {
    return await authFetch(`/getAlumnos?curso=${cursoId}`);
}

export async function guardarAsistencia(datos) {
    return await authFetch('/guardarAsistencia', {
        method: 'POST',
        body: JSON.stringify({ datos }),
    });
}

export async function guardarMasivo(datos) {
    return await authFetch('/guardarMasivo', {
        method: 'POST',
        body: JSON.stringify({ datos }),
    });
}

export async function getExcusas(cursoId) {
    return await authFetch(`/getExcusas?curso=${cursoId}`);
}

export async function guardarReporte(datos) {
    return await authFetch('/guardarReporte', {
        method: 'POST',
        body: JSON.stringify({ datos }),
    });
}

export async function guardarTarea(datos) {
    return await authFetch('/guardarTarea', {
        method: 'POST',
        body: JSON.stringify({ datos }),
    });
}

export async function getTareasDocente(cursoId) {
    return await authFetch(`/getTareasDocente?curso=${cursoId}`);
}

export async function manageTarea(id, tipo) {
    return await authFetch('/manageTarea', {
        method: 'POST',
        body: JSON.stringify({ id, tipo }),
    });
}

export async function getHistorial(curso, mes, anio) {
    return await authFetch(`/getHistorial?curso=${curso}&mes=${mes}&anio=${anio}`);
}

export async function getReporteNotas(curso, periodo, filtro = '') {
    return await authFetch(`/getReporteNotas?curso=${curso}&periodo=${encodeURIComponent(periodo)}&filtro=${encodeURIComponent(filtro)}`);
}

// ==================== ESTUDIANTE ====================

export async function getStudentGradesDetail() {
    return await authFetch(`/getStudentGradesDetail`);
}

export async function getStudentGradesP() {
    return await authFetch(`/getStudentGradesP`);
}

export async function getStudentGradesRA() {
    return await authFetch(`/getStudentGradesRA`);
}

export async function getStudentAttendance() {
    return await authFetch(`/getStudentAttendance`);
}

export async function getStudentExcuses() {
    return await authFetch(`/getStudentExcuses`);
}

export async function getTareasEstudiante() {
    return await authFetch(`/getTareasEstudiante`);
}

export async function getStudentReports() {
    return await authFetch(`/getStudentReports`);
}

// ==================== ORIENTACIÓN ====================

export async function buscarEstudiante(id) {
    return await authFetch(`/buscarEstudiante?id=${id}`);
}

export async function guardarExcusa(payload) {
    return await authFetch('/excusa', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export async function guardarPase(payload) {
    return await authFetch('/pase', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

// ==================== HORARIO Y AUDITORÍA ====================

export async function getHorario(id, tipo) {
    return await authFetch(`/getHorario?id=${encodeURIComponent(id)}&tipo=${tipo}`);
}

export async function getAuditoriaAsistencia() {
    return await authFetch('/getAuditoriaAsistencia');
}
