// api.js — Centraliza todas las peticiones HTTP al backend
const API_BASE = 'https://backend-ipmhu.onrender.com/api';
let AUTH_TOKEN = null;

export function setToken(token) {
    AUTH_TOKEN = token;
}

// Convierte recursivamente las claves de un objeto a minúsculas
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

// Envoltorio para fetch con token y manejo de errores
async function authFetch(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...(AUTH_TOKEN && { Authorization: `Bearer ${AUTH_TOKEN}` }),
        ...options.headers,
    };

    try {
        const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return normalizeKeys(data); // <-- normaliza todas las claves a minúsculas
    } catch (err) {
        console.error(`Error en ${endpoint}:`, err);
        return null;
    }
}

// ==================== AUTENTICACIÓN ====================
export async function login(usuario, password) {
    const data = await authFetch('/login', {
        method: 'POST',
        body: JSON.stringify({ usuario, password }),
    });
    return data; // { success, token, user }
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
export async function getStudentGradesDetail(id) {
    return await authFetch(`/getStudentGradesDetail?id=${id}`);
}

export async function getStudentGradesP(id) {
    return await authFetch(`/getStudentGradesP?id=${id}`);
}

export async function getStudentGradesRA(id) {
    return await authFetch(`/getStudentGradesRA?id=${id}`);
}

export async function getStudentAttendance(id) {
    return await authFetch(`/getStudentAttendance?id=${id}`);
}

export async function getStudentExcuses(id) {
    return await authFetch(`/getStudentExcuses?id=${id}`);
}

export async function getTareasEstudiante(id) {
    return await authFetch(`/getTareasEstudiante?id=${id}`);
}

export async function getStudentReports(id) {
    return await authFetch(`/getStudentReports?id=${id}`);
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